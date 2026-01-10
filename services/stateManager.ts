
import { JobPost, Bid, TeacherProfile, User, BidStatus, Review } from '../types';
import { MOCK_JOBS, MOCK_TEACHERS } from './mockData';

class StateManager {
  private jobs: JobPost[] = MOCK_JOBS.map(j => ({ ...j, status: 'open' }));
  private bids: Bid[] = [];
  private reviews: Review[] = [];
  private teachers: TeacherProfile[] = [...MOCK_TEACHERS];

  getJobs() {
    return this.jobs;
  }

  addJob(job: Omit<JobPost, 'id' | 'created_at' | 'bids_count' | 'status'>) {
    const newJob: JobPost = {
      ...job,
      id: this.jobs.length + 1,
      created_at: new Date().toISOString(),
      bids_count: 0,
      status: 'open'
    };
    this.jobs = [newJob, ...this.jobs];
    return newJob;
  }

  getBids() {
    return this.bids;
  }

  getBidsForJob(jobId: number) {
    return this.bids.filter(b => b.job_id === jobId);
  }

  getBidsByTutor(tutorUserId: number) {
    return this.bids.filter(b => b.tutor.user.id === tutorUserId);
  }

  addBid(bidData: { job_id: number, tutor: TeacherProfile, proposed_salary: number, message: string }) {
    const newBid: Bid = {
      id: this.bids.length + 1,
      ...bidData,
      created_at: new Date().toISOString(),
      status: 'pending'
    };
    this.bids = [...this.bids, newBid];
    
    const jobIndex = this.jobs.findIndex(j => j.id === bidData.job_id);
    if (jobIndex !== -1) {
      this.jobs[jobIndex].bids_count += 1;
    }
    
    return newBid;
  }

  updateBidStatus(bidId: number, status: BidStatus) {
    const bidIndex = this.bids.findIndex(b => b.id === bidId);
    if (bidIndex === -1) return;

    const bid = this.bids[bidIndex];
    bid.status = status;

    if (status === 'accepted') {
      const jobIndex = this.jobs.findIndex(j => j.id === bid.job_id);
      if (jobIndex !== -1) {
        this.jobs[jobIndex].status = 'hired';
        
        this.bids.forEach(b => {
          if (b.job_id === bid.job_id && b.id !== bidId) {
            b.status = 'rejected';
          }
        });
      }
    }
    
    this.bids = [...this.bids];
    this.jobs = [...this.jobs];
  }

  addReview(reviewData: Omit<Review, 'id' | 'created_at'>) {
    const newReview: Review = {
      ...reviewData,
      id: this.reviews.length + 1,
      created_at: new Date().toISOString()
    };
    this.reviews = [...this.reviews, newReview];
    return newReview;
  }

  getReviewsForTutor(tutorId: number) {
    return this.reviews.filter(r => r.tutor_id === tutorId);
  }

  getReviewForJobAndTutor(jobId: number, tutorId: number) {
    return this.reviews.find(r => r.job_id === jobId && r.tutor_id === tutorId);
  }

  getTutorRating(tutorId: number) {
    const tutorReviews = this.getReviewsForTutor(tutorId);
    if (tutorReviews.length === 0) return { avg: 0, count: 0 };
    const sum = tutorReviews.reduce((acc, r) => acc + r.rating, 0);
    return { avg: parseFloat((sum / tutorReviews.length).toFixed(1)), count: tutorReviews.length };
  }

  // Teacher Profile Methods
  getTeacherProfile(userId: number): TeacherProfile | undefined {
    return this.teachers.find(t => t.user.id === userId);
  }

  updateTeacherProfile(updatedProfile: TeacherProfile) {
    const index = this.teachers.findIndex(t => t.id === updatedProfile.id);
    if (index !== -1) {
      this.teachers[index] = updatedProfile;
      this.teachers = [...this.teachers]; // trigger reactivity if we were using a real store listener
    } else {
        // If not found (new profile), add it
        this.teachers.push(updatedProfile);
    }
  }
}

export const stateManager = new StateManager();
