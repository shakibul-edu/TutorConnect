
import React, { useEffect, useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { User, Gender, TeachingMode, Medium, Grade, Subject, AvailabilitySlot } from '../types';
import MultiSelect from './MultiSelect';
import Availability from './Availability';
import { getMediums, getGradesbyMedium, getSubjects, createJobPost, submitJobPostAvailability } from '../services/backend';
import { validateAvailabilitySlots } from '../utils/availability';
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
  const [phone, setPhone] = useState('');
  const [budgetSalary, setBudgetSalary] = useState(4000);
  const [mediumOptions, setMediumOptions] = useState<Medium[]>([]);
  const [gradeOptions, setGradeOptions] = useState<Grade[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Subject[]>([]);
  const [selectedMedium, setSelectedMedium] = useState<number | ''>('');
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [gender, setGender] = useState<Gender>('any');
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('offline');
  const [minQualification, setMinQualification] = useState('degree');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { start: "16:00", end: "21:00", days: ["MO", "TU", "WE", "TH", "FR"] },
  ]);
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('You must be logged in to post a job.');
      return;
    }

    if (!selectedMedium || !selectedGrade || selectedSubjects.length === 0) {
      toast.error('Please select medium, grade, and at least one subject.');
      return;
    }

    const availabilityValidation = validateAvailabilitySlots(availability);
    if (!availabilityValidation.isValid) {
      toast.error(availabilityValidation.errors[0] || 'Please fix availability details.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        phone: phone || 'N/A',
        budget_salary: budgetSalary,
        gender,
        teaching_mode: teachingMode,
        minimum_qualification: minQualification,
        medium: Number(selectedMedium),
        grade: Number(selectedGrade),
        subject_list: selectedSubjects
      };

      const jobPost = await createJobPost(token, payload);
      
      if (jobPost && jobPost.id) {
        // Create Availability
        const availPayload = availability.map(slot => ({
          job_post: jobPost.id,
          start: slot.start,
          end: slot.end,
          days: slot.days,
        }));

        if (availPayload.length > 0) {
          await submitJobPostAvailability(token, availPayload);
        }
      }

      toast.success('Job posted successfully!');
      onSuccess();
      onClose();
      
      // Reset form
      setTitle('');
      setDescription('');
      setPhone('');
      setSelectedMedium('');
      setSelectedGrade('');
      setSelectedSubjects([]);
      setAvailability([{ start: "16:00", end: "21:00", days: ["MO", "TU", "WE", "TH", "FR"] }]);
    } catch (error) {
      console.error('Job post error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to post job';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              placeholder="01XXXXXXXXX"
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

          <div>
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget / Salary</label>
              <span className="text-sm font-bold text-indigo-600">{budgetSalary} BDT</span>
            </div>
            <input
              type="range"
              min={500}
              max={25000}
              step={500}
              value={budgetSalary}
              onChange={e => setBudgetSalary(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
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
              <select value={teachingMode} onChange={e => setTeachingMode(e.target.value as TeachingMode)} className="w-full px-4 py-2 border rounded-md">
                <option value="offline">Offline / Home</option>
                <option value="online">Online</option>
                <option value="any">Both</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Qualification Required</label>
            <select
              value={minQualification}
              onChange={e => setMinQualification(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            >
              <option value="ssc">SSC</option>
              <option value="hsc">HSC</option>
              <option value="degree">Degree</option>
              <option value="honours">Honours</option>
              <option value="master">Masters</option>
              <option value="phd">PhD</option>
            </select>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desired Tutoring Days & Times</label>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <Availability 
                slots={availability} 
                setSlots={setAvailability} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={submitting}
              className="px-6 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Post Job Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJobModal;
