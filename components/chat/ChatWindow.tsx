'use client';

import React, { useEffect, useState, useRef } from 'react';
import { appwriteDatabases, APPWRITE_DB_ID, APPWRITE_MESSAGES_COL_ID, appwriteClient } from '../../lib/appwrite';
import { ID, Query, Models } from 'appwrite';
import { useAuth } from '../../lib/auth';
import { Send, Loader2 } from 'lucide-react';

interface Message extends Models.Document {
  conversationKey: string;
  senderId: string; // The appwrite DB seems to use an integer type, but ID.unique() strings work fine
  senderType: string; // 'student' or 'teacher'
  senderName: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface ChatWindowProps {
  conversationKey: string;
  senderType: 'student' | 'teacher';
  otherPersonName: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationKey, senderType, otherPersonName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial messages and set up subscription
  useEffect(() => {
    if (!conversationKey) return;

    const fetchMessages = async () => {
      try {
        const response = await appwriteDatabases.listDocuments<Message>(
          APPWRITE_DB_ID,
          APPWRITE_MESSAGES_COL_ID,
          [
            Query.equal('conversationKey', conversationKey),
            Query.orderAsc('createdAt'),
            Query.limit(100) // Adjust if needed
          ]
        );
        setMessages(response.documents);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const unsubscribe = appwriteClient.subscribe<Message>(
      `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_MESSAGES_COL_ID}.documents`,
      (response) => {
        if (
          response.events.includes('databases.*.collections.*.documents.*.create') &&
          response.payload.conversationKey === conversationKey
        ) {
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            if (prev.some(m => m.$id === response.payload.$id)) {
              return prev;
            }
            return [...prev, response.payload];
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationKey]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversationKey) return;

    setSending(true);
    try {
      const now = new Date().toISOString();
      const messageData = {
        conversationKey,
        senderId: user.id.toString(), // The DB expects integer but we pass as string if it complains
        senderType,
        senderName: user.first_name || user.username,
        content: newMessage.trim(),
        createdAt: now,
        read: false,
      };

      // Depending on the DB schema, senderId might need to be an integer. Let's cast it if the appwrite collection is strict.
      // If it's defined as integer in Appwrite, use `Number(user.id)`. For safety, assuming Number.
      // Provide typing explicitly as string or fallback to any if SDK expects strictly what Message defines
      await appwriteDatabases.createDocument<Message>(
        APPWRITE_DB_ID,
        APPWRITE_MESSAGES_COL_ID,
        ID.unique(),
        {
            ...messageData,
            senderId: Number(user.id) as any
        }
      );

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Fallback if schema is slightly different (e.g. senderId as string)
      try {
          const now = new Date().toISOString();
          await appwriteDatabases.createDocument<Message>(
              APPWRITE_DB_ID,
              APPWRITE_MESSAGES_COL_ID,
              ID.unique(),
              {
                  conversationKey,
                  senderId: user.id.toString(),
                  senderType,
                  senderName: user.first_name || user.username,
                  content: newMessage.trim(),
                  createdAt: now,
                  read: false,
              }
          );
          setNewMessage('');
      } catch (innerError) {
         console.error("Fallback string senderId failed as well.", innerError);
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <div className="p-3 border-b bg-white shadow-sm flex items-center shrink-0">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 mr-3">
              {otherPersonName.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-semibold text-gray-900">{otherPersonName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-auto text-sm h-full flex items-center justify-center">
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.senderId) === String(user?.id);
            return (
              <div
                key={msg.$id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-xs text-gray-500 mb-1 ml-1">{msg.senderName}</span>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-white border-t mt-auto shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-full text-sm outline-none transition-colors"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shrink-0"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
