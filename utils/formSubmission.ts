'use server';

import { FetchApi } from "./FetchApi";
import { z } from "zod";
import { availabilitySchema, formSchema, qualificationSchema } from "../formSchema";
type FormType = z.infer<typeof formSchema>;


export async function createTeacher(token: string, data: FormType) {
    const parsed = formSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error("Invalid form data");
    }
    if (token) {
        try {
            const response = await FetchApi.post("/teacher/", data, {'Authorization': `Bearer ${token}`}, {});
            return response;
        } catch (error) {
            throw new Error((error as {message?: string} | any).message || "Error creating teacher");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}

export async function createAvailability(token: string, data: any) {
    data.map((slot: any) => {
        const parsed = availabilitySchema.safeParse(slot);
        if (!parsed.success) {
            throw new Error(`Invalid availability data: ${parsed.error.message}`);
        }
    })
    
    if (token) {
        try {
            const response = await FetchApi.post("/availability/", data, {'Authorization': `Bearer ${token}`}, {});
            return response;
        } catch (error) {
            throw new Error((error as {message?: string} | any).message || "Error creating availability");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}



export async function updateTeacher (token: string,id: string, data: FormType) {
    const parsed = formSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error("Invalid form data");
    }
    if (token) {
        try {
            const response = await FetchApi.put(`/teacher-profile/${id}/`, data, {'Authorization': `Bearer ${token}`});
            return response;
        } catch (error) {
            throw new Error((error as {message?: string} | any).message || "Error creating teacher");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}

export async function updateQualification (token: string,id: string, data:any) {
    // When updating we allow partial fields and optional certificate.
    // If data is a plain object (non-FormData) we validate strictly; if it's FormData we skip strict zod validation
    // because FormData doesn't serialize File metadata the same way and certificate may be omitted intentionally.
    if (!(data instanceof FormData)) {
        const parsed = qualificationSchema.partial({ certificates: true }).safeParse(data);
        if (!parsed.success) {
            throw new Error("Invalid qualification data");
        }
    }
    if (token) {
        try {
            const isFormData = data instanceof FormData;
            const response = await FetchApi.put(`/qualification/${id}/`, data, {'Authorization': `Bearer ${token}`}, {}, isFormData);
            return response;
        } catch (error) {
            throw new Error((error as {message?: string} | any).message || "Error updating qualification");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}

export async function deleteQualification(token: string, id: string) {
    if (token) {
        try {
            const response = await FetchApi.delete(`/qualification/${id}/`,undefined, {'Authorization': `Bearer ${token}`});
            return response;
        } catch (error) {
            throw new Error((error as {message?: string} | any).message || "Error deleting qualification");
        }
    } else {    
        console.error("No token provided");
    }
    return null;
}

export async function updateAvailability(token: string, id:string, data: any) {
    data.map((slot: any) => {
        const parsed = availabilitySchema.safeParse(slot);
        if (!parsed.success) {
            throw new Error(`Invalid availability data: ${parsed.error.message}`);
        }
    })
    
    if (token) {
        try {
            const response = await FetchApi.put(`/availability/${id}`, data, {'Authorization': `Bearer ${token}`});
            return response;
        } catch (error) {
            throw new Error((error as {message?: string} | any).message || "Error creating availability");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}


export async function submitAcademicProfiles(token: string, data: any) {
    if (token) {
        try {
            const response = await FetchApi.post("/academic-profile/", data, {'Authorization': `Bearer ${token}`}, {}, true);
            return response;
        } catch (error) {
            throw new Error((error as {message?: string} | any).message || "Error submitting academic profiles");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}

export async function updateAcademicProfile(token: string, id: string, data: any) {
    // Allow partial updates; accept FormData
    if (!(data instanceof FormData)) {
        // we could validate with academicProfileSchema.partial(), but server may accept partial
    }
    if (token) {
        try {
            const isFormData = data instanceof FormData;
            const response = await FetchApi.put(`/academic-profile/${id}/`, data, {'Authorization': `Bearer ${token}`}, {}, isFormData);
            return response;
        } catch (error) {
            throw new Error((error as {message?: string} | any).message || "Error updating academic profile");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}

export async function deleteAcademicProfile(token: string, id: string) {
    if (token) {
        try {
            const response = await FetchApi.delete(`/academic-profile/${id}/`, undefined, {'Authorization': `Bearer ${token}`});
            return response;
        } catch (error) {
            throw new Error((error as {message?: string} | any).message || "Error deleting academic profile");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}

export async function submitQualification(token: string, data: any) {
    if (token) {
        try {
            const response = await FetchApi.post("/qualification/", data, {'Authorization': `Bearer ${token}`}, {}, true);
            return response;
        } catch (error) {
            throw new Error((error as {message?: string} | any).message || "Error submitting academic profiles");
        }
    } else {
        console.error("No token provided");
    }
    return null;
}