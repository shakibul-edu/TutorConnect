
import { JobPost, TeacherProfile, Subject, Grade, Medium, User } from '../types';

export const MOCK_MEDIUMS: Medium[] = [
  { id: 1, name: 'English Medium' },
  { id: 2, name: 'Bangla Medium' },
];

export const MOCK_GRADES: Grade[] = [
  { id: 1, name: 'Class 5', sequence: 5, mediums: MOCK_MEDIUMS },
  { id: 2, name: 'Class 8', sequence: 8, mediums: MOCK_MEDIUMS },
  { id: 3, name: 'SSC / O-Level', sequence: 10, mediums: MOCK_MEDIUMS },
  { id: 4, name: 'HSC / A-Level', sequence: 12, mediums: MOCK_MEDIUMS },
];

export const MOCK_SUBJECTS: Subject[] = [
  { id: 1, name: 'Mathematics', subject_code: 'MATH101', grade_id: 3 },
  { id: 2, name: 'Physics', subject_code: 'PHY202', grade_id: 4 },
  { id: 3, name: 'English Literature', grade_id: 2 },
  { id: 4, name: 'Chemistry', subject_code: 'CHEM201', grade_id: 4 },
];

export const MOCK_USERS: User[] = [
  {
    id: 1,
    username: 'johndoe',
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_teacher: true,
    banned: false,
    location: { lat: 23.8103, lng: 90.4125 },
  },
  {
    id: 2,
    username: 'janeparent',
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_teacher: false,
    banned: false,
    location: { lat: 23.7944, lng: 90.4043 },
  },
];

export const MOCK_TEACHERS: TeacherProfile[] = [
  {
    id: 1,
    user: MOCK_USERS[0],
    verified: true,
    bio: 'Passionate math tutor with 5 years of experience helping students ace their exams. Specialized in algebra and calculus.',
    highest_qualification: 'master',
    subjects: [MOCK_SUBJECTS[0], MOCK_SUBJECTS[1]],
    grades: [MOCK_GRADES[2], MOCK_GRADES[3]],
    min_salary: 5000,
    experience_years: 5,
    mediums: [MOCK_MEDIUMS[0]],
    gender: 'male',
    teaching_mode: 'online',
    preferred_distance: 10,
    profile_picture: 'https://picsum.photos/200/200',
  },
  {
    id: 2,
    user: { ...MOCK_USERS[0], id: 3, username: 'sarah_tutor', first_name: 'Sarah', last_name: 'Connor' },
    verified: false,
    bio: 'Chemistry expert and friendly tutor for high school students.',
    highest_qualification: 'honours',
    subjects: [MOCK_SUBJECTS[3]],
    grades: [MOCK_GRADES[3]],
    min_salary: 4000,
    experience_years: 2,
    mediums: [MOCK_MEDIUMS[0], MOCK_MEDIUMS[1]],
    gender: 'female',
    teaching_mode: 'offline',
    preferred_distance: 5,
    profile_picture: 'https://picsum.photos/201/201',
  },
];

export const MOCK_JOBS: JobPost[] = [
  {
    id: 1,
    title: 'Need Math Tutor for Class 10',
    description: 'Looking for an experienced math tutor for my son who is preparing for his O-Levels. 3 days a week.',
    posted_by: MOCK_USERS[1],
    created_at: new Date().toISOString(),
    min_salary: 4000,
    max_salary: 6000,
    preferred_distance: 5,
    medium: MOCK_MEDIUMS[0],
    grade: MOCK_GRADES[2],
    subjects: [MOCK_SUBJECTS[0]],
    gender: 'any',
    teaching_mode: 'offline',
    highest_qualification: 'honours',
    bids_count: 3,
    // Fix: Added missing status property
    status: 'open',
  },
  {
    id: 2,
    title: 'Physics Help Needed Urgent',
    description: 'Online physics tutor needed for HSC preparation. Focus on mechanics.',
    posted_by: MOCK_USERS[1],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    min_salary: 5000,
    max_salary: 8000,
    preferred_distance: 0,
    medium: MOCK_MEDIUMS[0],
    grade: MOCK_GRADES[3],
    subjects: [MOCK_SUBJECTS[1]],
    gender: 'female',
    teaching_mode: 'online',
    highest_qualification: 'master',
    bids_count: 12,
    // Fix: Added missing status property
    status: 'open',
  },
];
