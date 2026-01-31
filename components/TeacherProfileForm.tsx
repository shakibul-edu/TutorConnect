import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { useSession } from 'next-auth/react';
import { toast } from '../lib/toast';
import Availability from './Availability';
import MultiSelect from './MultiSelect';
import { AvailabilitySlot, Education, Qualification, Gender, TeachingMode, Medium, Grade, Subject } from '../types';
import { Save, Loader2, Upload, X } from 'lucide-react';
import EducationSection from './profile-form/EducationSection';
import QualificationSection from './profile-form/QualificationSection';
import { useLanguage } from '../contexts/LanguageContext';
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
    deleteQualification,
    createAvailability
} from '../services/backend';
import Image from 'next/image';
import { z } from 'zod';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const educationSchema = z.object({
    institution: z.string().min(1, "Institution is required"),
    degree: z.string().min(1, "Degree is required"),
    year: z.string().regex(/^\d{4}$/, "Year must be a 4-digit number"),
    result: z.string().min(1, "Result/GPA is required"),
    // Allow File or undefined/null (for existing entries that might not rely on file object here)
    // We only validate size if it's a new file instance
    certificate: z.custom<File | null | undefined>((val) => {
        return val instanceof File || val === null || val === undefined;
    }).refine((file) => {
        if (file instanceof File) return file.size <= MAX_FILE_SIZE;
        return true;
    }, "File size must be less than 2MB")
    .refine((file) => {
        if (file instanceof File) return ACCEPTED_IMAGE_TYPES.includes(file.type);
        return true;
    }, "Only image files (JPEG, PNG, WEBP) are allowed")
});

export const qualificationSchema = z.object({
    organization: z.string().min(1, "Organization is required"),
    skill: z.string().min(1, "Skill/Certification name is required"),
    year: z.string().regex(/^\d{4}$/, "Year must be a 4-digit number"),
    result: z.string().optional(),
    certificate: z.custom<File | null | undefined>((val) => {
        return val instanceof File || val === null || val === undefined;
    }).refine((file) => {
        if (file instanceof File) return file.size <= MAX_FILE_SIZE;
        return true;
    }, "File size must be less than 2MB")
    .refine((file) => {
        if (file instanceof File) return ACCEPTED_IMAGE_TYPES.includes(file.type);
        return true;
    }, "Only image files (JPEG, PNG, WEBP) are allowed")
});

const profileSchema = z.object({
  bio: z.string().min(50, "Bio must be at least 50 characters long to provide enough detail"),
  phone: z.string().regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, "Please enter a valid Bangladeshi phone number"),
  minSalary: z.number().min(500, "Minimum salary must be at least 500"),
  experience: z.number().min(0, "Experience cannot be negative"),
  medium_list: z.array(z.number()).min(1, "At least one medium must be selected"),
  grade_list: z.array(z.number()).min(1, "At least one class/grade must be selected"),
  subject_list: z.array(z.number()).min(1, "At least one subject must be selected"),
  profilePicture: z.custom<File | null | undefined>((val) => {
        return val instanceof File || val === null || val === undefined;
    }).refine((file) => {
        if (file instanceof File) return file.size <= MAX_FILE_SIZE;
        return true;
    }, "Profile picture must be less than 2MB")
    .refine((file) => {
        if (file instanceof File) return ACCEPTED_IMAGE_TYPES.includes(file.type);
        return true;
    }, "Only image files (JPEG, PNG, WEBP) are allowed"),
  education: z.array(educationSchema).max(3, "You can add a maximum of 3 education entries"),
  qualifications: z.array(qualificationSchema).max(3, "You can add a maximum of 3 qualifications"),
  availability: z.array(z.object({
      start: z.string(),
      end: z.string(),
      days: z.array(z.string()).min(1, "Select at least one day for this slot")
  })).min(1, "At least one availability slot is required")
});

