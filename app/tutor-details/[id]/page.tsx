'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '../../../lib/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ShieldCheck, Clock, FileText, CheckCircle, XCircle, User, MapPin, DollarSign, Briefcase, Users, Star } from 'lucide-react';
import Availability from '../../../components/Availability';
import { getTeacherFullProfile, getTeacherReviews } from '../../../services/backend';
import { getBackendImageUrl } from '../../../utils/imageHelper';
import ContactRequestModal from '@/components/ContactRequestModal';
import { TeacherReview, AvailabilitySlot } from '../../../types';

export default function TutorDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const { push } = useRouter();
    const { data: session, status } = useSession();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [reviews, setReviews] = useState<TeacherReview[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
    const scheduledAvailability = profileData?.scheduled_availability;

    useEffect(() => {
        const fetchProfile = async () => {
            if (status !== 'authenticated' || !id) {
                setLoading(false);
                return;
            }

            const backendAccess = (session as any)?.backendAccess;
            if (!backendAccess) {
                console.warn('No backend access token available yet');
                setLoading(false);
                return;
            }

            try {
                const response = await getTeacherFullProfile(backendAccess, id);
                if (response) {
                    setProfileData(response);
                }
                
                // Fetch reviews
                setReviewsLoading(true);
                const reviewsData = await getTeacherReviews(backendAccess, id);
                if (reviewsData && Array.isArray(reviewsData)) {
                    setReviews(reviewsData);
                }
                setReviewsLoading(false);
            } catch (error) {
                console.error("Error fetching teacher profile:", error);
                setReviewsLoading(false);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [session, status, id]);

    useEffect(() => {
        if (!scheduledAvailability || !Array.isArray(scheduledAvailability)) {
            setAvailabilitySlots([]);
            return;
        }

        const slotsByTime = new Map<string, AvailabilitySlot>();

        scheduledAvailability.forEach((slot: any) => {
            const rawStart = slot.start_time || slot.start;
            const rawEnd = slot.end_time || slot.end;
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
                    days: [],
                });
            }

            const currentSlot = slotsByTime.get(timeKey);
            if (!currentSlot) return;

            if (day) {
                if (!currentSlot.days.includes(day)) currentSlot.days.push(day);
            } else if (existingDays.length > 0) {
                existingDays.forEach((d: string) => {
                    if (!currentSlot.days.includes(d)) currentSlot.days.push(d);
                });
            }
        });

        setAvailabilitySlots(Array.from(slotsByTime.values()));
    }, [scheduledAvailability]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!profileData || !profileData.teacher_profile) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Tutor Not Found</h2>
                <button onClick={() => push('tutors')} className="mt-4 text-indigo-600 hover:underline">Back to Tutors</button>
            </div>
        );
    }

    const { teacher_profile, academic_profiles, qualifications } = profileData;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button onClick={() => push('tutors')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tutors
            </button>

            {/* Profile Header Card */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg overflow-hidden mb-8">
                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        {/* Profile Picture */}
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                               {teacher_profile.profile_picture ? (
                                   <img src={getBackendImageUrl(teacher_profile.profile_picture)} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                               ) : (
                                   <User className="w-12 h-12 text-indigo-600" />
                               )}       
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{teacher_profile.name}</h1>
                                {teacher_profile.verified && (
                                    <span className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow">
                                        <ShieldCheck className="w-4 h-4" />
                                        Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-indigo-100 text-lg mb-3 capitalize flex items-center gap-2">
                                <Briefcase className="w-5 h-5" />
                                {teacher_profile.highest_qualification} • {teacher_profile.teaching_mode} Mode
                            </p>
                            
                            {/* Key Stats Row */}
                            <div className="flex flex-wrap gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-indigo-200" />
                                    <div>
                                        <p className="text-indigo-200 text-xs">Starting Salary</p>
                                        <p className="font-bold text-lg">৳{teacher_profile.min_salary}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-indigo-200" />
                                    <div>
                                        <p className="text-indigo-200 text-xs">Experience</p>
                                        <p className="font-bold text-lg">{teacher_profile.experience_years} Years</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-indigo-200" />
                                    <div>
                                        <p className="text-indigo-200 text-xs">Distance</p>
                                        <p className="font-bold text-lg">{teacher_profile.preferred_distance} km</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-200" />
                                    <div>
                                        <p className="text-indigo-200 text-xs">Gender</p>
                                        <p className="font-bold text-lg capitalize">{teacher_profile.gender}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bio Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">About Me</h2>
                <p className="text-gray-700 leading-relaxed">{teacher_profile.bio || 'No bio available'}</p>
            </div>

            <div className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Mediums</label>
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                            {teacher_profile.medium_list && teacher_profile.medium_list.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {teacher_profile.medium_list.map((medium: any) => (
                                        <span key={medium.id} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium">
                                            {medium.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No mediums selected</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Classes / Grades</label>
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                            {teacher_profile.grade_list && teacher_profile.grade_list.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {teacher_profile.grade_list.map((grade: any) => (
                                        <span key={grade.id} className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                                            {grade.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No grades selected</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                            {teacher_profile.subject_list && teacher_profile.subject_list.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {teacher_profile.subject_list.map((subject: any) => (
                                        <span key={subject.id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm font-medium">
                                            {subject.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No subjects selected</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Availability</label>
                        {availabilitySlots.length > 0 ? (
                            <Availability slots={availabilitySlots} setSlots={setAvailabilitySlots} readOnly />
                        ) : (
                            <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-md border border-gray-200">No availability schedule set</p>
                        )}
                    </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Educational Info</h2>
                        <p className="text-gray-500 text-sm">Academic profiles</p>
                    </div>

                    {academic_profiles && academic_profiles.length > 0 ? (
                        <div className="space-y-3">
                            {academic_profiles.map((edu: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-start p-4 bg-gray-50 border border-gray-200 rounded-md">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{edu.degree}</p>
                                        <p className="text-sm text-gray-600">{edu.institution}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span>Year: {edu.graduation_year}</span>
                                            <span>Result: {edu.results}</span>
                                            {edu.certificates && (
                                                <span className="flex items-center gap-1 text-indigo-600">
                                                    <FileText className="w-3 h-3" />
                                                    <a href={getBackendImageUrl(edu.certificates)} target="_blank" rel="noopener noreferrer" className="underline">View Certificate</a>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        {edu.validated ? (
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                <CheckCircle className="w-4 h-4" />
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-gray-400 text-xs">
                                                <XCircle className="w-4 h-4" />
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-md border border-gray-200">No academic profiles added</p>
                    )}
                </div>

                <hr className="border-gray-200" />

                <div>
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Qualifications</h2>
                        <p className="text-gray-500 text-sm">Professional qualifications and skills</p>
                    </div>

                    {qualifications && qualifications.length > 0 ? (
                        <div className="space-y-3">
                            {qualifications.map((qual: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-start p-4 bg-gray-50 border border-gray-200 rounded-md">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{qual.skill}</p>
                                        <p className="text-sm text-gray-600">{qual.organization}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span>Year: {qual.year}</span>
                                            <span>Result: {qual.results}</span>
                                            {qual.certificates && (
                                                <span className="flex items-center gap-1 text-indigo-600">
                                                    <FileText className="w-3 h-3" />
                                                    <a href={getBackendImageUrl(qual.certificates)} target="_blank" rel="noopener noreferrer" className="underline">View Certificate</a>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        {qual.validated ? (
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                <CheckCircle className="w-4 h-4" />
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-gray-400 text-xs">
                                                <XCircle className="w-4 h-4" />
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-md border border-gray-200">No qualifications added</p>
                    )}
                </div>

                <hr className="border-gray-200" />

                {/* Reviews Section */}
                <div>
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Reviews
                        </h2>
                        <p className="text-gray-500 text-sm">Student feedback and ratings</p>
                    </div>

                    {reviewsLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : reviews && reviews.length > 0 ? (
                        <div className="space-y-4">
                            {/* Average Rating */}
                            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <div className="flex items-center gap-1">
                                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                    <span className="text-2xl font-bold text-gray-900">
                                        {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                                    </span>
                                </div>
                                <span className="text-gray-600 text-sm">out of 5 ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                            </div>

                            {/* Individual Reviews */}
                            <div className="space-y-3">
                                {reviews.map((review) => (
                                    <div key={review.id} className="p-4 bg-white border border-gray-200 rounded-md">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{review.student_name}</p>
                                                    <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-4 h-4 ${
                                                            star <= review.rating
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-md border border-gray-200">No reviews yet</p>
                    )}
                </div>

                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 mt-6" onClick={() => setIsContactModalOpen(true)}>
                    Apply for Contact
                </button>

                <ContactRequestModal
                    isOpen={isContactModalOpen}
                    onClose={() => setIsContactModalOpen(false)}
                    teacherId={id}
                    teacherName={teacher_profile.name}
                />
            </div>
        </div>
    );
}
