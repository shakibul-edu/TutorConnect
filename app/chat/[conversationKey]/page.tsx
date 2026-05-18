'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { useSession } from 'next-auth/react';
import { getContactRequests } from '../../../services/backend';
import { ContactRequest } from '../../../types';
import ChatWindow from '../../../components/chat/ChatWindow';
import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import {
  APPWRITE_DB_ID,
  APPWRITE_MESSAGES_COL_ID,
  APPWRITE_PRESENCE_COL_ID,
  appwriteClient,
  buildStableUserId,
  ensureAppwriteSession,
} from '../../../lib/appwrite';

const ONLINE_WINDOW_MS = 70 * 1000;

const isOnlineFromLastSeen = (lastSeen: string | null): boolean => {
  const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : NaN;
  return Number.isFinite(lastSeenMs) && Date.now() - lastSeenMs <= ONLINE_WINDOW_MS;
};

export default function DedicatedChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationKey = params.conversationKey as string;
  const { user } = useAuth();
  // @ts-ignore
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ContactRequest[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ContactRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [presenceByConversation, setPresenceByConversation] = useState<Record<string, { online: boolean; lastSeen: string | null }>>({});
  const selectedConversationKeyRef = useRef<string | null>(null);

  useEffect(() => {
    selectedConversationKeyRef.current = selectedConversation?.conversation_key || null;
  }, [selectedConversation]);

  // @ts-ignore
  const token = (session as any)?.backendAccess;

  const formatTeacherLabel = (conv: ContactRequest) => {
    const teacherLabelBase = conv.teacher_name?.trim()
      || conv.teacher_email?.split('@')[0]?.replace(/[._-]+/g, ' ')?.trim()
      || 'Teacher';
    return `${teacherLabelBase} (#${conv.teacher})`;
  };

  const getOtherPersonName = (conv: ContactRequest) => {
    if (!user) return 'User';
    return user.email === conv.teacher_email ? conv.student_name : formatTeacherLabel(conv);
  };

  const getOtherUserEmail = (conv: ContactRequest) => {
    if (!user) return '';
    return user.email === conv.teacher_email ? String(conv.student_email || '') : String(conv.teacher_email || '');
  };

  const updatePresenceFromLastSeen = (key: string, lastSeen: string | null) => {
    const online = isOnlineFromLastSeen(lastSeen);

    setPresenceByConversation((prev) => ({
      ...prev,
      [key]: {
        online,
        lastSeen,
      },
    }));
  };

  const fetchUnreadCount = async (key: string) => {
    const res = await fetch('/api/appwrite/unread-count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ conversationKey: key }),
    });

    if (!res.ok) return 0;
    const data = (await res.json()) as { unreadCount: number };
    return data.unreadCount || 0;
  };

  const fetchPresence = async (conv: ContactRequest) => {
    const otherEmail = getOtherUserEmail(conv);
    if (!otherEmail || !conv.conversation_key) return;

    try {
      const res = await fetch('/api/appwrite/presence/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otherUserEmail: otherEmail }),
      });

      if (!res.ok) return;

      const data = (await res.json()) as { online: boolean; lastSeen: string | null };
      setPresenceByConversation((prev) => ({
        ...prev,
        [conv.conversation_key!]: {
          online: Boolean(data.online),
          lastSeen: data.lastSeen || null,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch conversation presence', error);
    }
  };

  const handleSelectConversation = (conv: ContactRequest) => {
    setSelectedConversation(conv);
    if (conv.conversation_key) {
      router.replace(`/chat/${conv.conversation_key}`);
    }
  };

  useEffect(() => {
    if (!token || !user || !conversationKey) return;

    const fetchConversationDetails = async () => {
      setLoading(true);
      try {
        const allRequests = await getContactRequests(token, {});
        const requests = Array.isArray(allRequests) ? allRequests : [];

        const activeConversations = requests.filter(
          (req: ContactRequest) => req.status === 'accepted' && req.conversation_key
        );
        setConversations(activeConversations);

        const currentConv = activeConversations.find((req) => req.conversation_key === conversationKey);
        if (!currentConv) {
          console.error('Conversation not found or unauthorized');
          router.push('/dashboard');
          return;
        }

        setSelectedConversation(currentConv);

        const unreadMap: Record<string, number> = {};
        for (const conv of activeConversations) {
          if (!conv.conversation_key) continue;
          unreadMap[conv.conversation_key] = await fetchUnreadCount(conv.conversation_key);
          await fetchPresence(conv);
        }
        setUnreadCounts(unreadMap);
      } catch (error) {
        console.error('Error fetching conversation', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversationDetails();
  }, [token, user, conversationKey, router]);

  useEffect(() => {
    if (!selectedConversation?.conversation_key || !user) return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/appwrite/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ conversationKey: selectedConversation.conversation_key }),
        });
      } catch (error) {
        console.error('Failed to send chat heartbeat', error);
      }
    };

    void sendHeartbeat();
    const timer = setInterval(sendHeartbeat, 55000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [selectedConversation, user]);

  useEffect(() => {
    if (!user || conversations.length === 0) return;

    let unsubscribe = () => {};
    let isCancelled = false;

    const conversationKeySet = new Set(
      conversations
        .map((conv) => conv.conversation_key)
        .filter((key): key is string => Boolean(key))
    );

    const subscribeToMessages = async () => {
      const ready = await ensureAppwriteSession();
      if (!ready || isCancelled) return;

      unsubscribe = appwriteClient.subscribe(
        `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_MESSAGES_COL_ID}.documents`,
        (event) => {
          if (!event.events.includes('databases.*.collections.*.documents.*.create')) {
            return;
          }

          const payload = event.payload as {
            conversationKey?: string;
            senderId?: string | number;
          };

          const key = String(payload.conversationKey || '');
          if (!key || !conversationKeySet.has(key)) return;

          const isMine = String(payload.senderId || '') === String(user.id);
          if (isMine) return;

          const isCurrentConversationOpen = key === selectedConversationKeyRef.current;
          if (isCurrentConversationOpen) {
            setUnreadCounts((prev) => ({ ...prev, [key]: 0 }));
            return;
          }

          setUnreadCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
        }
      );
    };

    void subscribeToMessages();

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [conversations, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPresenceByConversation((prev) => {
        let changed = false;
        const next: Record<string, { online: boolean; lastSeen: string | null }> = {};

        for (const [key, value] of Object.entries(prev)) {
          const online = isOnlineFromLastSeen(value.lastSeen);
          if (online !== value.online) {
            changed = true;
          }
          next[key] = {
            ...value,
            online,
          };
        }

        return changed ? next : prev;
      });
    }, 10000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!user || conversations.length === 0) return;

    let unsubscribe = () => {};
    let isCancelled = false;

    const subscribeToPresence = async () => {
      const ready = await ensureAppwriteSession();
      if (!ready || isCancelled) return;

      const keyByPresenceUserId: Record<string, string> = {};
      for (const conv of conversations) {
        const key = conv.conversation_key;
        if (!key) continue;

        const otherEmail = getOtherUserEmail(conv);
        if (!otherEmail) continue;

        try {
          const presenceUserId = await buildStableUserId(otherEmail);
          keyByPresenceUserId[presenceUserId] = key;
        } catch {
          // Ignore malformed identity and continue with remaining conversations.
        }
      }

      unsubscribe = appwriteClient.subscribe(
        `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_PRESENCE_COL_ID}.documents`,
        (event) => {
          const payload = event.payload as { userId?: string; lastSeen?: string | null };
          const presenceUserId = String(payload.userId || '');
          const key = keyByPresenceUserId[presenceUserId];
          if (!key) return;
          updatePresenceFromLastSeen(key, payload.lastSeen || null);
        }
      );
    };

    void subscribeToPresence();

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [conversations, user]);

  if (!user || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversation Not Found</h2>
        <p className="text-gray-500 mb-6">The chat you are looking for does not exist or you don't have access.</p>
        <Link href="/dashboard" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100">
      <div className="h-full w-full max-w-none mx-auto flex overflow-hidden">
        <aside className="hidden md:flex md:w-[340px] lg:w-[380px] bg-white border-r border-gray-200 flex-col shrink-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
            <p className="text-xs text-gray-500">Your active conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
              const label = getOtherPersonName(conv);
              const key = conv.conversation_key || '';
              const unread = unreadCounts[key] || 0;
              const presence = presenceByConversation[key];

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-indigo-50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-indigo-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
                    {unread > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${presence?.online ? 'text-green-600' : 'text-gray-500'}`}>
                    {presence?.online
                      ? 'Online'
                      : presence?.lastSeen
                        ? `Last seen ${new Date(presence.lastSeen).toLocaleString()}`
                        : 'Offline'}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 h-full overflow-hidden">
          {!selectedConversation && (
            <div className="md:hidden h-full bg-white">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Messages</h2>
              </div>
              <div className="overflow-y-auto h-[calc(100%-57px)]">
                {conversations.map((conv) => {
                  const label = getOtherPersonName(conv);
                  const key = conv.conversation_key || '';
                  const unread = unreadCounts[key] || 0;
                  const presence = presenceByConversation[key];

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-indigo-50"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-gray-900 truncate">{label}</p>
                        {unread > 0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{unread}</span>}
                      </div>
                      <p className={`text-xs mt-1 ${presence?.online ? 'text-green-600' : 'text-gray-500'}`}>
                        {presence?.online
                          ? 'Online'
                          : presence?.lastSeen
                            ? `Last seen ${new Date(presence.lastSeen).toLocaleString()}`
                            : 'Offline'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedConversation && (
            <div className="h-full">
              {(() => {
                const senderType = user.email === selectedConversation.teacher_email ? 'teacher' : 'student';
                const otherPersonName = getOtherPersonName(selectedConversation);
                return (
              <ChatWindow
                conversationKey={selectedConversation.conversation_key!}
                senderType={senderType}
                otherPersonName={otherPersonName}
                otherUserEmail={getOtherUserEmail(selectedConversation)}
                contactRequestId={selectedConversation.id}
                onBack={() => setSelectedConversation(null)}
                onMarkedRead={() => {
                  const key = selectedConversation.conversation_key;
                  if (key) {
                    setUnreadCounts((prev) => ({ ...prev, [key]: 0 }));
                  }
                }}
              />
                );
              })()}
            </div>
          )}

          {!selectedConversation && conversations.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-500 bg-white">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No active conversations yet.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