const TeacherProfileForm: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  // @ts-ignore
  const { data: session } = useSession();
  const { push } = useRouter();

  // Profile ID tracking
  const [profileId, setProfileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
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
    { start: "16:00", end: "21:00", days: ["MO", "WE", "FR"] },
  ]);
  const [initialSlotIds, setInitialSlotIds] = useState<number[]>([]);
  const [initialAvailability, setInitialAvailability] = useState<AvailabilitySlot[] | null>(null);

  const [educationList, setEducationList] = useState<Education[]>([]);
  const [initialEducationIds, setInitialEducationIds] = useState<number[]>([]);
  const [initialEducationList, setInitialEducationList] = useState<Education[]>([]);

  const [qualificationList, setQualificationList] = useState<Qualification[]>([]);
  const [initialQualificationIds, setInitialQualificationIds] = useState<number[]>([]);
  const [initialQualificationList, setInitialQualificationList] = useState<Qualification[]>([]);

  const [initialProfile, setInitialProfile] = useState<{ 
    bio: string;
    phone: string;
    minSalary: number;
    experience: number;
    gender: Gender;
    teachingMode: TeachingMode;
    distance: number;
    medium_list: number[];
    grade_list: number[];
    subject_list: number[];
    hasPicture: boolean;
  } | null>(null);
  
  // Helper to get token
  // @ts-ignore
  const token = (session as any)?.backendAccess;

  // Handle profile picture change
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setProfilePicture(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicturePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  // Clear profile picture
  const clearProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

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
                setPhone(profile.phone || '');
                setMinSalary(profile.min_salary);
                setExperience(profile.experience_years);
                setGender(profile.gender as Gender);
                setTeachingMode(profile.teaching_mode as TeachingMode);
                setDistance(profile.preferred_distance);
                
                if (profile.profile_picture) {
                    setProfilePicturePreview(profile.profile_picture);
                }
                
                setSelectedMediums(profile.medium_list?.map((m: any) => m.id) || []);
                setSelectedGrades(profile.grade_list?.map((g: any) => g.id) || []);
                setSelectedSubjects(profile.subject_list?.map((s: any) => s.id) || []);

                setInitialProfile({
                  bio: profile.bio || '',
                  phone: profile.phone || '',
                  minSalary: profile.min_salary,
                  experience: profile.experience_years,
                  gender: profile.gender as Gender,
                  teachingMode: profile.teaching_mode as TeachingMode,
                  distance: profile.preferred_distance,
                  medium_list: profile.medium_list?.map((m: any) => m.id) || [],
                  grade_list: profile.grade_list?.map((g: any) => g.id) || [],
                  subject_list: profile.subject_list?.map((s: any) => s.id) || [],
                  hasPicture: Boolean(profile.profile_picture),
                });
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
              setInitialEducationList(mappedEdu);
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
              setInitialQualificationList(mappedQual);
            }

            if (slotRes && Array.isArray(slotRes)) {
                // Transform server slots format to AvailabilitySlot format
                // Group slots by time frame - combine days with same start and end time
                const slotsByTime = new Map<string, any>();
                const allSlotIds: number[] = [];

                for (const slot of slotRes) {
                    allSlotIds.push(slot.id);
                    const timeKey = `${slot.start_time}-${slot.end_time}`; // Group by time frame
                    const startTime = slot.start_time.substring(0, 5); // Convert "16:00:00" to "16:00"
                    const endTime = slot.end_time.substring(0, 5);     // Convert "21:00:00" to "21:00"

                    if (slotsByTime.has(timeKey)) {
                        // Add day to existing time slot
                        slotsByTime.get(timeKey).days.push(slot.days_of_week);
                    } else {
                        // Create new time slot
                        slotsByTime.set(timeKey, {
                            start: startTime,
                            end: endTime,
                            days: [slot.days_of_week]
                        });
                    }
                }

                // Convert map to array
                const mappedSlots = Array.from(slotsByTime.values());
                setAvailability(mappedSlots);
                setInitialSlotIds(allSlotIds); // Keep track of all original slot IDs
                setInitialAvailability(mappedSlots);
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
    setErrors({});

    try {
        // Validate with Zod
        const validationData = {
            bio,
            phone,
            minSalary,
            experience,
            medium_list: selectedMediums,
            grade_list: selectedGrades,
            subject_list: selectedSubjects,
            profilePicture,
            education: educationList,
            qualifications: qualificationList,
            availability
        };

        const result = profileSchema.safeParse(validationData);

        if (!result.success) {
            console.error("Validation failed", result);
            const newErrors: Record<string, string> = {};
            if (result.error && result.error.issues) {
                result.error.issues.forEach(err => {
                    // Map path to friendly string key
                    // Examples: "bio", "education.0.institution"
                    const path = err.path.join('.');
                    newErrors[path] = err.message;
                });
            }
            setErrors(newErrors);
            toast.error("Please fix the errors in the form.");
            setSubmitting(false);
            // Scroll to top or first error could be good, but simple toast for now
            return;
        }

      const isNewProfile = !profileId;
      const profileChanged = isNewProfile || (() => {
        if (!initialProfile) return true;
        const arraysEqual = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);
        return (
          bio !== initialProfile.bio ||
          phone !== initialProfile.phone ||
          minSalary !== initialProfile.minSalary ||
          experience !== initialProfile.experience ||
          gender !== initialProfile.gender ||
          teachingMode !== initialProfile.teachingMode ||
          distance !== initialProfile.distance ||
          !arraysEqual(selectedMediums, initialProfile.medium_list) ||
          !arraysEqual(selectedGrades, initialProfile.grade_list) ||
          !arraysEqual(selectedSubjects, initialProfile.subject_list) ||
          (profilePicture instanceof File)
        );
      })();

      const availabilityChanged = isNewProfile || (!initialAvailability || JSON.stringify(availability) !== JSON.stringify(initialAvailability));

      const educationChanged = (() => {
        // deletions
        const currentIds = educationList.map(e => e.id).filter(Boolean) as number[];
        const eduToDelete = initialEducationIds.filter(id => !currentIds.includes(id));
        if (eduToDelete.length) return true;
        // new items
        if (educationList.some(e => !e.id)) return true;
        // updates
        const initialMap = new Map(initialEducationList.map(e => [e.id, e]));
        return educationList.some(e => {
          if (!e.id) return false; // already handled new
          const orig = initialMap.get(e.id);
          if (!orig) return true;
          return (
            orig.institution !== e.institution ||
            orig.degree !== e.degree ||
            orig.year !== e.year ||
            orig.result !== e.result ||
            e.certificate instanceof File // file upload means change
          );
        });
      })();

      const qualificationChanged = (() => {
        const currentIds = qualificationList.map(q => q.id).filter(Boolean) as number[];
        const qualToDelete = initialQualificationIds.filter(id => !currentIds.includes(id));
        if (qualToDelete.length) return true;
        if (qualificationList.some(q => !q.id)) return true;
        const initialMap = new Map(initialQualificationList.map(q => [q.id, q]));
        return qualificationList.some(q => {
          if (!q.id) return false;
          const orig = initialMap.get(q.id);
          if (!orig) return true;
          return (
            orig.organization !== q.organization ||
            orig.skill !== q.skill ||
            orig.year !== q.year ||
            orig.result !== q.result ||
            q.certificate instanceof File
          );
        });
      })();

        const profileData = new FormData();
        profileData.append('bio', bio);
        profileData.append('phone', phone);
        profileData.append('min_salary', String(minSalary));
        profileData.append('experience_years', String(experience));
        profileData.append('gender', gender);
        profileData.append('teaching_mode', teachingMode);
        profileData.append('preferred_distance', String(distance));
       selectedMediums?.forEach(id => profileData.append('medium_list', String(id)));
       selectedGrades?.forEach(id => profileData.append('grade_list', String(id)));
       selectedSubjects?.forEach(id => profileData.append('subject_list', String(id)));
        profileData.append('highest_qualification', 'honours');
        
        if (profilePicture instanceof File) {
            profileData.append('profile_picture', profilePicture);
        }

        let currentProfileId = profileId;

        // 1. Create/Update Profile
        if (profileChanged) {
          if (profileId) {
            await updateTeacher(token, String(profileId), profileData as any);
            toast.success('Profile updated successfully!');
          } else {
            const newProfile = await createTeacher(token, profileData as any);
            toast.success('Profile created successfully!');
            if (newProfile && newProfile.id) {
              currentProfileId = newProfile.id;
              setProfileId(currentProfileId);
            }
          }
        }

        if (!currentProfileId) {
             throw new Error("Could not create profile ID.");
        }

        // 2. Availability (send grouped slots as provided by UI)
        const availPayload = availability.map(slot => ({
            start: slot.start,
            end: slot.end,
            days: slot.days,
        }));

        if (availabilityChanged && availPayload.length) {
            await createAvailability(token, availPayload);
            toast.success('Availability saved successfully!');
        }

        // 3. Education
        if (educationChanged) {
          const currentEduIds = educationList.map(e => e.id).filter(Boolean) as number[];
          const eduToDelete = initialEducationIds.filter(id => !currentEduIds.includes(id));
          for (const id of eduToDelete) {
            await deleteAcademicProfile(token, String(id));
            toast.success('Academic profile deleted successfully!');
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
               toast.success('Academic profile updated successfully!');
             } else {
               await submitAcademicProfiles(token, formData);
               toast.success('Academic profile submitted successfully!');
             }
          }
        }

        // 4. Qualification
        if (qualificationChanged) {
          const currentQualIds = qualificationList.map(q => q.id).filter(Boolean) as number[];
          const qualToDelete = initialQualificationIds.filter(id => !currentQualIds.includes(id));
          for (const id of qualToDelete) {
             await deleteQualification(token, String(id));
             toast.success('Qualification deleted successfully!');
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
               toast.success('Qualification updated successfully!');
             } else {
               await submitQualification(token, formData);
               toast.success('Qualification submitted successfully!');
             }
          }
        }

        // Navigate to dashboard on success
        push('dashboard');
    } catch (error) {
        console.error('Profile submission error:', error);
        // Error message is already formatted by FetchApi.parseErrorResponse
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(errorMessage);
    } finally {
        setSubmitting(false);
    }
  };

  const handleAddEducation = async (newEdu: Education) => {
    if (!profileId || !token) return;

    try {
        const formData = new FormData();
        formData.append('institution', newEdu.institution);
        formData.append('degree', newEdu.degree);
        formData.append('graduation_year', newEdu.year);
        formData.append('results', newEdu.result);
        formData.append('teacher', String(profileId));
        
        if (newEdu.certificate instanceof File) {
            formData.append('certificates', newEdu.certificate);
        }

        const response = await submitAcademicProfiles(token, formData);
        
        // Update local state with the returned object (which includes the new ID)
        // Assuming response is the created object or list. 
        // Based on typical backend patterns, it returns the created object.
        // We need to map it back to our Education type if necessary.
        const createdEdu: Education = {
            id: response.id,
            institution: response.institution,
            degree: response.degree,
            year: response.graduation_year,
            result: response.results,
            certificate: response.certificates
        };

        setEducationList([...educationList, createdEdu]);
        setInitialEducationList([...initialEducationList, createdEdu]);
        setInitialEducationIds([...initialEducationIds, createdEdu.id!]);
        
        toast.success("Education added successfully!");
    } catch (error) {
        console.error("Failed to add education", error);
        toast.error("Failed to add education entry");
        throw error; // Re-throw so child component implies failure
    }
  };

  const handleAddQualification = async (newQual: Qualification) => {
    if (!profileId || !token) return;

    try {
        const formData = new FormData();
        formData.append('organization', newQual.organization);
        formData.append('skill', newQual.skill);
        formData.append('year', newQual.year);
        formData.append('results', newQual.result || '');
        formData.append('teacher', String(profileId));

        if (newQual.certificate instanceof File) {
            formData.append('certificates', newQual.certificate);
        }

        const response = await submitQualification(token, formData);
        
        const createdQual: Qualification = {
            id: response.id,
            organization: response.organization,
            skill: response.skill,
            year: response.year,
            result: response.results,
            certificate: response.certificates
        };

        setQualificationList([...qualificationList, createdQual]);
        setInitialQualificationList([...initialQualificationList, createdQual]);
        setInitialQualificationIds([...initialQualificationIds, createdQual.id!]);

        toast.success("Qualification added successfully!");
    } catch (error) {
        console.error("Failed to add qualification", error);
        toast.error("Failed to add qualification entry");
        throw error;
    }
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
            {profileId ? t.actions.updateProfile : t.actions.createProfile}
        </h1>
        <p className="text-gray-500 mt-2">Update your information to attract the right students.</p>
      </div>

      {/* Profile Picture Upload Section */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">Profile Picture</label>
          <div className="relative">
            {profilePicturePreview ? (
              <div className="relative inline-block w-full">
                <Image
                  src={profilePicturePreview} 
                  alt="Profile preview" 
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-indigo-600 shadow-lg"
                />
                <button
                  type="button"
                  onClick={clearProfilePicture}
                  className="absolute top-0 right-12 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="absolute inset-0 w-32 h-32 rounded-full mx-auto opacity-0 cursor-pointer"
              title="Click to upload profile picture"
            />
          </div>

          <p className="text-xs text-gray-500 text-center mt-2">{t.profile.uploadPhoto}</p>
          {errors.profilePicture && <p className="text-red-500 text-xs text-center mt-1">{errors.profilePicture}</p>}
        </div>
      </div>

      {loading && !profileId && !mediumOptions.length ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>
      ) : (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.bio}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={t.profile.bioPlaceholder}
            />
            {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.phone}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder={t.profile.phonePlaceholder}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
             <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.minSalary}</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.experience} ({t.profile.years})</label>
                <input
                    type="number"
                    min={0}
                    value={experience}
                    onChange={(e) => setExperience(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.gender}</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.teachingMode}</label>
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
            <div>
                <MultiSelect 
                    label={t.profile.medium}
                    options={mappedMediums} 
                    selectedIds={selectedMediums}
                    onChange={setSelectedMediums}
                    placeholder="Search Mediums..."
                />
                {errors['medium_list'] && <p className="text-red-500 text-xs mt-1">{errors['medium_list']}</p>}
            </div>

            <div>
                <MultiSelect 
                    label={t.profile.class}
                    options={mappedGrades}
                    selectedIds={selectedGrades}
                    onChange={setSelectedGrades}
                    placeholder="Search Classes..."
                />
                {errors['grade_list'] && <p className="text-red-500 text-xs mt-1">{errors['grade_list']}</p>}
            </div>

            <div>
                <MultiSelect 
                    label={t.profile.subject}
                    options={mappedSubjects}
                    selectedIds={selectedSubjects}
                    onChange={setSelectedSubjects}
                    placeholder="Search Subjects..."
                />
                {errors['subject_list'] && <p className="text-red-500 text-xs mt-1">{errors['subject_list']}</p>}
            </div>

            <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.profile.availability}</label>
                <Availability slots={availability} setSlots={setAvailability} />
                {errors.availability && <p className="text-red-500 text-xs mt-1">{errors.availability}</p>}
            </div>
        </div>
      </div>

      <hr className="border-gray-200" />
      <EducationSection 
          educationList={educationList} 
          setEducationList={setEducationList} 
          error={errors.education}
          profileId={profileId}
          onAddEducation={handleAddEducation}
      />
      <hr className="border-gray-200" />
      <QualificationSection 
          qualificationList={qualificationList} 
          setQualificationList={setQualificationList} 
          error={errors.qualifications}
          profileId={profileId}
          onAddQualification={handleAddQualification}
      />

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
        >
          {submitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {profileId ? t.actions.updateProfile : t.actions.createProfile}
        </button>
      </div>
      </>
      )}
    </form>
  );
};

export default TeacherProfileForm;
