'use client';

import React, { useEffect, useState, useRef } from 'react';
import { appwriteDatabases, APPWRITE_DB_ID, APPWRITE_MESSAGES_COL_ID, APPWRITE_PRESENCE_COL_ID, appwriteClient, buildStableUserId, ensureAppwriteSession } from '../../lib/appwrite';
import { ID, Query, Models } from 'appwrite';
import { useAuth } from '../../lib/auth';
import { useSession } from 'next-auth/react';
import { Send, Loader2, ArrowLeft } from 'lucide-react';

interface Message extends Models.Document {
  conversationKey: string;
  senderId: string; // The appwrite DB seems to use an integer type, but ID.unique() strings work fine
  senderType: string; // 'student' or 'teacher'
  senderName: string;
  content: string;
  createdAt?: string;
  read: boolean;
}

type MessageDeliveryStatus = 'sending' | 'sent' | 'failed';

interface ChatMessage extends Message {
  clientTempId?: string;
  sendStatus?: MessageDeliveryStatus;
  errorText?: string;
}

interface ChatWindowProps {
  conversationKey: string;
  senderType: 'student' | 'teacher';
  otherPersonName: string;
  otherUserEmail: string;
  contactRequestId?: number;
  onMarkedRead?: () => void;
  onBack?: () => void;
}

const ONLINE_WINDOW_MS = 70 * 1000;

