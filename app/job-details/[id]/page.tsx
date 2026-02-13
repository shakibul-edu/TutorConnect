
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '../../../lib/router';
import { useAuth } from '../../../lib/auth'; // Keeping useAuth for user checks if needed, or replace with session user
import { useSession } from 'next-auth/react';
import { MapPin, DollarSign, BookOpen, Clock, Calendar, User, ArrowLeft, Share2, Flag, Pencil, Check, X, CheckCircle, XCircle } from 'lucide-react';
import Availability from '../../../components/Availability';
import BidModal from '../../../components/BidModal';
import MultiSelect from '../../../components/MultiSelect';
import { getJobPost, patchJobPost, getMediums, getGradesbyMedium, getSubjects, submitJobPostAvailability, closeJob, getJobBids, updateBidStatus } from '../../../services/backend';
import { JobPost, AvailabilitySlot, Gender, TeachingMode, JobStatus, Medium, Grade, Subject, JobBid } from '../../../types';
import { validateAvailabilitySlots } from '../../../utils/availability';
import { toast } from '../../../lib/toast';

export default function JobDetailsPage() {
    const params = useParams();
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { push } = useRouter();
    const { user } = useAuth(); // We might want to migrate this too eventually, but focusing on API token for now
    const { data: session, status } = useSession();
    const [job, setJob] = useState<JobPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
    const [initialAvailabilityCount, setInitialAvailabilityCount] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [jobBids, setJobBids] = useState<JobBid[]>([]);
    const [bidsLoading, setBidsLoading] = useState(false);
    const [bidsError, setBidsError] = useState<string | null>(null);
    const [actioningBidId, setActioningBidId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editBudgetSalary, setEditBudgetSalary] = useState<number>(0);
    const [editGender, setEditGender] = useState<Gender>('any');
    const [editTeachingMode, setEditTeachingMode] = useState<TeachingMode>('online');
    const [editMinQualification, setEditMinQualification] = useState('degree');
    const [mediumOptions, setMediumOptions] = useState<Medium[]>([]);
    const [gradeOptions, setGradeOptions] = useState<Grade[]>([]);
    const [subjectOptions, setSubjectOptions] = useState<Subject[]>([]);
    const [selectedMedium, setSelectedMedium] = useState<number | ''>('');
    const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
    const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
    
    useEffect(() => {
        const fetchJob = async () => {
            if (!id || status === 'loading') return;
            
            try {
                // Get token from session
                const backendAccess = (session as any)?.backendAccess;
                const token = backendAccess || localStorage.getItem('auth_token') || '';
                
                const fetchedJob = await getJobPost(token, id);

                 // Transform availability to group by time slots
                if (fetchedJob && fetchedJob.availability && Array.isArray(fetchedJob.availability)) {
                    const slotsByTime = new Map<string, any>();
                    
                    fetchedJob.availability.forEach((slot: any) => {
                        // Backend typically returns start_time, end_time, days_of_week
                        const rawStart = slot.start_time || slot.start;
                        const rawEnd = slot.end_time || slot.end;
                        // Handle days_of_week (string) or days (array or string)
                        const day = slot.days_of_week || (typeof slot.days === 'string' ? slot.days : null); 
                        const existingDays = Array.isArray(slot.days) ? slot.days : [];

                        if (!rawStart || !rawEnd) return;

                        const startTime = rawStart.substring(0, 5);
                        const endTime = rawEnd.substring(0, 5);
                        const timeKey = `${startTime}-${endTime}`;

                        if (!slotsByTime.has(timeKey)) {
                            slotsByTime.set(timeKey, {
                                start: startTime,
                                end: endTime,
                                days: []
                            });
                        }

                        const currentSlot = slotsByTime.get(timeKey);
                        if (day) {
                            if (!currentSlot.days.includes(day)) currentSlot.days.push(day);
                        } else if (existingDays.length > 0) {
                            existingDays.forEach((d: string) => {
                                if (!currentSlot.days.includes(d)) currentSlot.days.push(d);
                            });
                        }
                    });

                    fetchedJob.availability = Array.from(slotsByTime.values());
                }

                const availabilityCount = Array.isArray(fetchedJob?.availability) ? fetchedJob.availability.length : 0;
                setInitialAvailabilityCount(availabilityCount);

                setJob(fetchedJob);
            } catch (err) {
                console.error("Failed to fetch job", err);
                setError("Failed to load job details.");
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id, session, status]);

    useEffect(() => {
        if (job?.availability && Array.isArray(job.availability)) {
            setAvailabilitySlots(job.availability as AvailabilitySlot[]);
        } else {
            setAvailabilitySlots([]);
        }
    }, [job]);

    useEffect(() => {
        if (!job?.id || !job?.editable || status === 'loading') return;

        const backendAccess = (session as any)?.backendAccess;
        const token = backendAccess || localStorage.getItem('auth_token') || '';
        if (!token) return;

        setBidsLoading(true);
        setBidsError(null);
        getJobBids(token, job.id)
            .then((data) => {
                const bids = Array.isArray(data)
                    ? data
                    : Array.isArray((data as { results?: JobBid[] } | null)?.results)
                        ? (data as { results: JobBid[] }).results
                        : [];
                setJobBids(bids);
            })
            .catch((err) => {
                console.error('Failed to fetch bids', err);
                setBidsError('Failed to load bids.');
            })
            .finally(() => setBidsLoading(false));
    }, [job?.id, job?.editable, session, status]);

    useEffect(() => {
        if (!isEditing) return;
        if (availabilitySlots.length === 0) {
            setAvailabilitySlots([{ start: '16:00', end: '21:00', days: [] }]);
        }
    }, [isEditing, availabilitySlots.length]);

    useEffect(() => {
        if (!job || isEditing) return;
        setEditTitle(job.title || '');
        setEditDescription(job.description || '');
        setEditBudgetSalary(job.budget_salary || 0);
        setEditGender((job.gender as Gender) || 'any');
        setEditTeachingMode((job.teaching_mode as TeachingMode) || 'online');
        setEditMinQualification(job.minimum_qualification || 'degree');
        const mediumId = typeof job.medium === 'number' ? job.medium : job.medium?.id;
        const gradeId = typeof job.grade === 'number' ? job.grade : job.grade?.id;
        setSelectedMedium(mediumId || '');
        setSelectedGrade(gradeId || '');
        setSelectedSubjects(Array.isArray(job.subject_list) ? job.subject_list.map((sub) => sub.id) : []);
    }, [job, isEditing]);

    useEffect(() => {
        if (status === 'loading') return;
        const backendAccess = (session as any)?.backendAccess;
        const token = backendAccess || localStorage.getItem('auth_token') || '';
        if (!token) return;

        getMediums(token)
            .then((data) => {
                if (data) setMediumOptions(data);
            })
            .catch((err) => console.error('Failed to fetch mediums', err));
    }, [session, status]);

    useEffect(() => {
        const backendAccess = (session as any)?.backendAccess;
        const token = backendAccess || localStorage.getItem('auth_token') || '';
        if (!token || !selectedMedium) {
            setGradeOptions([]);
            return;
        }

        getGradesbyMedium(token, { medium_id: [String(selectedMedium)] })
            .then((data) => {
                if (data) setGradeOptions(data);
            })
            .catch((err) => console.error('Failed to fetch grades', err));
    }, [session, selectedMedium]);

    useEffect(() => {
        const backendAccess = (session as any)?.backendAccess;
        const token = backendAccess || localStorage.getItem('auth_token') || '';
        if (!token || !selectedGrade) {
            setSubjectOptions([]);
            return;
        }

        getSubjects(token, { grade_id: [String(selectedGrade)] })
            .then((data) => {
                if (data) setSubjectOptions(data);
            })
            .catch((err) => console.error('Failed to fetch subjects', err));
    }, [session, selectedGrade]);

    if (loading) {
        return (
             <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900">{error || "Job Not Found"}</h2>
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

    const canEdit = Boolean(job.editable);
    const statusStyles =
        job.status === 'closed'
            ? 'bg-rose-100 text-rose-800'
            : job.status === 'open'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800';
    const statusLabel =
        job.status === 'closed'
            ? 'Closed'
            : job.status === 'open'
                ? 'Open'
                : `${job.status.charAt(0).toUpperCase()}${job.status.slice(1)}`;

    const buildJobPayload = (
        overrides: Partial<{ status: JobStatus }> = {},
        useEdits = false
    ) => {
        const source = useEdits ? {
            title: editTitle,
            description: editDescription,
            budget_salary: editBudgetSalary,
            gender: editGender,
            teaching_mode: editTeachingMode,
            minimum_qualification: editMinQualification
        } : {
            title: job.title,
            description: job.description,
            budget_salary: job.budget_salary,
            gender: job.gender,
            teaching_mode: job.teaching_mode,
            minimum_qualification: job.minimum_qualification
        };

        const mediumId = useEdits
            ? selectedMedium
            : typeof job.medium === 'number'
                ? job.medium
                : job.medium?.id;
        const gradeId = useEdits
            ? selectedGrade
            : typeof job.grade === 'number'
                ? job.grade
                : job.grade?.id;
        const subjectIds = useEdits
            ? selectedSubjects
            : Array.isArray(job.subject_list)
                ? job.subject_list.map((sub) => sub.id)
                : [];

        return {
            ...source,
            phone: job.phone,
            medium_id: mediumId,
            grade_id: gradeId,
            subject_ids: subjectIds,
            ...overrides
        };
    };

    const handleCancelEdit = () => {
        if (job) {
            setEditTitle(job.title || '');
            setEditDescription(job.description || '');
            setEditBudgetSalary(job.budget_salary || 0);
            setEditGender((job.gender as Gender) || 'any');
            setEditTeachingMode((job.teaching_mode as TeachingMode) || 'online');
            setEditMinQualification(job.minimum_qualification || 'degree');
            const mediumId = typeof job.medium === 'number' ? job.medium : job.medium?.id;
            const gradeId = typeof job.grade === 'number' ? job.grade : job.grade?.id;
            setSelectedMedium(mediumId || '');
            setSelectedGrade(gradeId || '');
            setSelectedSubjects(Array.isArray(job.subject_list) ? job.subject_list.map((sub) => sub.id) : []);
        }
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!id) return;
        const backendAccess = (session as any)?.backendAccess;
        const token = backendAccess || localStorage.getItem('auth_token') || '';
        if (!token) {
            toast.error('You must be logged in to edit this job.');
            return;
        }

        if (!selectedMedium || !selectedGrade || selectedSubjects.length === 0) {
            toast.error('Please select medium, grade, and at least one subject.');
            return;
        }

        const availabilityValidation = validateAvailabilitySlots(availabilitySlots);
        if (!availabilityValidation.isValid) {
            toast.error(availabilityValidation.errors[0] || 'Please fix availability details.');
            return;
        }

        const payload = buildJobPayload({}, true);
        if (!payload.medium_id || !payload.grade_id || payload.subject_ids.length === 0) {
            toast.error('Job data is incomplete. Please refresh and try again.');
            return;
        }

        setIsSaving(true);
        try {
            const updatedJob = await patchJobPost(token, id, payload);
            if (updatedJob) {
                if (availabilitySlots.length > 0 && (initialAvailabilityCount === 0 || isEditing)) {
                    const availabilityPayload = availabilitySlots.map((slot) => ({
                        job_post: updatedJob.id,
                        start: slot.start,
                        end: slot.end,
                        days: slot.days
                    }));
                    await submitJobPostAvailability(token, availabilityPayload);
                }
                setJob(updatedJob);
                toast.success('Job updated successfully.');
                setIsEditing(false);
            }
        } catch (err) {
            console.error('Failed to update job', err);
            toast.error('Failed to update job.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseJob = async () => {
        if (!id) return;
        const backendAccess = (session as any)?.backendAccess;
        const token = backendAccess || localStorage.getItem('auth_token') || '';
        if (!token) {
            toast.error('You must be logged in to close this job.');
            return;
        }

        const payload = { status: 'closed' as JobStatus };

        setIsClosing(true);
        try {
            const updatedJob = await closeJob(token, id, payload);
            if (updatedJob) {
                setJob(updatedJob);
                toast.success('Job marked as closed.');
            }
        } catch (err) {
            console.error('Failed to close job', err);
            toast.error('Failed to close job.');
        } finally {
            setIsClosing(false);
        }
    };

    const handleAcceptBid = async (bidId: number) => {
        if (!confirm('Accept this bid? This will mark the tutor as hired.')) return;
        
        const backendAccess = (session as any)?.backendAccess;
        const token = backendAccess || localStorage.getItem('auth_token') || '';
        if (!token) {
            toast.error('You must be logged in to accept bids.');
            return;
        }

        setActioningBidId(bidId);
        try {
            await updateBidStatus(token, bidId, 'accepted');
            toast.success('Bid accepted successfully!');
            // Refresh bids
            const updatedBids = await getJobBids(token, Number(id));
            const bids = Array.isArray(updatedBids)
                ? updatedBids
                : Array.isArray((updatedBids as { results?: JobBid[] } | null)?.results)
                    ? (updatedBids as { results: JobBid[] }).results
                    : [];
            setJobBids(bids);
        } catch (err) {
            console.error('Failed to accept bid', err);
            toast.error('Failed to accept bid.');
        } finally {
            setActioningBidId(null);
        }
    };

    const handleRejectBid = async (bidId: number) => {
        if (!confirm('Reject this bid? This cannot be undone.')) return;
        
        const backendAccess = (session as any)?.backendAccess;
        const token = backendAccess || localStorage.getItem('auth_token') || '';
        if (!token) {
            toast.error('You must be logged in to reject bids.');
            return;
        }

        setActioningBidId(bidId);
        try {
            await updateBidStatus(token, bidId, 'rejected');
            toast.success('Bid rejected.');
            // Refresh bids
            const updatedBids = await getJobBids(token, Number(id));
            const bids = Array.isArray(updatedBids)
                ? updatedBids
                : Array.isArray((updatedBids as { results?: JobBid[] } | null)?.results)
                    ? (updatedBids as { results: JobBid[] }).results
                    : [];
            setJobBids(bids);
        } catch (err) {
            console.error('Failed to reject bid', err);
            toast.error('Failed to reject bid.');
        } finally {
            setActioningBidId(null);
        }
    };

    const mappedSubjects = subjectOptions.map((subject) => ({ id: subject.id, name: subject.name }));

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
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {job.teaching_mode === 'any' ? 'Online & Offline' : job.teaching_mode}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyles}`}>
                                    {statusLabel}
                                </span>
                            </div>
                            {isEditing ? (
                                <input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full text-3xl font-bold text-gray-900 mb-2 border border-gray-300 rounded-md px-3 py-2"
                                />
                            ) : (
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                            )}
                            <div className="flex items-center text-gray-500 text-sm gap-4">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Posted {timeAgo(job.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {job.distance}km radius
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {canEdit && !isEditing && job.status !== 'closed' && (
                                <button
                                    onClick={handleCloseJob}
                                    disabled={isClosing}
                                    className="border border-rose-200 text-rose-700 px-4 py-2 rounded-lg font-semibold hover:bg-rose-50 transition-colors"
                                >
                                    {isClosing ? 'Closing...' : 'Mark as Closed'}
                                </button>
                            )}
                            {canEdit && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit Job
                                </button>
                            )}
                            {canEdit && isEditing && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                            )}
                            {canEdit && isEditing && (
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                            {user?.is_teacher && job.is_biddable !== false && (
                                <button 
                                    onClick={() => setIsBidModalOpen(true)}
                                    disabled={job.status !== 'open'}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-shadow shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Apply Now
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <section>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                            <div className="prose text-gray-600">
                                {isEditing ? (
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        rows={6}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                ) : (
                                    <p>{job.description}</p>
                                )}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-700">
                                    <Flag className="w-5 h-5 text-gray-400" />
                                    <span>
                                        Medium:{' '}
                                        {isEditing ? (
                                            <select
                                                value={selectedMedium}
                                                onChange={(e) => {
                                                    const value = e.target.value ? Number(e.target.value) : '';
                                                    setSelectedMedium(value);
                                                    setSelectedGrade('');
                                                    setSelectedSubjects([]);
                                                }}
                                                className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-sm"
                                            >
                                                <option value="">Select Medium</option>
                                                {mediumOptions.map((medium) => (
                                                    <option key={medium.id} value={medium.id}>{medium.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <strong>{job.medium?.name}</strong>
                                        )}
                                    </span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <span>
                                        Class/Grade:{' '}
                                        {isEditing ? (
                                            <select
                                                value={selectedGrade}
                                                onChange={(e) => {
                                                    const value = e.target.value ? Number(e.target.value) : '';
                                                    setSelectedGrade(value);
                                                    setSelectedSubjects([]);
                                                }}
                                                className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-sm"
                                                disabled={!selectedMedium}
                                            >
                                                <option value="">Select Grade</option>
                                                {gradeOptions.map((grade) => (
                                                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <strong>{job.grade?.name}</strong>
                                        )}
                                    </span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <BookOpen className="w-5 h-5 text-gray-400" />
                                    <span className="flex-1">
                                        {isEditing ? (
                                            <MultiSelect
                                                label="Subjects"
                                                options={mappedSubjects}
                                                selectedIds={selectedSubjects}
                                                onChange={setSelectedSubjects}
                                                placeholder="Select subjects..."
                                            />
                                        ) : (
                                            <>Subject: <strong>{job.subject_list?.map(s => s.name).join(', ') || 'N/A'}</strong></>
                                        )}
                                    </span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span>
                                        Student Gender:{' '}
                                        {isEditing ? (
                                            <select
                                                value={editGender}
                                                onChange={(e) => setEditGender(e.target.value as Gender)}
                                                className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-sm"
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="any">Any</option>
                                            </select>
                                        ) : (
                                            <strong>{job.gender}</strong>
                                        )}
                                    </span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <BookOpen className="w-5 h-5 text-gray-400" />
                                    <span>
                                        Teaching Mode:{' '}
                                        {isEditing ? (
                                            <select
                                                value={editTeachingMode}
                                                onChange={(e) => setEditTeachingMode(e.target.value as TeachingMode)}
                                                className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-sm"
                                            >
                                                <option value="online">Online</option>
                                                <option value="offline">Offline</option>
                                                <option value="any">Any</option>
                                            </select>
                                        ) : (
                                            <strong>{job.teaching_mode}</strong>
                                        )}
                                    </span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <BookOpen className="w-5 h-5 text-gray-400" />
                                    <span>
                                        Min Qualification:{' '}
                                        {isEditing ? (
                                            <select
                                                value={editMinQualification}
                                                onChange={(e) => setEditMinQualification(e.target.value)}
                                                className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-sm"
                                            >
                                                <option value="ssc">SSC</option>
                                                <option value="hsc">HSC</option>
                                                <option value="degree">Degree</option>
                                                <option value="honours">Honours</option>
                                                <option value="masters">Masters</option>
                                                <option value="phd">PhD</option>
                                            </select>
                                        ) : (
                                            <strong>{job.minimum_qualification}</strong>
                                        )}
                                    </span>
                                </li>
                            </ul>
                        </section>
                         {availabilitySlots.length > 0 || isEditing ? (
                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Availability</h3>
                                <Availability slots={availabilitySlots} setSlots={setAvailabilitySlots} readOnly={!isEditing} />
                            </section>
                        ) : (
                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Availability</h3>
                                <p className="text-gray-500 text-sm">No availability provided</p>
                            </section>
                        )}
                        {canEdit && (
                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Applications</h3>
                                {bidsLoading ? (
                                    <p className="text-sm text-gray-500">Loading bids...</p>
                                ) : bidsError ? (
                                    <p className="text-sm text-rose-500">{bidsError}</p>
                                ) : jobBids.length === 0 ? (
                                    <p className="text-sm text-gray-500">No bids yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {jobBids.map((bid) => {
                                            const statusColors = {
                                                pending: 'bg-yellow-100 text-yellow-800',
                                                accepted: 'bg-green-100 text-green-800 border border-green-200',
                                                rejected: 'bg-red-50 text-red-500',
                                                closed: 'bg-gray-100 text-gray-500'
                                            };
                                            
                                            return (
                                                <div key={bid.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                                                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                                        <div className="text-lg font-bold text-gray-900">
                                                            Proposed: {bid.proposed_salary} BDT
                                                        </div>
                                                        <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${statusColors[bid.status]}`}>
                                                            {bid.status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md italic">
                                                        "{bid.message}"
                                                    </div>
                                                    <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-4">
                                                        <span>Submitted {new Date(bid.created_at).toLocaleString()}</span>
                                                        {bid.teacher_phone && (
                                                            <span className="font-semibold">Contact: {bid.teacher_phone}</span>
                                                        )}
                                                    </div>
                                                    {bid.status === 'pending' && job.status === 'open' && (
                                                        <div className="mt-4 flex gap-2">
                                                            <button
                                                                onClick={() => handleAcceptBid(bid.id)}
                                                                disabled={actioningBidId === bid.id}
                                                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-md text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                {actioningBidId === bid.id ? 'Accepting...' : 'Accept'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectBid(bid.id)}
                                                                disabled={actioningBidId === bid.id}
                                                                className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 py-2 rounded-md text-sm font-bold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                {actioningBidId === bid.id ? 'Rejecting...' : 'Reject'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Salary & Compensation</h4>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                                <DollarSign className="w-6 h-6 text-green-600" />
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={editBudgetSalary}
                                        onChange={(e) => setEditBudgetSalary(Number(e.target.value))}
                                        className="w-32 border border-gray-300 rounded-md px-2 py-1 text-lg"
                                        min={0}
                                    />
                                ) : (
                                    job.budget_salary
                                )}
                                <span className="text-sm font-normal text-gray-500 self-end mb-1">BDT/month</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">About the Parent</h4>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                                    {job.posted_by_name}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{job.posted_by_name}</p>
                                    <p className="text-xs text-gray-500">Member</p>
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
                    onSuccess={() => {
                        alert('Application submitted!');
                        setIsBidModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
