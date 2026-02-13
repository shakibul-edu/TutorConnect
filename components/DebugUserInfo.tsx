'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '../lib/auth';

export const DebugUserInfo: React.FC = () => {
  const { data: session, status } = useSession();
  const { user, toggleUserMode } = useAuth();

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg max-w-md z-50 text-xs font-mono">
      <div className="font-bold mb-2 text-yellow-400">🔍 Debug Info (Dev Only)</div>
      
      <div className="space-y-2">
        <div>
          <div className="text-gray-400">Session Status:</div>
          <div className="text-green-400">{status}</div>
        </div>

        <div>
          <div className="text-gray-400">Session Data:</div>
          <div className="text-blue-400">
            user_id: {(session as any)?.user_id || 'missing'}<br/>
            is_teacher: {String((session as any)?.is_teacher) || 'missing'}<br/>
            banned: {String((session as any)?.banned) || 'missing'}<br/>
            email: {session?.user?.email || 'missing'}
          </div>
        </div>

        <div>
          <div className="text-gray-400">User Object:</div>
          <div className="text-purple-400">
            id: {user?.id || 'missing'}<br/>
            is_teacher: {String(user?.is_teacher) || 'missing'}<br/>
            banned: {String(user?.banned) || 'missing'}<br/>
            email: {user?.email || 'missing'}
          </div>
        </div>

        {user && (
          <div className="pt-2">
            <button
              onClick={toggleUserMode}
              className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-bold text-sm"
            >
              🔄 Toggle Mode (Now: {user.is_teacher ? 'Teacher' : 'Student'})
            </button>
            <div className="text-xs text-gray-400 mt-1 text-center">
              Temporary workaround for testing
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-600">
          <div className="text-yellow-300">
            {(session as any)?.user_id ? (
              <div className="text-green-400">
                ✅ Backend is working correctly!
              </div>
            ) : (
              <>
                ⚠️ Backend NOT returning custom fields!
                <ol className="list-decimal ml-4 mt-1">
                  <li>Fix backend /auth/google/ endpoint</li>
                  <li>Ensure it returns user_id, is_teacher, banned</li>
                  <li>See BACKEND_DEBUG_STEPS.md</li>
                </ol>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
