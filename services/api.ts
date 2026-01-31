
import { FetchApi } from '../utils/FetchApi';
import { 
  connectToServer, 
  setLocation, 
  getLocation 
} from '../utils/genralCall';
import {
  createTeacher,
  createAvailability,
  updateTeacher,
  updateQualification,
  deleteQualification,
  updateAvailability,
  submitAcademicProfiles,
  updateAcademicProfile,
  deleteAcademicProfile,
  submitQualification
} from '../utils/formSubmission';
import {
  getGradesbyMedium,
  getMediums,
  getSubjects,
  getTeacherProfile,
  getAcademicProfile,
  getQualification,
  getSlots
} from '../utils/fetchFormInfo';
import { User, JobPost, TeacherProfile, Bid, BidStatus, TeacherReview } from '../types';

// Get auth token from localStorage or sessionStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('access_token');
  }
  return null;
};

// --- API Methods ---

export const api = {
  auth: {
    // Server connection check
    connect: async () => {
      const token = getAuthToken();
      if (token) {
        return await connectToServer(token);
      }
      return null;
    },
    login: (user: User) => {
      // Store token if provided
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', 'mock_token'); // Replace with actual token from backend
      }
      return Promise.resolve(user);
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('access_token');
      }
    }
  },
  
  location: {
    set: async (location: string, params?: { update?: string }) => {
      const token = getAuthToken();
      if (token) {
        return await setLocation(token, location, params);
      }
      throw new Error('No authentication token found');
    },
    get: async () => {
      const token = getAuthToken();
      if (token) {
        return await getLocation(token);
      }
      return null;
    }
  },

  teacher: {
    create: async (data: any) => {
      const token = getAuthToken();
      if (token) {
        return await createTeacher(token, data);
      }
      throw new Error('No authentication token found');
    },
    update: async (id: string, data: any) => {
      const token = getAuthToken();
      if (token) {
        return await updateTeacher(token, id, data);
      }
      throw new Error('No authentication token found');
    },
    getProfile: async (id?: string) => {
      const token = getAuthToken();
      if (token) {
        return await getTeacherProfile(token, id);
      }
      return null;
    }
  },

  availability: {
    create: async (data: any) => {
      const token = getAuthToken();
      if (token) {
        return await createAvailability(token, data);
      }
      throw new Error('No authentication token found');
    },
    update: async (id: string, data: any) => {
      const token = getAuthToken();
      if (token) {
        return await updateAvailability(token, id, data);
      }
      throw new Error('No authentication token found');
    },
    getSlots: async () => {
      const token = getAuthToken();
      if (token) {
        return await getSlots(token);
      }
      return null;
    }
  },

  academicProfile: {
    create: async (data: any) => {
      const token = getAuthToken();
      if (token) {
        return await submitAcademicProfiles(token, data);
      }
      throw new Error('No authentication token found');
    },
    update: async (id: string, data: any) => {
      const token = getAuthToken();
      if (token) {
        return await updateAcademicProfile(token, id, data);
      }
      throw new Error('No authentication token found');
    },
    delete: async (id: string) => {
      const token = getAuthToken();
      if (token) {
        return await deleteAcademicProfile(token, id);
      }
      throw new Error('No authentication token found');
    },
    getAll: async () => {
      const token = getAuthToken();
      if (token) {
        return await getAcademicProfile(token);
      }
      return null;
    }
  },

  qualification: {
    create: async (data: any) => {
      const token = getAuthToken();
      if (token) {
        return await submitQualification(token, data);
      }
      throw new Error('No authentication token found');
    },
    update: async (id: string, data: any) => {
      const token = getAuthToken();
      if (token) {
        return await updateQualification(token, id, data);
      }
      throw new Error('No authentication token found');
    },
    delete: async (id: string) => {
      const token = getAuthToken();
      if (token) {
        return await deleteQualification(token, id);
      }
      throw new Error('No authentication token found');
    },
    getAll: async () => {
      const token = getAuthToken();
      if (token) {
        return await getQualification(token);
      }
      return null;
    }
  },

  grades: {
    getByMedium: async (medium_ids: string[]) => {
      const token = getAuthToken();
      if (token) {
        return await getGradesbyMedium(token, { medium_id: medium_ids });
      }
      return null;
    }
  },

  mediums: {
    getAll: async () => {
      const token = getAuthToken();
      if (token) {
        return await getMediums(token);
      }
      return null;
    }
  },

  subjects: {
    getByGrade: async (grade_ids: string[]) => {
      const token = getAuthToken();
      if (token) {
        return await getSubjects(token, { grade_id: grade_ids });
      }
      return null;
    }
  },

  jobs: {
    getAll: async () => {
      const token = getAuthToken();
      try {
        return await FetchApi.get<JobPost[]>('/jobs/', {}, token ? {'Authorization': `Bearer ${token}`} : {});
      } catch (error) {
        console.error('Error fetching jobs:', error);
        return [];
      }
    },
    create: async (jobData: any) => {
      const token = getAuthToken();
      if (token) {
        return await FetchApi.post<JobPost>('/jobs/', jobData, {'Authorization': `Bearer ${token}`});
      }
      throw new Error('No authentication token found');
    },
    getById: async (id: string) => {
      const token = getAuthToken();
      return await FetchApi.get<JobPost>(`/jobs/${id}/`, {}, token ? {'Authorization': `Bearer ${token}`} : {});
    }
  },

  tutors: {
    getAll: async () => {
      const token = getAuthToken();
      try {
        return await FetchApi.get<TeacherProfile[]>('/teachers/', {}, token ? {'Authorization': `Bearer ${token}`} : {});
      } catch (error) {
        console.error('Error fetching tutors:', error);
        return [];
      }
    },
    updateProfile: async (profile: TeacherProfile) => {
      const token = getAuthToken();
      if (token) {
        return await FetchApi.put<TeacherProfile>(`/teacher-profile/${profile.id}/`, profile, {'Authorization': `Bearer ${token}`});
      }
      throw new Error('No authentication token found');
    },
    getById: async (id: string) => {
      const token = getAuthToken();
      return await FetchApi.get<TeacherProfile>(`/teachers/${id}/`, {}, token ? {'Authorization': `Bearer ${token}`} : {});
    }
  },

  bids: {
    create: async (bidData: any) => {
      const token = getAuthToken();
      if (token) {
        return await FetchApi.post<Bid>('/bids/', bidData, {'Authorization': `Bearer ${token}`});
      }
      throw new Error('No authentication token found');
    },
    updateStatus: async (bidId: number, status: BidStatus) => {
      const token = getAuthToken();
      if (token) {
        return await FetchApi.put<Bid>(`/bids/${bidId}/status/`, { status }, {'Authorization': `Bearer ${token}`});
      }
      throw new Error('No authentication token found');
    }
  },

  reviews: {
    getAll: async () => {
      const token = getAuthToken();
      try {
        return await FetchApi.get<TeacherReview[]>('/teacher-review/', {}, token ? {'Authorization': `Bearer ${token}`} : {});
      } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }
    },
    getByTeacher: async (tutorId: string) => {
      const token = getAuthToken();
      try {
        return await FetchApi.get<TeacherReview[]>(`/review-by-teacher/${tutorId}/`, {}, token ? {'Authorization': `Bearer ${token}`} : {});
      } catch (error) {
        console.error('Error fetching teacher reviews:', error);
        return [];
      }
    },
    create: async (reviewData: { rating: number; comment: string; contact_request: number }) => {
      const token = getAuthToken();
      if (token) {
        return await FetchApi.post<TeacherReview>('/teacher-review/', reviewData, {'Authorization': `Bearer ${token}`});
      }
      throw new Error('No authentication token found');
    },
    getById: async (id: number) => {
      const token = getAuthToken();
      return await FetchApi.get<TeacherReview>(`/teacher-review/${id}/`, {}, token ? {'Authorization': `Bearer ${token}`} : {});
    },
    update: async (id: number, reviewData: { rating: number; comment: string }) => {
      const token = getAuthToken();
      if (token) {
        return await FetchApi.put<TeacherReview>(`/teacher-review/${id}/`, reviewData, {'Authorization': `Bearer ${token}`});
      }
      throw new Error('No authentication token found');
    },
    delete: async (id: number) => {
      const token = getAuthToken();
      if (token) {
        return await FetchApi.delete(`/teacher-review/${id}/`, {'Authorization': `Bearer ${token}`});
      }
      throw new Error('No authentication token found');
    }
  }
};
