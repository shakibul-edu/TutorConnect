
import { toast } from '../lib/toast';
import { stateManager } from './stateManager';
import { User, JobPost, TeacherProfile, Bid, BidStatus } from '../types';

// In a real app, this would be your backend URL
const API_BASE_URL = 'https://api.tutorconnect.com/v1';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Generic Request Handler
async function request<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  showSuccessToast = false
): Promise<T> {
  try {
    // 1. Setup Headers (Auth, Content-Type)
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. SIMULATION: Intercept requests to mock backend (stateManager)
    // In production, this block is replaced by the actual fetch call below
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network latency

    let result: any;
    
    // --- Mock Routing Logic ---
    if (endpoint === '/auth/login') {
        // Mock Login
        result = body; 
    } else if (endpoint === '/jobs' && method === 'GET') {
        result = stateManager.getJobs();
    } else if (endpoint === '/jobs' && method === 'POST') {
        result = stateManager.addJob(body);
    } else if (endpoint === '/bids' && method === 'POST') {
        result = stateManager.addBid(body);
    } else if (endpoint.startsWith('/teacher/profile') && method === 'PUT') {
        stateManager.updateTeacherProfile(body);
        result = body;
    }
    // ... add other mock routes as needed
    // --- End Mock Routing ---

    // 3. Real Fetch (Commented out for mock environment)
    /*
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    result = await response.json();
    */

    // 4. Handle Success
    if (showSuccessToast) {
        toast.success(result?.message || 'Operation successful');
    }

    return result as T;

  } catch (error: any) {
    // 5. Centralized Error Handling
    console.error(`API Error [${endpoint}]:`, error);
    const errorMessage = error.message || 'An unexpected error occurred';
    toast.error(errorMessage);
    throw error;
  }
}

// --- API Methods ---

export const api = {
  auth: {
    login: (user: User) => request<User>('/auth/login', 'POST', user, true),
    logout: () => {
        localStorage.removeItem('auth_token');
        toast.info('Logged out successfully');
    }
  },
  jobs: {
    getAll: () => request<JobPost[]>('/jobs', 'GET'),
    create: (jobData: any) => request<JobPost>('/jobs', 'POST', jobData, true),
    getById: (id: string) => request<JobPost>(`/jobs/${id}`, 'GET'),
  },
  tutors: {
    getAll: () => request<TeacherProfile[]>('/tutors', 'GET'),
    updateProfile: (profile: TeacherProfile) => request<TeacherProfile>(`/teacher/profile/${profile.id}`, 'PUT', profile, true),
    getById: (id: string) => request<TeacherProfile>(`/tutors/${id}`, 'GET'),
  },
  bids: {
    create: (bidData: any) => request<Bid>('/bids', 'POST', bidData, true),
    updateStatus: (bidId: number, status: BidStatus) => request<Bid>(`/bids/${bidId}/status`, 'PUT', { status }, true)
  }
};
