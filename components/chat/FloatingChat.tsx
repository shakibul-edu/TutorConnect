'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { MessageCircle, X, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import { ContactRequest } from '../../types';
import { getContactRequests } from '../../services/backend';
import { useSession } from 'next-auth/react';
import ChatWindow from './ChatWindow';
import Link from 'next/link';
import { appwriteDatabases, APPWRITE_DB_ID, APPWRITE_MESSAGES_COL_ID } from '../../lib/appwrite';
import { Query } from 'appwrite';

const FloatingChat: React.FC = () => {
  const { user } = useAuth();
  // @ts-ignore
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeConversations, setActiveConversations] = useState<ContactRequest[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ContactRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // @ts-ignore
  const token = (session as any)?.backendAccess;

  useEffect(() => {
    if (!token || !user) return;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const allRequests = await getContactRequests(token, {});
        const requests = Array.isArray(allRequests) ? allRequests : [];

        // Filter for accepted requests with a conversation_key
        const active = requests.filter(
          (req) => req.status === 'accepted' && req.conversation_key
        );
        setActiveConversations(active);

        // Fetch unread counts from Appwrite for each conversation
        const counts: Record<string, number> = {};
        for (const req of active) {
            if (req.conversation_key) {
                try {
                    const res = await appwriteDatabases.listDocuments(
                        APPWRITE_DB_ID,
                        APPWRITE_MESSAGES_COL_ID,
                        [
                            Query.equal('conversationKey', req.conversation_key),
                            Query.equal('read', false),
                            Query.notEqual('senderId', user.id) // Messages NOT from me
                        ]
                    );
                    counts[req.conversation_key] = res.total;
                } catch (e) {
                    console.error("Failed to fetch unread count", e);
                }
            }
        }
        setUnreadCounts(counts);

      } catch (error) {
        console.error('Error fetching conversations for chat', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [token, user]);

  if (!user) return null;

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    if (!isOpen) {
      setSelectedConversation(null); // Reset selection when opening
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Main Chat Modal */}
      {isOpen && !isMinimized && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 sm:w-96 h-[500px] mb-4 flex flex-col overflow-hidden transition-all duration-300">

          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              {selectedConversation && (
                <button onClick={() => setSelectedConversation(null)} className="hover:bg-indigo-700 p-1 rounded-full transition-colors mr-1">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="font-bold text-lg">
                {selectedConversation ? 'Chat' : 'Messages'}
              </h2>
            </div>
            <div className="flex gap-2">
              {selectedConversation && (
                <Link
                  href={`/chat/${selectedConversation.conversation_key}`}
                  className="hover:bg-indigo-700 p-1.5 rounded-full transition-colors"
                  title="Full Screen"
                >
                  <Maximize2 className="w-4 h-4" />
                </Link>
              )}
              <button onClick={() => setIsMinimized(true)} className="hover:bg-indigo-700 p-1.5 rounded-full transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 p-1.5 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
            {loading && !selectedConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : selectedConversation ? (
              // Chat Window
              <ChatWindow
                conversationKey={selectedConversation.conversation_key!}
                senderType={user.email === selectedConversation.teacher_email ? 'teacher' : 'student'}
                otherPersonName={user.email === selectedConversation.teacher_email ? selectedConversation.student_name : `Teacher #${selectedConversation.teacher}`}
              />
            ) : (
              // Conversation List
              <div className="flex-1 overflow-y-auto">
                {activeConversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                    <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-sm">No active conversations found.</p>
                    <p className="text-xs text-gray-400 mt-2">Accepted contact requests will appear here.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {activeConversations.map((conv) => {
                      const otherName = user.email === conv.teacher_email ? conv.student_name : `Teacher #${conv.teacher}`;
                      const unread = unreadCounts[conv.conversation_key!] || 0;
                      return (
                        <li
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 flex-shrink-0">
                                {otherName.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-semibold text-gray-900 truncate">{otherName}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">Tap to view messages</p>
                            </div>
                          </div>
                          {unread > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ml-2">
                                {unread}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleOpen}
        className="w-14 h-14 bg-indigo-600 rounded-full shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center text-white relative group"
        aria-label="Toggle Chat"
      >
        {isOpen && !isMinimized ? (
          <X className="w-6 h-6 transform transition-transform group-hover:rotate-90" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 border-2 border-indigo-600 w-4 h-4 rounded-full flex items-center justify-center">
                  <span className="sr-only">New messages</span>
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingChat;