const isOnlineFromLastSeen = (lastSeen: string | null): boolean => {
  const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : NaN;
  return Number.isFinite(lastSeenMs) && Date.now() - lastSeenMs <= ONLINE_WINDOW_MS;
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationKey,
  senderType,
  otherPersonName,
  otherUserEmail,
  contactRequestId,
  onMarkedRead,
  onBack,
}) => {
  const { user } = useAuth();
  // @ts-ignore
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedByCurrentUser, setBlockedByCurrentUser] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isCurrentUserBanned = Boolean((session as any)?.is_baned || (session as any)?.banned);

  // Scroll to bottom
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatLastSeen = (lastSeenIso: string) => {
    const lastSeenDate = new Date(lastSeenIso);
    if (Number.isNaN(lastSeenDate.getTime())) {
      return 'Offline';
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfLastSeenDay = new Date(lastSeenDate.getFullYear(), lastSeenDate.getMonth(), lastSeenDate.getDate());
    const diffInDays = Math.floor((startOfToday.getTime() - startOfLastSeenDay.getTime()) / 86400000);
    const timePart = lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (diffInDays === 0) {
      return `last seen today at ${timePart}`;
    }

    if (diffInDays === 1) {
      return `last seen yesterday at ${timePart}`;
    }

    if (diffInDays > 1 && diffInDays < 7) {
      const weekday = lastSeenDate.toLocaleDateString([], { weekday: 'long' });
      return `last seen ${weekday} at ${timePart}`;
    }

    const datePart = lastSeenDate.toLocaleDateString([], { day: '2-digit', month: 'short' });
    return `last seen ${datePart} at ${timePart}`;
  };

  const markConversationAsRead = async () => {
    if (!conversationKey) return;
    try {
      const res = await fetch('/api/appwrite/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationKey }),
      });

      if (res.ok) {
        onMarkedRead?.();
      }
    } catch (error) {
      console.error('Failed to mark messages as read', error);
    }
  };

  // Fetch initial messages and set up subscription
  useEffect(() => {
    if (!conversationKey || !user) return;

    let unsubscribe = () => {};
    let isCancelled = false;

    const fetchMessages = async () => {
      try {
        const isAppwriteReady = await ensureAppwriteSession();
        if (!isAppwriteReady || isCancelled) {
          return;
        }

        const response = await appwriteDatabases.listDocuments<Message>({
          databaseId: APPWRITE_DB_ID,
          collectionId: APPWRITE_MESSAGES_COL_ID,
          queries: [
            Query.equal('conversationKey', conversationKey),
            Query.orderAsc('$createdAt'),
            Query.limit(100), // Adjust if needed
          ],
        });
        if (!isCancelled) {
          setMessages(response.documents);
        }

        await markConversationAsRead();

        unsubscribe = appwriteClient.subscribe<Message>(
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

                const pendingIndex = prev.findIndex((m) => {
                  const sameSender = String(m.senderId) === String(response.payload.senderId);
                  const sameContent = m.content === response.payload.content;
                  const pending = m.sendStatus === 'sending';
                  return sameSender && sameContent && pending;
                });

                if (pendingIndex !== -1) {
                  const next = [...prev];
                  next[pendingIndex] = {
                    ...response.payload,
                    sendStatus: 'sent',
                    clientTempId: prev[pendingIndex].clientTempId,
                    errorText: undefined,
                  };
                  return next;
                }

                if (String(response.payload.senderId) !== String(user?.id)) {
                  markConversationAsRead();
                }
                return [...prev, { ...response.payload, sendStatus: 'sent' }];
              });
            }
          }
        );
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchMessages();

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [conversationKey, user]);

  useEffect(() => {
    if (!conversationKey || !otherUserEmail) return;

    let isCancelled = false;
    let unsubscribe = () => {};

    const updatePresenceFromLastSeen = (lastSeen: string | null) => {
      setIsOtherUserOnline(isOnlineFromLastSeen(lastSeen));
      setOtherUserLastSeen(lastSeen);
    };

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/appwrite/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ conversationKey }),
        });
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to send chat heartbeat', error);
        }
      }
    };

    const setupPresence = async () => {
      try {
        await sendHeartbeat();

        const statusRes = await fetch('/api/appwrite/presence/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ otherUserEmail }),
        });

        if (!statusRes.ok || isCancelled) return;

        const data = await statusRes.json() as { online: boolean; lastSeen?: string | null };
        const lastSeen = data.lastSeen || null;
        setIsOtherUserOnline(isOnlineFromLastSeen(lastSeen));
        setOtherUserLastSeen(lastSeen);

        const ready = await ensureAppwriteSession();
        if (!ready || isCancelled) return;

        const otherPresenceDocId = await buildStableUserId(otherUserEmail);
        if (isCancelled) return;

        unsubscribe = appwriteClient.subscribe(
          `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_PRESENCE_COL_ID}.documents.${otherPresenceDocId}`,
          (event) => {
            const payload = event.payload as { lastSeen?: string | null };
            updatePresenceFromLastSeen(payload.lastSeen || null);
          }
        );
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to setup chat presence subscription', error);
        }
      }
    };

    void setupPresence();

    const heartbeatTimer = setInterval(() => {
      void sendHeartbeat();
    }, 55000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isCancelled = true;
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
    };
  }, [conversationKey, otherUserEmail]);

  useEffect(() => {
    if (!otherUserLastSeen && !isOtherUserOnline) return;

    const timer = setInterval(() => {
      const nextOnline = isOnlineFromLastSeen(otherUserLastSeen);
      setIsOtherUserOnline((prev) => (prev === nextOnline ? prev : nextOnline));
    }, 10000);

    return () => {
      clearInterval(timer);
    };
  }, [otherUserLastSeen, isOtherUserOnline]);

  const refreshBlockStatus = async () => {
    if (!conversationKey) return;
    try {
      const res = await fetch('/api/appwrite/block-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationKey }),
      });

      if (!res.ok) return;
      const data = await res.json() as { blocked: boolean; blockedByCurrentUser: boolean; reason?: string | null };
      setIsBlocked(Boolean(data.blocked));
      setBlockedByCurrentUser(Boolean(data.blockedByCurrentUser));
      setBlockReason(data.reason || null);
    } catch (error) {
      console.error('Failed to fetch block status', error);
    }
  };

  useEffect(() => {
    refreshBlockStatus();
  }, [conversationKey]);

  const submitBlockReport = async ({
    shouldBlock,
    shouldReport,
    reason,
  }: {
    shouldBlock: boolean;
    shouldReport: boolean;
    reason: string;
  }) => {
    if (!conversationKey || !contactRequestId) {
      window.alert('Unable to submit report right now. Missing conversation details.');
      return;
    }

    try {
      const res = await fetch('/api/appwrite/block-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversation_key: conversationKey,
          contact_request: contactRequestId,
          reason,
          block: shouldBlock,
          report: shouldReport,
          otherUserEmail,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: 'Failed to submit report' }));
        throw new Error(payload.error || 'Failed to submit report');
      }

      if (shouldBlock) {
        await refreshBlockStatus();
      }
      if (shouldReport) {
        window.alert('Conversation reported and blocked successfully.');
      } else {
        window.alert('Conversation blocked successfully.');
      }
    } catch (error) {
      console.error('Failed to submit block/report', error);
      window.alert(error instanceof Error ? error.message : 'Failed to submit report');
    }
  };

  const handleBlockOnly = async () => {
    await submitBlockReport({
      shouldBlock: true,
      shouldReport: false,
      reason: '',
    });
  };

  const handleReportAndBlock = async () => {
    const reason = window.prompt('Please provide a reason for reporting this conversation:', '') || '';
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      window.alert('Reason is required to submit a report.');
      return;
    }

    await submitBlockReport({
      shouldBlock: true,
      shouldReport: true,
      reason: trimmedReason,
    });
  };

  const presenceLabel = isOtherUserOnline
    ? 'Online'
    : (otherUserLastSeen
      ? `Offline · ${formatLastSeen(otherUserLastSeen)}`
      : 'Offline');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversationKey) return;

    if (isCurrentUserBanned) {
      window.alert('Your account is banned. You cannot send messages.');
      return;
    }

    if (isBlocked) {
      window.alert('This conversation is blocked. You cannot send new messages.');
      return;
    }

    const content = newMessage.trim();
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const optimisticMessage: ChatMessage = {
      $id: tempId,
      $collectionId: APPWRITE_MESSAGES_COL_ID,
      $databaseId: APPWRITE_DB_ID,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      $sequence: 0,
      $permissions: [],
      conversationKey,
      senderId: String(user.id),
      senderType,
      senderName: user.username || user.email || 'You',
      content,
      read: true,
      createdAt: new Date().toISOString(),
      clientTempId: tempId,
      sendStatus: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const isAppwriteReady = await ensureAppwriteSession();
      if (!isAppwriteReady) {
        throw new Error('Appwrite session is not ready');
      }

      // Use server-side message creation to ensure proper permissions
      const response = await fetch('/api/appwrite/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationKey,
          content,
          senderType,
          otherUserEmail,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const errorText = payload?.error || 'Failed to send message';

        // Blocked/permission responses are expected UX states, not console errors.
        if (response.status === 403) {
          setIsBlocked(true);
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.clientTempId === tempId
              ? { ...msg, sendStatus: 'failed', errorText }
              : msg
          )
        );
        return;
      }

      const data = await response.json().catch(() => ({}));
      const createdMessage = data?.message as Message | undefined;

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.clientTempId !== tempId) return msg;
          if (createdMessage) {
            return {
              ...createdMessage,
              clientTempId: tempId,
              sendStatus: 'sent',
              errorText: undefined,
            };
          }

          return {
            ...msg,
            sendStatus: 'sent',
            errorText: undefined,
          };
        })
      );
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Failed to send message';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.clientTempId === tempId
            ? { ...msg, sendStatus: 'failed', errorText }
            : msg
        )
      );
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
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden mr-2 p-1 rounded-full hover:bg-gray-100 text-gray-600"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 mr-3">
              {otherPersonName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{otherPersonName}</h3>
          <p className={`text-xs ${isOtherUserOnline ? 'text-green-600' : 'text-gray-500'}`}>{presenceLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReportAndBlock}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              Report
            </button>
            <button
              onClick={handleBlockOnly}
              disabled={isBlocked}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {isBlocked ? 'Blocked' : 'Block'}
            </button>
          </div>
      </div>

      {(isCurrentUserBanned || isBlocked) && (
        <div className="px-4 py-2 text-xs border-b border-red-100 bg-red-50 text-red-700">
          {isCurrentUserBanned
            ? 'Messaging disabled: your account is banned.'
            : blockedByCurrentUser
              ? `You blocked this conversation${blockReason ? `: ${blockReason}` : ''}.`
              : `This conversation was blocked${blockReason ? `: ${blockReason}` : ''}.`}
        </div>
      )}

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
                key={msg.$id || msg.clientTempId}
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
                <div className="mt-1 flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.createdAt || msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && msg.sendStatus === 'sent' && (
                    <span className="text-[10px] text-gray-400">✓</span>
                  )}
                  {isMe && msg.sendStatus === 'failed' && (
                    <span className="text-[10px] text-red-500">
                      {msg.errorText || 'Failed to send'}
                    </span>
                  )}
                </div>
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
            disabled={isCurrentUserBanned || isBlocked}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isCurrentUserBanned || isBlocked}
            className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
