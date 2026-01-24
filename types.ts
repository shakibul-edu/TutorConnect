
export type Gender = 'male' | 'female' | 'any';
export type TeachingMode = 'online' | 'offline' | 'any';
export type QualificationType = 'ssc' | 'hsc' | 'degree' | 'honours' | 'master' | 'phd';
export type BidStatus = 'pending' | 'accepted' | 'rejected';
export type JobStatus = 'open' | 'hired' | 'completed';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_teacher: boolean;
  location?: { lat: number; lng: number };
  banned: boolean;
}

export interface Medium {
  id: number;
  name: string;
}

export interface Grade {
  id: number;
  name: string;
  sequence: number;
  mediums: Medium[];
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  subject_code?: string;
  grade_id?: number;
}

export interface AvailabilitySlot {
  id?: number;
  start: string;
  end: string;
  days: string[];
}

export interface Education {
  id?: number;
  institution: string;
  degree: string;
  year: string;
  result: string;
  certificate?: File | string;
}

export interface Qualification {
  id?: number;
  organization: string;
  skill: string;
  year: string;
  result: string;
  certificate?: File | string;
}

export interface TeacherProfile {
  id: number;
  user: User;
  verified: boolean;
  bio: string;
  highest_qualification: QualificationType;
  subjects: Subject[];
  grades: Grade[];
  min_salary: number;
  experience_years: number;
  mediums: Medium[];
  gender: Gender;
  teaching_mode: TeachingMode;
  preferred_distance: number;
  profile_picture?: string;
  availability?: AvailabilitySlot[];
  education?: Education[];
  qualifications?: Qualification[];
}

export type TeacherType = {
  id: string,
  name: string,
  gender: string,
  highest_qualification: string,
  medium_list: string[],
  maximum_grade: string,
  distance: number,
  expected_salary: number,
  profile_picture?: string,
  verified: boolean,
  teaching_mode: string,


}

export interface JobPost {
  id: number;
  title: string;
  description: string;
  posted_by: User;
  created_at: string;
  min_salary: number;
  max_salary: number;
  preferred_distance: number;
  medium?: Medium;
  grade?: Grade;
  subjects: Subject[];
  gender: Gender;
  teaching_mode: TeachingMode;
  highest_qualification: QualificationType;
  bids_count: number;
  status: JobStatus;
}

export interface Bid {
  id: number;
  job_id: number;
  tutor: TeacherProfile;
  proposed_salary: number;
  message: string;
  created_at: string;
  status: BidStatus;
}

export interface Review {
  id: number;
  job_id: number;
  reviewer_id: number;
  tutor_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Tutoria API-specific types
export type gradeType = {
  id: number;
  name: string;
  sequence: number;
  medium: string[];
};

export type mediumType = {
  id: number;
  name: string;
};

export type subjectType = {
  id: number;
  name: string;
  description: string;
  subject_code: string;
  grade: string;
};

export type availabilityType = {
  start: string;
  end: string;
  days: string[];
};

export type academicProfileType = {
  id: string | undefined;
  teacher: string | undefined;
  institution: string;
  degree: string;
  graduation_year: string;
  results: string;
  certificates: string;
  validated: boolean;
}

export type qualificationType = {
  id: string | undefined;
  teacher: string | undefined;
  organization: string;
  skill: string;
  year: string;
  results: string;
  certificates: string;
  validated: boolean;
}

export type ContactRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface ContactRequest {
  id: number;
  student_name: string;
  student_phone: string;
  message: string;
  status: ContactRequestStatus;
  email_opened_at?: string;
  created_at: string;
  updated_at: string;
  student: number;
  teacher: number;
  teacher_phone?: string;
}
