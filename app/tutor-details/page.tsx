'use client';

import React from 'react';
import { stateManager } from '../../services/stateManager';
import { useRouter } from '../../lib/router';
import { MapPin, Star, GraduationCap, ArrowLeft, Mail, BookOpen, Clock, Award, ShieldCheck } from 'lucide-react';

import { getBackendImageUrl } from '../../utils/imageHelper';

export default function TutorDetailsPage({ id }: { id: string }) {
    const { push } = useRouter();
    
    // In a real app we'd fetch from stateManager correctly, here falling back to MOCK if not in state
    const tutor = stateManager.getTeacherProfile(Number(id));

    if (!tutor) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Tutor Not Found</h2>
                <button onClick={() => push('tutors')} className="mt-4 text-indigo-600 hover:underline">Back to Tutors</button>
            </div>
        );
    }

    const ratingData = stateManager.getTutorRating(tutor.id);
    const reviews = stateManager.getReviewsForTutor(tutor.id);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                            src={getBackendImageUrl(tutor.profile_picture)} 
                            alt={tutor.user.username} 
                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold text-gray-900">{tutor.user.first_name} {tutor.user.last_name}</h1>
                                {tutor.verified && (
                                    <span title="Verified Tutor">
                                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 font-medium capitalize flex items-center gap-2 mt-1">
                                <GraduationCap className="w-4 h-4" />
                                {tutor.highest_qualification}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                <span className="text-lg font-bold text-gray-900">{ratingData.avg}</span>
                                <span className="text-sm text-gray-500">({ratingData.count} reviews)</span>
                            </div>
                            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Contact Tutor
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Starting Salary</span>
                            <span className="text-lg font-bold text-gray-900">{tutor.min_salary} BDT</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Experience</span>
                            <span className="text-lg font-bold text-gray-900">{tutor.experience_years} Years</span>
                        </div>
                         <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Mode</span>
                            <span className="text-lg font-bold text-gray-900 capitalize">{tutor.teaching_mode}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Location</span>
                            <span className="text-lg font-bold text-gray-900 flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-gray-400" /> Dhaka
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="md:col-span-2 space-y-8">
                    {/* Bio */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">About Me</h3>
                        <p className="text-gray-600 leading-relaxed">{tutor.bio}</p>
                    </div>

                    {/* Education */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <GraduationCap className="w-6 h-6 text-indigo-600" /> Education
                        </h3>
                        <div className="space-y-6">
                            {tutor.education?.map((edu, idx) => (
                                <div key={idx} className="relative pl-6 border-l-2 border-indigo-100 last:border-0 pb-1">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white"></div>
                                    <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                                    <p className="text-indigo-600 font-medium">{edu.institution}</p>
                                    <p className="text-sm text-gray-500 mt-1">{edu.year} • {edu.result}</p>
                                </div>
                            )) || <p className="text-gray-500 italic">No education details added.</p>}
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Star className="w-6 h-6 text-yellow-500" /> Reviews
                        </h3>
                        {reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.map(review => (
                                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
                                                    U{review.reviewer_id}
                                                </div>
                                                <span className="font-bold text-gray-900">Parent</span>
                                            </div>
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 italic">"{review.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">No reviews yet.</div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Subjects */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" /> Teaches
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {tutor.subjects.map(s => (
                                <span key={s.id} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    </div>

                     {/* Availability */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-600" /> Availability
                        </h3>
                        {tutor.availability?.map((slot, i) => (
                            <div key={i} className="mb-3 last:mb-0 text-sm">
                                <div className="flex flex-wrap gap-1 mb-1">
                                    {slot.days.map(d => (
                                        <span key={d} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{d}</span>
                                    ))}
                                </div>
                                <p className="text-gray-900 font-medium">{slot.start} - {slot.end}</p>
                            </div>
                        )) || <p className="text-gray-500 text-sm">Flexible timing</p>}
                    </div>

                    {/* Qualifications */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-600" /> Certifications
                        </h3>
                         <div className="space-y-3">
                            {tutor.qualifications?.map((q, idx) => (
                                <div key={idx} className="text-sm border-b border-gray-50 last:border-0 pb-2">
                                    <p className="font-bold text-gray-800">{q.skill}</p>
                                    <p className="text-gray-500 text-xs">{q.organization}</p>
                                </div>
                            )) || <p className="text-gray-500 italic text-sm">No certifications listed.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
