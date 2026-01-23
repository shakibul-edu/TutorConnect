'use server';

import { FetchApi } from "../FetchApi";
import { z } from "zod";
import { formSchema } from "../formSchema";

// Types
type FormType = z.infer<typeof formSchema>;

// --- Metadata APIs ---

export async function getMediums(token: string) {
    if (token) {
        try {
            const response = await FetchApi.get('/mediums/', {}, { 'Authorization': `Bearer ${token}` });
            return response;
        } catch (error) {
            console.error('Error connecting to server:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}

export async function getGradesbyMedium(token: string, body: { medium_id: string[] }) {
    if (token) {
        try {
            const response = await FetchApi.post('/grade-by-medium/', body, { 'Authorization': `Bearer ${token}` }, {});
            return response;
        } catch (error) {
            console.error('Error connecting to server:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}

export async function getSubjects(token: string, body: { grade_id: string[] }) {
    if (token) {
        try {
            const response = await FetchApi.post('/subject-by-grade/', body, { 'Authorization': `Bearer ${token}` }, {});
            return response;
        } catch (error) {
            console.error('Error connecting to server:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}

// --- Teacher Profile APIs ---

export async function getTeachers(token: string, filters: any = {}) {
    if (token) {
        try {
            const response = await FetchApi.get('/filter-teachers/', filters, { 'Authorization': `Bearer ${token}` });
            return response;
        } catch (error) {
            console.error('Error fetching teachers:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}

export async function getTeacherProfile(token: string, id: string | undefined = undefined) {
    if (token) {
        try {
            const response = await FetchApi.get('/teacher-profile/', id ? { id: id } : {}, { 'Authorization': `Bearer ${token}` });
            return response;
        } catch (error) {
            console.error('Error connecting to server:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}

export async function getTeacherFullProfile(token: string, id: string) {
    if (token) {
        try {
            const response = await FetchApi.get(`/teacher/full-profile/${id}/`, {}, { 'Authorization': `Bearer ${token}` });
            return response;
        } catch (error) {
            console.error('Error fetching full profile:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}

export async function getAcademicProfile(token: string) {
    if (token) {
        try {
            const response = await FetchApi.get('/academic-profile/', {}, { 'Authorization': `Bearer ${token}` });
            return response;
        } catch (error) {
            console.error('Error connecting to server:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}

export async function getQualification(token: string) {
    if (token) {
        try {
            const response = await FetchApi.get('/qualification/', {}, { 'Authorization': `Bearer ${token}` });
            return response;
        } catch (error) {
            console.error('Error connecting to server:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}

export async function getSlots(token: string) {
    if (token) {
        try {
            const response = await FetchApi.get('/availability/', {}, { 'Authorization': `Bearer ${token}` });
            console.log('Response availability:', response);
            return response;
        } catch (error) {
            console.error('Error connecting to server:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}

export async function createTeacher(token: string, data: FormType) {
    if (token) {
        try {
            const response = await FetchApi.post("/teacher-profile/", data, { 'Authorization': `Bearer ${token}` }, {}, true);
            return response;
        } catch (error) {
            throw new Error((error as { message?: string } | any).message || "Error creating teacher");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}

export async function updateTeacher(token: string, id: string, data: FormType) {
    if (token) {
        try {
            const response = await FetchApi.put(`/teacher-profile/${id}/`, data, { 'Authorization': `Bearer ${token}` }, {}, true);
            return response;
        } catch (error) {
            throw new Error((error as { message?: string } | any).message || "Error creating teacher");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}

// --- Availability APIs ---

export async function createAvailability(token: string, data: any) {
    if (token) {
        try {
            const response = await FetchApi.post("/availability/", data, { 'Authorization': `Bearer ${token}` }, {});
            return response;
        } catch (error) {
            throw new Error((error as { message?: string } | any).message || "Error creating availability");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}

export async function updateAvailability(token: string, id: string, data: any) {
    if (token) {
        try {
            const response = await FetchApi.put(`/availability/${id}/`, data, { 'Authorization': `Bearer ${token}` });
            return response;
        } catch (error) {
            throw new Error((error as { message?: string } | any).message || "Error creating availability");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}

// --- Qualification APIs ---

export async function submitAcademicProfiles(token: string, data: any) {
    if (token) {
        try {
            const response = await FetchApi.post("/academic-profile/", data, { 'Authorization': `Bearer ${token}` }, {}, true);
            return response;
        } catch (error) {
            throw new Error((error as { message?: string } | any).message || "Error submitting academic profiles");
        }
    }
    return null;
}

export async function updateAcademicProfile(token: string, id: string, data: any) {
    if (token) {
        try {
            const isFormData = data instanceof FormData;
            const response = await FetchApi.put(`/academic-profile/${id}/`, data, { 'Authorization': `Bearer ${token}` }, {}, isFormData);
            return response;
        } catch (error) {
            throw new Error((error as { message?: string } | any).message || "Error updating academic profile");
        }
    }
    return null;
}

export async function deleteAcademicProfile(token: string, id: string) {
    if (token) {
        try {
            const response = await FetchApi.delete(`/academic-profile/${id}/`, undefined, { 'Authorization': `Bearer ${token}` });
            return response;
        } catch (error) {
            throw new Error((error as { message?: string } | any).message || "Error deleting academic profile");
        }
    }
    return null;
}

export async function submitQualification(token: string, data: any) {
    if (token) {
        try {
            const response = await FetchApi.post("/qualification/", data, { 'Authorization': `Bearer ${token}` }, {}, true);
            return response;
        } catch (error) {
            throw new Error((error as { message?: string } | any).message || "Error submitting academic profiles");
        }
    }
    return null;
}

export async function updateQualification(token: string, id: string, data: any) {
    if (token) {
        try {
            const isFormData = data instanceof FormData;
            const response = await FetchApi.put(`/qualification/${id}/`, data, { 'Authorization': `Bearer ${token}` }, {}, isFormData);
            return response;
        } catch (error) {
            throw new Error((error as { message?: string } | any).message || "Error updating qualification");
        }
    }
    return null;
}

export async function deleteQualification(token: string, id: string) {
    if (token) {
        try {
            const response = await FetchApi.delete(`/qualification/${id}/`, undefined, { 'Authorization': `Bearer ${token}` });
            return response;
        } catch (error) {
            throw new Error((error as { message?: string } | any).message || "Error deleting qualification");
        }
    }
    return null;
}

// --- Listing APIs ---

export async function getTutions(filters: any = {}) {
    try {
        const params: any = {};
        if (filters.postId) params.id = filters.postId;
        if (filters.feeRange) params.min_salary = filters.feeRange;
        if (filters.gender && filters.gender !== "Any") params.gender = filters.gender.toLowerCase();
        if (filters.tuitionType && filters.tuitionType !== "All Tuition") params.teaching_mode = filters.tuitionType.toLowerCase();
        if (filters.distance) params.preferred_distance = filters.distance;

        console.log("Fetching tuitions with params:", params);

        const response = await FetchApi.get("/teacher/", params);
        return response;
    } catch (error) {
        console.error("Error in getTutions:", error);
        throw new Error("Failed to fetch tuitions");
    }
}
