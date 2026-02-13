import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { useSession } from 'next-auth/react';
import { toast } from '../lib/toast';
import Availability from './Availability';
import MultiSelect from './MultiSelect';
import { AvailabilitySlot, Medium, Grade, Subject, Gender, TeachingMode } from '../types';
import { validateAvailabilitySlots } from '../utils/availability';
import { Save, Loader2 } from 'lucide-react';
import { 
    getMediums, 
    getGradesbyMedium, 
    getSubjects, 
    createJobPost,
    submitJobPostAvailability
} from '../services/backend';

const JobPostForm: React.FC = () => {
  const { user } = useAuth();
  // @ts-ignore
  const { data: session } = useSession();
  const { push } = useRouter();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [budgetSalary, setBudgetSalary] = useState(4000);
  const [gender, setGender] = useState<Gender>('any');
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('online');
  const [minQualification, setMinQualification] = useState('degree');

  // Selection Options
  const [mediumOptions, setMediumOptions] = useState<Medium[]>([]);
  const [gradeOptions, setGradeOptions] = useState<Grade[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Subject[]>([]);

  // Selection State
  const [selectedMedium, setSelectedMedium] = useState<number | ''>('');
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

  // Availability State
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { start: "16:00", end: "21:00", days: ["MO", "TU", "WE", "TH", "FR"] },
  ]);

  // @ts-ignore
  const token = (session as any)?.backendAccess;

  useEffect(() => {
    if (token) {
        getMediums(token).then((data) => {
            if (data) setMediumOptions(data);
        }).catch(err => console.error("Failed to fetch mediums", err));
    }
  }, [token]);

  useEffect(() => {
      if (token && selectedMedium) {
          getGradesbyMedium(token, { medium_id: [String(selectedMedium)] }).then(data => {
              if (data) setGradeOptions(data);
              // Reset grade if it doesn't belong to new medium (simplified: just reset)
              setSelectedGrade('');
          }).catch(err => console.error("Failed to fetch grades", err));
      } else {
          setGradeOptions([]);
      }
  }, [token, selectedMedium]);

  useEffect(() => {
      if (token && selectedGrade) {
          getSubjects(token, { grade_id: [String(selectedGrade)] }).then(data => {
              if (data) setSubjectOptions(data);
              setSelectedSubjects([]);
          }).catch(err => console.error("Failed to fetch subjects", err));
      } else {
          setSubjectOptions([]);
      }
  }, [token, selectedGrade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
        toast.error("You must be logged in to save.");
        return;
    }

    if (!selectedMedium || !selectedGrade || selectedSubjects.length === 0) {
        toast.error("Please select medium, class, and at least one subject.");
        return;
    }

    const availabilityValidation = validateAvailabilitySlots(availability);
    if (!availabilityValidation.isValid) {
        toast.error(availabilityValidation.errors[0] || "Please fix availability details.");
        return;
    }

    setSubmitting(true);

    try {
        const payload = {
            title,
            description,
            phone,
            budget_salary: budgetSalary,
            gender,
            teaching_mode: teachingMode,
            minimum_qualification: minQualification,
            medium_id: Number(selectedMedium),
            grade_id: Number(selectedGrade),
            subject_ids: selectedSubjects
        };

        const jobPost = await createJobPost(token, payload);
        
        if (jobPost && jobPost.id) {
            // Create Availability (same structure as Tutor Availability, with job_post id)
            const availPayload = availability.map(slot => ({
                job_post: jobPost.id,
                start: slot.start,
                end: slot.end,
                days: slot.days,
            }));

            if (availPayload.length > 0) {
                await submitJobPostAvailability(token, availPayload);
            }
            
            toast.success("Job post created successfully!");
            push('dashboard');
        }

    } catch (error) {
        console.error('Job Post submission error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(errorMessage);
    } finally {
        setSubmitting(false);
    }
  };

  if(!session && !user) {
      return (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg">
             <h2 className="text-xl font-bold text-gray-800">Please Sign In</h2>
             <p className="text-gray-600 mt-2">You need to be logged in to post a job.</p>
        </div>
      );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 border-b pb-2">
            Post a Tuition Job
        </h1>
        <p className="text-gray-500 mt-2">Describe your requirement to find the perfect tutor.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
            
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g. Need a Math Tutor for Class 10"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Start typing request description..."
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g. 01700000000"
              required
            />
          </div>

          {/* Salary */}
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
                onChange={(e) => setBudgetSalary(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
          </div>

          {/* Other Details */}
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Gender</label>
                <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="any">Any</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Mode</label>
                <select
                    value={teachingMode}
                    onChange={(e) => setTeachingMode(e.target.value as TeachingMode)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="online">Online</option>
                    <option value="offline">Home Tuition</option>
                    <option value="any">Any</option>
                </select>
              </div>
          </div>
          
           <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Qualification Required</label>
                <select
                    value={minQualification}
                    onChange={(e) => setMinQualification(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="ssc">SSC</option>
                    <option value="hsc">HSC</option>
                    <option value="degree">Degree</option>
                    <option value="honours">Honours</option>
                    <option value="masters">Masters</option>
                </select>
            </div>

        </div>

        {/* Right Column: Academic & Schedule */}
        <div className="space-y-6">
            
            {/* Medium (Single Select) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
                <select
                    value={selectedMedium}
                    onChange={(e) => setSelectedMedium(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                >
                    <option value="">Select Medium</option>
                    {mediumOptions.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>

            {/* Grade (Single Select) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class / Grade</label>
                <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={!selectedMedium}
                    required
                >
                    <option value="">Select Grade</option>
                    {gradeOptions.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
            </div>

            {/* Subjects (MultiSelect) */}
             <div>
                <MultiSelect 
                    label="Subjects" 
                    options={subjectOptions} 
                    selectedIds={selectedSubjects} 
                    onChange={setSelectedSubjects}
                    placeholder="Select required subjects..."
                />
            </div>

             {/* Availability */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desired Tutoring Days & Times</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <Availability 
                        slots={availability} 
                        setSlots={setAvailability} 
                    />
                </div>
            </div>

        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
         <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
         >
            {submitting && <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />}
            <Save className="-ml-1 mr-2 h-5 w-5" />
            Post Job
         </button>
      </div>

    </form>
  );
};

export default JobPostForm;
