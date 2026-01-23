'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '../../../lib/router';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ShieldCheck, Clock, FileText, CheckCircle, XCircle, User, MapPin, DollarSign, Briefcase, Users } from 'lucide-react';
import { getTeacherFullProfile } from '../../../services/backend';
import { getBackendImageUrl } from '../../../utils/imageHelper';

export default function TutorDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const { push } = useRouter();
    const { data: session, status } = useSession();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
            } catch (error) {
                console.error("Error fetching teacher profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [session, status, id]);

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
                        {Object.values(groupedAvailability).length > 0 ? (
                            <div className="space-y-4">
                                {Object.values(groupedAvailability).map((slot: any, index: number) => (
                                    <div key={index} className="bg-white hover:shadow-md transition-all duration-200 p-5 rounded-lg border border-gray-200">
                                        <div className="mb-2 flex items-center gap-2 text-indigo-600 font-medium text-sm">
                                            <Clock className="w-4 h-4" />
                                            <span>Schedule {index + 1}</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Selected Days</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {slot.days.map((day: string, idx: number) => (
                                                        <span key={idx} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium">
                                                            {day}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                                                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <div className="flex items-center gap-2 flex-1">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] font-semibold text-gray-500">Start Time</label>
                                                        <p className="text-sm font-medium text-gray-700">{slot.start}</p>
                                                    </div>
                                                    <span className="text-gray-400 font-medium">-</span>
                                                    <div className="flex-1">
                                                        <label className="text-[10px] font-semibold text-gray-500">End Time</label>
                                                        <p className="text-sm font-medium text-gray-700">{slot.end}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
            </div>
        </div>
    );
}
