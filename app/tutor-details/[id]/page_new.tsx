'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '../../../lib/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ShieldCheck, GraduationCap, MapPin, Calendar, Clock, Award, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { getTeacherFullProfile } from '../../../services/backend';
import { getBackendImageUrl } from '../../../utils/imageHelper';

export default function TutorDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const { push } = useRouter();
    const { data: session } = useSession();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const idToken = (session as any)?.id_token;
            if (!idToken || !id) {
                setLoading(false);
                return;
            }
            try {
                const response = await getTeacherFullProfile(idToken, id);
                if (response) {
                    setProfileData(response);
                }
            } catch (error) {
                console.error("Error fetching teacher profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [session, id]);

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

    const { teacher_profile, academic_profiles, qualifications, scheduled_availability } = profileData;

    // Group availability by time slots
    const groupedAvailability = scheduled_availability.reduce((acc: any, slot: any) => {
        const timeKey = `${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}`;
        if (!acc[timeKey]) {
            acc[timeKey] = {
                start: slot.start_time.substring(0, 5),
                end: slot.end_time.substring(0, 5),
                days: []
            };
        }
        acc[timeKey].days.push(slot.days_of_week);
        return acc;
    }, {});

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button onClick={() => push('tutors')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tutors
            </button>

            {/* Header Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 h-32"></div>
                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-6 gap-6">
                        <img 
                            src={getBackendImageUrl(teacher_profile.profile_picture)} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold text-gray-900">Teacher #{teacher_profile.id}</h1>
                                {teacher_profile.verified && (
                                    <span title="Verified Tutor">
                                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 font-medium capitalize flex items-center gap-2 mt-1">
                                <GraduationCap className="w-4 h-4" />
                                {teacher_profile.highest_qualification}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Min Salary</span>
                            <span className="text-2xl font-bold text-gray-900 mt-1">৳{teacher_profile.min_salary}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Experience</span>
                            <span className="text-2xl font-bold text-gray-900 mt-1">{teacher_profile.experience_years} years</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Teaching Mode</span>
                            <span className="text-2xl font-bold text-gray-900 mt-1 capitalize">{teacher_profile.teaching_mode}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Distance</span>
                            <span className="text-2xl font-bold text-gray-900 mt-1">{teacher_profile.preferred_distance} km</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bio Section */}
            {teacher_profile.bio && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
                    <p className="text-gray-700 leading-relaxed">{teacher_profile.bio}</p>
                </div>
            )}

            {/* Subjects, Grades & Mediums */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {teacher_profile.subject_list && teacher_profile.subject_list.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                            Subjects
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {teacher_profile.subject_list.map((subject: any) => (
                                <span key={subject.id} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                                    {subject.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {teacher_profile.grade_list && teacher_profile.grade_list.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                            Grades
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {teacher_profile.grade_list.map((grade: any) => (
                                <span key={grade.id} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                                    {grade.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {teacher_profile.medium_list && teacher_profile.medium_list.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Medium</h3>
                        <div className="flex flex-wrap gap-2">
                            {teacher_profile.medium_list.map((medium: any) => (
                                <span key={medium.id} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                                    {medium.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Academic Profiles */}
            {academic_profiles && academic_profiles.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                        Academic Education
                    </h2>
                    <div className="space-y-4">
                        {academic_profiles.map((edu: any) => (
                            <div key={edu.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900">{edu.institution}</h3>
                                        <p className="text-indigo-600 font-medium">{edu.degree}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {edu.graduation_year}
                                            </span>
                                            <span>Result: {edu.results}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {edu.validated ? (
                                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                <CheckCircle className="w-4 h-4" />
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-gray-400 text-sm">
                                                <XCircle className="w-4 h-4" />
                                                Pending
                                            </span>
                                        )}
                                        {edu.certificates && (
                                            <a 
                                                href={`${process.env.BASE_URL || ''}${edu.certificates}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline text-sm"
                                            >
                                                View Certificate
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Qualifications */}
            {qualifications && qualifications.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-6 h-6 text-indigo-600" />
                        Professional Qualifications
                    </h2>
                    <div className="space-y-4">
                        {qualifications.map((qual: any) => (
                            <div key={qual.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900">{qual.organization}</h3>
                                        <p className="text-indigo-600 font-medium">{qual.skill}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {qual.year}
                                            </span>
                                            <span>Result: {qual.results}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {qual.validated ? (
                                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                <CheckCircle className="w-4 h-4" />
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-gray-400 text-sm">
                                                <XCircle className="w-4 h-4" />
                                                Pending
                                            </span>
                                        )}
                                        {qual.certificates && (
                                            <a 
                                                href={`${process.env.BASE_URL || ''}${qual.certificates}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline text-sm"
                                            >
                                                View Certificate
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Availability Schedule */}
            {scheduled_availability && scheduled_availability.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-indigo-600" />
                        Weekly Availability
                    </h2>
                    <div className="space-y-3">
                        {Object.values(groupedAvailability).map((slot: any, index: number) => (
                            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                                        <Clock className="w-4 h-4 text-indigo-600" />
                                        {slot.start} - {slot.end}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {slot.days.map((day: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                            {day}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
