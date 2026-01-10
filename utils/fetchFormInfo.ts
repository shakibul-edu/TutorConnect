'use server';
import { FetchApi } from "./FetchApi";

export async function getGradesbyMedium(token: string,  body: {medium_id: string[]} ) {
    if (token) {
        try {
            const response = await FetchApi.post('/grade-by-medium/',body,{'Authorization': `Bearer ${token}`}, {});
         
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

export async function getMediums(token: string) {
    if (token) {
        try {
            const response = await FetchApi.get('/mediums/', {}, {'Authorization': `Bearer ${token}`});
            return response;
        }   catch (error) {
            console.error('Error connecting to server:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}


export async function getSubjects(token: string,  body: {grade_id: string[]} ) {
    if (token) {
        try {
            const response = await FetchApi.post('/subject-by-grade/',body,{'Authorization': `Bearer ${token}`}, {});
         
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

export async function getTeacherProfile(token: string, id: string | undefined = undefined) {
    if (token) {
        try {
            const response = await FetchApi.get('/teacher-profile/', id ? {id:id} : {}, {'Authorization': `Bearer ${token}`});
         
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


export async function getAcademicProfile(token: string) {
    if (token) {
        try {
            const response = await FetchApi.get('/academic-profile/', {}, {'Authorization': `Bearer ${token}`});
         
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
            const response = await FetchApi.get('/qualification/', {}, {'Authorization': `Bearer ${token}`});
         
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
            const response = await FetchApi.get('/availability/', {}, {'Authorization': `Bearer ${token}`});
         
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