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
            const response = await FetchApi.get('/get-location/', {}, {'Authorization': `Bearer ${token}`});
            if(response.location){
                return response.location;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error connecting to server:', error);
            throw error;
        }
    } else {
        console.warn('No token found, skipping server connection');
        return null;
    }
}
