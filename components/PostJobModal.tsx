
import React, { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { User, Gender, TeachingMode, Medium, Grade, Subject } from '../types';
import MultiSelect from './MultiSelect';
import { stateManager } from '../services/stateManager';
import { getMediums, getGradesbyMedium, getSubjects } from '../services/backend';
import { toast } from '../lib/toast';

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
  const [mediumOptions, setMediumOptions] = useState<Medium[]>([]);
  const [gradeOptions, setGradeOptions] = useState<Grade[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Subject[]>([]);
  const [selectedMedium, setSelectedMedium] = useState<number | ''>('');
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [gender, setGender] = useState<Gender>('any');
  const [mode, setMode] = useState<TeachingMode>('offline');
  // @ts-ignore
  const { data: session } = useSession();
  // @ts-ignore
  const token = (session as any)?.backendAccess;

  if (!isOpen) return null;

  useEffect(() => {
    if (token) {
      getMediums(token)
        .then((data) => {
          if (data) setMediumOptions(data);
        })
        .catch(err => console.error('Failed to fetch mediums', err));
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedMedium) {
      getGradesbyMedium(token, { medium_id: [String(selectedMedium)] })
        .then(data => {
          if (data) setGradeOptions(data);
          setSelectedGrade('');
          setSelectedSubjects([]);
        })
        .catch(err => console.error('Failed to fetch grades', err));
    } else {
      setGradeOptions([]);
      setSelectedGrade('');
      setSelectedSubjects([]);
    }
  }, [token, selectedMedium]);

  useEffect(() => {
    if (token && selectedGrade) {
      getSubjects(token, { grade_id: [String(selectedGrade)] })
        .then(data => {
          if (data) setSubjectOptions(data);
          setSelectedSubjects([]);
        })
        .catch(err => console.error('Failed to fetch subjects', err));
    } else {
      setSubjectOptions([]);
      setSelectedSubjects([]);
    }
  }, [token, selectedGrade]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('You must be logged in to post a job.');
      return;
    }

    if (!selectedMedium || !selectedGrade || selectedSubjects.length === 0) {
      toast.error('Please select medium, grade, and at least one subject.');
      return;
    }

    const medium = mediumOptions.find(m => m.id === selectedMedium);
    const grade = gradeOptions.find(g => g.id === selectedGrade);
    const subject_list = subjectOptions.filter(s => selectedSubjects.includes(s.id));

    if (!medium || !grade || subject_list.length === 0) {
      toast.error('Invalid selection. Please try again.');
      return;
    }

    stateManager.addJob({
      title,
      description,
      posted_by: user.id,
      posted_by_name: (user.first_name + ' ' + user.last_name) || 'Anonymous',
      budget_salary: maxSalary,
      phone: 'N/A',
      minimum_qualification: 'honours',
      distance: 5,
      medium,
      grade,
      subject_list,
      gender,
      teaching_mode: mode,
      updated_at: new Date().toISOString(),
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
              <select value={selectedMedium} onChange={e => setSelectedMedium(Number(e.target.value))} className="w-full px-4 py-2 border rounded-md">
                <option value="">Select Medium</option>
                {mediumOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select value={selectedGrade} onChange={e => setSelectedGrade(Number(e.target.value))} className="w-full px-4 py-2 border rounded-md" disabled={!selectedMedium}>
                <option value="">Select Grade</option>
                {gradeOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <MultiSelect
              label="Subjects"
              options={subjectOptions}
              selectedIds={selectedSubjects}
              onChange={setSelectedSubjects}
              placeholder="Select required subjects..."
            />
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
