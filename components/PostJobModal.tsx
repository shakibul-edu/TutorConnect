
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { User, QualificationType, Gender, TeachingMode } from '../types';
import { MOCK_MEDIUMS, MOCK_GRADES, MOCK_SUBJECTS } from '../services/mockData';
import { stateManager } from '../services/stateManager';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

const PostJobModal: React.FC<PostJobModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minSalary, setMinSalary] = useState(3000);
  const [maxSalary, setMaxSalary] = useState(8000);
  const [mediumId, setMediumId] = useState(1);
  const [gradeId, setGradeId] = useState(1);
  const [gender, setGender] = useState<Gender>('any');
  const [mode, setMode] = useState<TeachingMode>('offline');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stateManager.addJob({
      title,
      description,
      posted_by: user,
      min_salary: minSalary,
      max_salary: maxSalary,
      preferred_distance: 5,
      medium: MOCK_MEDIUMS.find(m => m.id === mediumId),
      grade: MOCK_GRADES.find(g => g.id === gradeId),
      subjects: [MOCK_SUBJECTS[0]], // Simplified for demo
      gender,
      teaching_mode: mode,
      highest_qualification: 'honours'
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Post a Tuition Requirement</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Need Math Tutor for Class 8"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
              <select value={mediumId} onChange={e => setMediumId(Number(e.target.value))} className="w-full px-4 py-2 border rounded-md">
                {MOCK_MEDIUMS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select value={gradeId} onChange={e => setGradeId(Number(e.target.value))} className="w-full px-4 py-2 border rounded-md">
                {MOCK_GRADES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (BDT)</label>
              <input type="number" value={minSalary} onChange={e => setMinSalary(Number(e.target.value))} className="w-full px-4 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (BDT)</label>
              <input type="number" value={maxSalary} onChange={e => setMaxSalary(Number(e.target.value))} className="w-full px-4 py-2 border rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tutor Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value as Gender)} className="w-full px-4 py-2 border rounded-md">
                <option value="any">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value as TeachingMode)} className="w-full px-4 py-2 border rounded-md">
                <option value="offline">Offline / Home</option>
                <option value="online">Online</option>
                <option value="any">Both</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Describe your requirements, schedule, and any specific preferences..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Post Job Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJobModal;
