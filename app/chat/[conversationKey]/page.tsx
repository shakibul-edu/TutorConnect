'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { useSession } from 'next-auth/react';
import { getContactRequests } from '../../../services/backend';
import { ContactRequest } from '../../../types';
import ChatWindow from '../../../components/chat/ChatWindow';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DedicatedChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationKey = params.conversationKey as string;
  const { user } = useAuth();
  // @ts-ignore
  const { data: session } = useSession();
  const [conversation, setConversation] = useState<ContactRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // @ts-ignore
  const token = (session as any)?.backendAccess;

  useEffect(() => {
    if (!token || !user || !conversationKey) return;

    const fetchConversationDetails = async () => {
      setLoading(true);
      try {
        const allRequests = await getContactRequests(token, {});
        const requests = Array.isArray(allRequests) ? allRequests : [];

        const currentConv = requests.find((req) => req.conversation_key === conversationKey);

        if (currentConv) {
          setConversation(currentConv);
        } else {
          // Could not find conversation or not authorized
          console.error('Conversation not found or unauthorized');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching conversation', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversationDetails();
  }, [token, user, conversationKey, router]);

  if (!user || loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversation Not Found</h2>
        <p className="text-gray-500 mb-6">The chat you are looking for does not exist or you don't have access.</p>
        <Link href="/dashboard" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const senderType = user.email === conversation.teacher_email ? 'teacher' : 'student';
  const otherPersonName = user.email === conversation.teacher_email ? conversation.student_name : `Teacher #${conversation.teacher}`;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-5xl mx-auto bg-white shadow-xl border-x border-gray-200">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                {otherPersonName.charAt(0).toUpperCase()}
             </div>
             <div>
               <h1 className="font-bold text-lg text-gray-900">{otherPersonName}</h1>
               <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden relative bg-gray-50">
        <ChatWindow
          conversationKey={conversationKey}
          senderType={senderType}
          otherPersonName={otherPersonName}
        />
      </div>
    </div>
  );
}
