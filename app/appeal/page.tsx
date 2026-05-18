'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/lib/router';
import { toast } from '@/lib/toast';

interface AppealResponse {
  id?: number;
  feedback?: string;
  status?: string;
  [key: string]: any;
}

const getBaseUrl = () => process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:8000';

export default function AppealPage() {
  const { data: session, status } = useSession();
  const { push } = useRouter();
  const [feedback, setFeedback] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [appealData, setAppealData] = React.useState<AppealResponse | null>(null);

  const isBanned = Boolean((session as any)?.banned || (session as any)?.is_baned || (session as any)?.banned_error);
  const backendAccess = (session as any)?.backendAccess as string | undefined;

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      push('auth/signin');
      return;
    }

    if (status === 'authenticated' && !isBanned) {
      push('dashboard');
    }
  }, [status, isBanned, push]);

  const submitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = feedback.trim();
    if (!trimmed) {
      toast.error('Feedback is required.');
      return;
    }

    if (!backendAccess) {
      toast.error('Missing authentication token. Please sign in again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${getBaseUrl()}/appeal/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${backendAccess}`,
        },
        body: JSON.stringify({ feedback: trimmed }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = String(payload?.error || payload?.detail || 'Failed to submit appeal.');
        toast.error(errorMessage);
        return;
      }

      setAppealData(payload);
      if (payload?.status === 'pending') {
        toast.info('Appeal submitted. Current status: pending.');
      } else {
        toast.success('Appeal submitted successfully.');
      }
      setFeedback('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit appeal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading appeal page...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white px-4 py-12">
      <div className="mx-auto max-w-2xl bg-white border border-red-100 shadow-sm rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Appeal</h1>
        <p className="mt-3 text-sm sm:text-base text-gray-600">
          Your account is currently restricted. You can submit an appeal request below. Our team will review it and update the status.
        </p>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          Current restriction: account is banned.
        </div>

        {appealData?.status && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 text-sm">
            Appeal status: <span className="font-semibold">{appealData.status}</span>
            {appealData.status === 'pending' ? ' (Appeal is pending review.)' : ''}
          </div>
        )}

        <form onSubmit={submitAppeal} className="mt-6 space-y-4">
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-800">
            Feedback (required)
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Please explain why your account should be restored..."
            rows={6}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
            disabled={submitting}
            required
          />

          <button
            type="submit"
            disabled={submitting || !feedback.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Appeal'}
          </button>
        </form>
      </div>
    </div>
  );
}
