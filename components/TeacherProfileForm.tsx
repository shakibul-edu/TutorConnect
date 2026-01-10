
import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import Availability from './Availability';
import MultiSelect from './MultiSelect';
import { MOCK_MEDIUMS, MOCK_GRADES, MOCK_SUBJECTS } from '../services/mockData';
import { stateManager } from '../services/stateManager';
import { AvailabilitySlot, Education, Qualification, TeacherProfile, Gender, TeachingMode } from '../types';
import { Save } from 'lucide-react';
import EducationSection from './profile-form/EducationSection';
import QualificationSection from './profile-form/QualificationSection';

const TeacherProfileForm: React.FC = () => {
  const { user } = useAuth();
  const { push } = useRouter();

  // Profile ID tracking
  const [profileId, setProfileId] = useState<number | null>(null);

  // Form State
  const [bio, setBio] = useState('');
  const [minSalary, setMinSalary] = useState(5000);
  const [experience, setExperience] = useState(0);
  const [gender, setGender] = useState<Gender>('male');
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('online');
  const [distance, setDistance] = useState(5);
  
  // Selection State (IDs)
  const [selectedMediums, setSelectedMediums] = useState<number[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

  // Complex State
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { start: "16:00", end: "21:00", days: ["Mon", "Wed", "Fri"] },
  ]);

  const [educationList, setEducationList] = useState<Education[]>([]);
  const [qualificationList, setQualificationList] = useState<Qualification[]>([]);

  // Load existing data
  useEffect(() => {
    if (user) {
        const existingProfile = stateManager.getTeacherProfile(user.id);
        if (existingProfile) {
            setProfileId(existingProfile.id);
            setBio(existingProfile.bio);
            setMinSalary(existingProfile.min_salary);
            setExperience(existingProfile.experience_years);
            setGender(existingProfile.gender);
            setTeachingMode(existingProfile.teaching_mode);
            setDistance(existingProfile.preferred_distance);
            
            setSelectedMediums(existingProfile.mediums.map(m => m.id));
            setSelectedGrades(existingProfile.grades.map(g => g.id));
            setSelectedSubjects(existingProfile.subjects.map(s => s.id));
            
            if (existingProfile.availability) setAvailability(existingProfile.availability);
            if (existingProfile.education) setEducationList(existingProfile.education);
            if (existingProfile.qualifications) setQualificationList(existingProfile.qualifications);
        }
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const fullMediums = MOCK_MEDIUMS.filter(m => selectedMediums.includes(m.id));
    const fullGrades = MOCK_GRADES.filter(g => selectedGrades.includes(g.id));
    const fullSubjects = MOCK_SUBJECTS.filter(s => selectedSubjects.includes(s.id));

    const newId = profileId || Math.floor(Math.random() * 1000) + 10;

    const updatedProfile: TeacherProfile = {
        id: newId,
        user: user,
        verified: profileId ? (stateManager.getTeacherProfile(user.id)?.verified || false) : false,
        bio,
        min_salary: minSalary,
        experience_years: experience,
        gender,
        teaching_mode: teachingMode,
        preferred_distance: distance,
        highest_qualification: 'honours', 
        mediums: fullMediums,
        grades: fullGrades,
        subjects: fullSubjects,
        availability,
        education: educationList,
        qualifications: qualificationList,
        profile_picture: stateManager.getTeacherProfile(user.id)?.profile_picture
    };
    
    stateManager.updateTeacherProfile(updatedProfile);
    alert("Profile updated successfully!");
    push('dashboard');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 border-b pb-2">Edit Teacher Profile</h1>
        <p className="text-gray-500 mt-2">Update your information to attract the right students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Tell students about your teaching style and experience..."
            />
          </div>

          <div>
             <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Salary Expectation</label>
                <span className="text-sm font-bold text-indigo-600">{minSalary} BDT</span>
             </div>
             <input
                type="range"
                min={500}
                max={25000}
                step={500}
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                <input
                    type="number"
                    min={0}
                    value={experience}
                    onChange={(e) => setExperience(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
              </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Mode</label>
                <select
                    value={teachingMode}
                    onChange={(e) => setTeachingMode(e.target.value as TeachingMode)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="any">Both</option>
                </select>
              </div>
              <div>
                 <div className="flex justify-between">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
                    <span className="text-sm font-bold text-indigo-600">{distance} km</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={20}
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
          </div>
        </div>

        <div className="space-y-6">
            <MultiSelect 
                label="Preferred Mediums"
                options={MOCK_MEDIUMS}
                selectedIds={selectedMediums}
                onChange={setSelectedMediums}
                placeholder="Search Mediums..."
            />

            <MultiSelect 
                label="Classes / Grades"
                options={MOCK_GRADES}
                selectedIds={selectedGrades}
                onChange={setSelectedGrades}
                placeholder="Search Classes..."
            />

            <MultiSelect 
                label="Subjects"
                options={MOCK_SUBJECTS}
                selectedIds={selectedSubjects}
                onChange={setSelectedSubjects}
                placeholder="Search Subjects..."
            />

            <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Availability</label>
                <Availability slots={availability} setSlots={setAvailability} />
            </div>
        </div>
      </div>

      <hr className="border-gray-200" />
      <EducationSection educationList={educationList} setEducationList={setEducationList} />
      <hr className="border-gray-200" />
      <QualificationSection qualificationList={qualificationList} setQualificationList={setQualificationList} />

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Save className="w-5 h-5 mr-2" />
          {profileId ? 'Update Profile' : 'Create Profile'}
        </button>
      </div>
    </form>
  );
};

export default TeacherProfileForm;
