'use client';
import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { JobPost, TeacherProfile } from '../types';
import { stateManager } from '../services/stateManager';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPost;
  tutor: TeacherProfile;
  onSuccess: () => void;
}

const BidModal: React.FC<BidModalProps> = ({ isOpen, onClose, job, tutor, onSuccess }) => {
  const [salary, setSalary] = useState(job.min_salary);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stateManager.addBid({
      job_id: job.id,
      tutor,
      proposed_salary: salary,
      message
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Apply for Tuition</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 bg-indigo-50 border-b border-indigo-100">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Applying for</p>
          <h3 className="font-bold text-indigo-900">{job.title}</h3>
          <p className="text-sm text-indigo-700 mt-1">Offered Range: {job.min_salary} - {job.max_salary} BDT</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Proposed Monthly Salary (BDT)</label>
            <input
              type="number"
              required
              value={salary}
              onChange={e => setSalary(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter / Message to Parent</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Explain why you are the best fit for this role. Mention your relevant experience..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-6 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BidModal;
