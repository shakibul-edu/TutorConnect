'use server';

import { FetchApi } from "./FetchApi";

export async function connectToServer(token: string) {
    if (token) {
        try {
            const response = await FetchApi.get('/protected',{},{'Authorization': `Bearer ${token}`});
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


export async function setLocation(token: string, location: string, params: { update?: string } = {}) {
    if (token) {
        console.log('Setting location:', location);
        try {
            const response = await FetchApi.post('/set-location/',{location},{'Authorization': `Bearer ${token}`}, params);
         
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

export async function getLocation(token: string) {
    if (token) {
        try {
            const response = await FetchApi.request('/get-location/', { 
                method: 'GET', 
                headers: {'Authorization': `Bearer ${token}`},
                skipToast: true 
            });
            if (response.location) {
                return response.location;
            } else {
                return null;
            }
        } catch (error: any) {
            if (error.message && error.message.includes('Location not set')) {
                return null;
            }
            // Show toast for permission errors (banned users)
            if (error.message && (error.message.includes('permission') || error.message.includes('forbidden'))) {
                try {
                    const { toast } = await import('@/lib/toast');
                    toast.error(error.message);
                } catch (e) {
                    console.warn('⚠️ Toast failed:', e);
                }
            }
            console.error('Error connecting to server in getLocation:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}
