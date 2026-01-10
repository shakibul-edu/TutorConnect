
import React, { useState } from 'react';
import { stateManager } from '../../services/stateManager';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { MapPin, DollarSign, BookOpen, Clock, Calendar, User, ArrowLeft, Share2, Flag } from 'lucide-react';
import BidModal from '../../components/BidModal';
import { MOCK_TEACHERS } from '../../services/mockData';

export default function JobDetailsPage({ id }: { id: string }) {
    const { push } = useRouter();
    const { user } = useAuth();
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    
    const job = stateManager.getJobs().find(j => j.id.toString() === id);

    if (!job) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Job Not Found</h2>
                <button onClick={() => push('jobs')} className="mt-4 text-indigo-600 hover:underline">Back to Jobs</button>
            </div>
        );
    }

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button onClick={() => push('jobs')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                                {job.teaching_mode === 'any' ? 'Online & Offline' : job.teaching_mode}
                            </span>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                            <div className="flex items-center text-gray-500 text-sm gap-4">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Posted {timeAgo(job.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {job.preferred_distance}km radius
                                </span>
                            </div>
                        </div>
                        {user?.is_teacher && (
                            <button 
                                onClick={() => setIsBidModalOpen(true)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-shadow shadow-md"
                            >
                                Apply Now
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <section>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                            <div className="prose text-gray-600">
                                <p>{job.description}</p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-700">
                                    <BookOpen className="w-5 h-5 text-gray-400" />
                                    <span>Subject: <strong>{job.subjects.map(s => s.name).join(', ')}</strong></span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <span>Class/Grade: <strong>{job.grade?.name}</strong></span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span>Student Gender: <strong>{job.gender}</strong></span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <Flag className="w-5 h-5 text-gray-400" />
                                    <span>Medium: <strong>{job.medium?.name}</strong></span>
                                </li>
                            </ul>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Salary & Compensation</h4>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                                <DollarSign className="w-6 h-6 text-green-600" />
                                {job.min_salary} - {job.max_salary}
                                <span className="text-sm font-normal text-gray-500 self-end mb-1">BDT/month</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">About the Parent</h4>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                                    {job.posted_by.first_name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{job.posted_by.first_name} {job.posted_by.last_name}</p>
                                    <p className="text-xs text-gray-500">Member since 2023</p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                            <Share2 className="w-4 h-4" />
                            Share Job
                        </button>
                    </div>
                </div>
            </div>

            {isBidModalOpen && user && (
                <BidModal
                    isOpen={isBidModalOpen}
                    onClose={() => setIsBidModalOpen(false)}
                    job={job}
                    tutor={MOCK_TEACHERS[0]} // Using mock for demo
                    onSuccess={() => {
                        alert('Application submitted!');
                        setIsBidModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
