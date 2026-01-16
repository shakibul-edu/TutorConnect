import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { useSession } from 'next-auth/react';
import { toast } from '../lib/toast';
import Availability from './Availability';
import MultiSelect from './MultiSelect';
import { AvailabilitySlot, Education, Qualification, Gender, TeachingMode, Medium, Grade, Subject } from '../types';
import { Save, Loader2 } from 'lucide-react';
import EducationSection from './profile-form/EducationSection';
import QualificationSection from './profile-form/QualificationSection';
import { 
    getMediums, 
    getGradesbyMedium, 
    getSubjects, 
    getTeacherProfile, 
    createTeacher, 
    updateTeacher,
    getAcademicProfile,
    getQualification,
    getSlots,
    // createAvailability, // Not used if we assume updateAvailability handles list replacement or we rely on loop
    updateAvailability,
    submitAcademicProfiles,
    updateAcademicProfile,
    deleteAcademicProfile, 
    submitQualification,
    updateQualification,
    deleteQualification
} from '../services/backend';

const TeacherProfileForm: React.FC = () => {
  const { user } = useAuth();
  // @ts-ignore
  const { data: session } = useSession();
  const { push } = useRouter();

  // Profile ID tracking
  const [profileId, setProfileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [bio, setBio] = useState('');
  const [minSalary, setMinSalary] = useState(5000);
  const [experience, setExperience] = useState(0);
  const [gender, setGender] = useState<Gender>('male');
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('online');
  const [distance, setDistance] = useState(5);
  
  // Selection Options (Fetched from API)
  const [mediumOptions, setMediumOptions] = useState<Medium[]>([]);
  const [gradeOptions, setGradeOptions] = useState<Grade[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Subject[]>([]);

  // Selection State (IDs)
  const [selectedMediums, setSelectedMediums] = useState<number[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

  // Complex State
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { start: "16:00", end: "21:00", days: ["Mon", "Wed", "Fri"] },
  ]);

  const [educationList, setEducationList] = useState<Education[]>([]);
  const [initialEducationIds, setInitialEducationIds] = useState<number[]>([]);

  const [qualificationList, setQualificationList] = useState<Qualification[]>([]);
  const [initialQualificationIds, setInitialQualificationIds] = useState<number[]>([]);
  
  // Helper to get token
  // @ts-ignore
  const token = session?.id_token || (session as any)?.token; // Fallback

  // Load Metadata (Mediums)
  useEffect(() => {
    if (token) {
        getMediums(token).then((data) => {
            if (data) setMediumOptions(data);
        }).catch(err => console.error("Failed to fetch mediums", err));
    }
  }, [token]);

  // Load Grades when Mediums change
  useEffect(() => {
      if (token && selectedMediums.length > 0) {
          getGradesbyMedium(token, { medium_id: selectedMediums.map(String) }).then(data => {
              if (data) setGradeOptions(data);
          }).catch(err => console.error("Failed to fetch grades", err));
      } else {
          setGradeOptions([]);
      }
  }, [token, selectedMediums]);

  // Load Subjects when Grades change
  useEffect(() => {
      if (token && selectedGrades.length > 0) {
          getSubjects(token, { grade_id: selectedGrades.map(String) }).then(data => {
              if (data) setSubjectOptions(data);
          }).catch(err => console.error("Failed to fetch subjects", err));
      } else {
          setSubjectOptions([]);
      }
  }, [token, selectedGrades]);


  // Load existing profile data
  useEffect(() => {
    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // 1. Teacher Profile
            const profileData = await getTeacherProfile(token);
            const profile = Array.isArray(profileData) ? profileData[0] : profileData;
            
            if (profile) {
                setProfileId(profile.id);
                setBio(profile.bio);
                setMinSalary(profile.min_salary);
                setExperience(profile.experience_years);
                setGender(profile.gender as Gender);
                setTeachingMode(profile.teaching_mode as TeachingMode);
                setDistance(profile.preferred_distance);
                
                setSelectedMediums(profile.medium?.map((m: any) => m.id) || []);
                setSelectedGrades(profile.grade?.map((g: any) => g.id) || []);
                setSelectedSubjects(profile.subject?.map((s: any) => s.id) || []);
            }

            // 2. Related Data (Education, Qualification, Slots)
            const [eduRes, qualRes, slotRes] = await Promise.all([
                getAcademicProfile(token),
                getQualification(token),
                getSlots(token)
            ]);

            if (eduRes) {
                 const mappedEdu = eduRes.map((e: any) => ({
                    id: e.id,
                    institution: e.institution,
                    degree: e.degree,
                    year: e.graduation_year,
                    result: e.results,
                    certificate: e.certificates
                }));
                setEducationList(mappedEdu);
                setInitialEducationIds(mappedEdu.map((e: any) => e.id));
            }

            if (qualRes) {
                const mappedQual = qualRes.map((q: any) => ({
                    id: q.id,
                    organization: q.organization,
                    skill: q.skill,
                    year: q.year,
                    result: q.results,
                    certificate: q.certificates
                }));
                setQualificationList(mappedQual);
                setInitialQualificationIds(mappedQual.map((q: any) => q.id));
            }

            if (slotRes) {
                // Assuming slots come as array of objects compatible with AvailabilitySlot
                setAvailability(slotRes);
            }

        } catch (error) {
            console.error("Error fetching profile data", error);
        } finally {
            setLoading(false);
        }
    };

    if (token) {
        fetchData();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
        toast.error("You must be logged in to save.");
        return;
    }
    
    setSubmitting(true);

    const promise = (async () => {
        const profileData = {
            bio,
            min_salary: minSalary,
            experience_years: experience,
            gender,
            teaching_mode: teachingMode,
            preferred_distance: distance,
            medium: selectedMediums,
            grade: selectedGrades,
            subject: selectedSubjects,
            highest_qualification: 'honours', 
        };

        let currentProfileId = profileId;

        // 1. Create/Update Profile
        if (profileId) {
            await updateTeacher(token, String(profileId), profileData as any);
        } else {
            const newProfile = await createTeacher(token, profileData as any);
            if (newProfile && newProfile.id) {
                currentProfileId = newProfile.id;
                setProfileId(currentProfileId);
            }
        }

        if (!currentProfileId) {
             throw new Error("Could not create profile ID.");
        }

        // 2. Availability
        if (availability.length > 0) {
            const availData = availability.map(a => ({
                id: a.id,
                start: a.start,
                end: a.end,
                days: a.days,
                teacher: currentProfileId 
            }));
            await updateAvailability(token, String(currentProfileId), availData);
        }

        // 3. Education
        const currentEduIds = educationList.map(e => e.id).filter(Boolean) as number[];
        const eduToDelete = initialEducationIds.filter(id => !currentEduIds.includes(id));
        for (const id of eduToDelete) {
            await deleteAcademicProfile(token, String(id));
        }

        for (const edu of educationList) {
             const formData = new FormData();
             formData.append('institution', edu.institution);
             formData.append('degree', edu.degree);
             formData.append('graduation_year', edu.year);
             formData.append('results', edu.result);
             formData.append('teacher', String(currentProfileId));
             
             if (edu.certificate instanceof File) {
                 formData.append('certificates', edu.certificate);
             } 

             if (edu.id) {
                 await updateAcademicProfile(token, String(edu.id), formData);
             } else {
                 await submitAcademicProfiles(token, formData);
             }
        }

        // 4. Qualification
        const currentQualIds = qualificationList.map(q => q.id).filter(Boolean) as number[];
        const qualToDelete = initialQualificationIds.filter(id => !currentQualIds.includes(id));
        for (const id of qualToDelete) {
             await deleteQualification(token, String(id));
        }

        for (const qual of qualificationList) {
             const formData = new FormData();
             formData.append('organization', qual.organization);
             formData.append('skill', qual.skill);
             formData.append('year', qual.year);
             formData.append('results', qual.result);
             formData.append('teacher', String(currentProfileId));

             if (qual.certificate instanceof File) {
                 formData.append('certificates', qual.certificate);
             }

             if (qual.id) {
                 await updateQualification(token, String(qual.id), formData);
             } else {
                 await submitQualification(token, formData);
             }
        }
    })();

    toast.promise(promise, {
        loading: 'Saving profile...',
        success: 'Profile updated successfully!',
        error: (err) => `Failed to update: ${err.message || 'Unknown error'}`
    })
    .then(() => {
        push('dashboard');
    })
    .finally(() => {
        setSubmitting(false);
    });
  };

  if(!session && !user) {
      return (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg">
             <h2 className="text-xl font-bold text-gray-800">Please Sign In</h2>
             <p className="text-gray-600 mt-2">You need to be logged in to edit your profile.</p>
        </div>
      );
  }

  // Pass loaded options to MultiSelect
  const mappedMediums = mediumOptions.map(m => ({id: m.id, name: m.name}));
  const mappedGrades = gradeOptions.map(g => ({id: g.id, name: g.name}));
  const mappedSubjects = subjectOptions.map(s => ({id: s.id, name: s.name}));

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 border-b pb-2">
            {profileId ? 'Edit Teacher Profile' : 'Create Teacher Profile'}
        </h1>
        <p className="text-gray-500 mt-2">Update your information to attract the right students.</p>
      </div>

      {loading && !profileId && !mediumOptions.length ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>
      ) : (
      <>
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
                options={mappedMediums} 
                selectedIds={selectedMediums}
                onChange={setSelectedMediums}
                placeholder="Search Mediums..."
            />

            <MultiSelect 
                label="Classes / Grades"
                options={mappedGrades}
                selectedIds={selectedGrades}
                onChange={setSelectedGrades}
                placeholder="Search Classes..."
            />

            <MultiSelect 
                label="Subjects"
                options={mappedSubjects}
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
          disabled={submitting}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
        >
          {submitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {profileId ? 'Update Profile' : 'Create Profile'}
        </button>
      </div>
      </>
      )}
    </form>
  );
};

export default TeacherProfileForm;
