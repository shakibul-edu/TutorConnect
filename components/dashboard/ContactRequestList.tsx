import React from 'react';
import Link from 'next/link';
import { ContactRequest } from '../../types';
import { Phone, MessageSquare, Clock, CheckCircle, XCircle, Hourglass, User } from 'lucide-react';

interface ContactRequestListProps {
  title: string;
  requests: ContactRequest[];
  role: 'student' | 'teacher';
  loading?: boolean;
  onStatusChange?: (id: number, status: 'accepted' | 'rejected') => Promise<void> | void;
  actionLoadingId?: number | null;
}

const statusChip = (status: ContactRequest['status']) => {
  const map: Record<ContactRequest['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    accepted: 'bg-green-100 text-green-800 border border-green-200',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const statusIcon = (status: ContactRequest['status']) => {
  if (status === 'accepted') return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
  return <Hourglass className="w-4 h-4 text-yellow-600" />;
};

const ContactRequestList: React.FC<ContactRequestListProps> = ({ title, requests, role, loading, onStatusChange, actionLoadingId }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {role === 'teacher' ? 'Requests sent to you as a tutor' : 'Requests you have sent to tutors'}
          </p>
        </div>
        <span className="text-sm font-bold text-gray-700">{requests.length}</span>
      </div>

      {loading ? (
        <div className="p-10 flex items-center justify-center text-gray-500 text-sm">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">No contact requests found.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {requests.map((req) => (
            <div key={req.id} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {role === 'teacher' ? req.student_name : `Teacher #${req.teacher}`}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest inline-flex items-center gap-1 ${statusChip(req.status)}`}>
                    {statusIcon(req.status)}
                    {req.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>
                    {role === 'teacher' ? req.student_phone : req.status === 'accepted' ? req.teacher_phone || 'Phone shared after accept' : 'Hidden until accepted'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Budget</span>
                  <span className="font-semibold">{req.fee_budget} BDT</span>
                </div>

                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="leading-relaxed">{req.message}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Updated {new Date(req.updated_at).toLocaleString()}</span>
                </div>

                {role === 'teacher' && req.status === 'pending' && onStatusChange && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => onStatusChange(req.id, 'accepted')}
                      disabled={actionLoadingId === req.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {actionLoadingId === req.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => onStatusChange(req.id, 'rejected')}
                      disabled={actionLoadingId === req.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4" />
                      {actionLoadingId === req.id ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                )}

                {role === 'student' && (
                  <div className="pt-2">
                    <Link
                      href={`/tutor-details/${req.teacher}`}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                    >
                      View Tutor
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactRequestList;
