
import { toast } from "../lib/toast";
import { getSession } from "next-auth/react";

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface FetchApiOptions {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string | number | Array<string | number>>;
    isFormData?: boolean;
    skipAuth?: boolean;
}

export class FetchApi {
    private static baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:8000';

    private static async getAuthToken(): Promise<string | null> {
        if (typeof window === 'undefined') return null;

        const session = await getSession();
        return session?.backendAccess || null;
    }

    private static buildEndpointUrl(endpoint: string): string {
        return `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }

    private static buildUrl(url: string, params?: Record<string, string | number | Array<string | number>>): string {
        if (!params) return url;
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (item !== undefined && item !== null) {
                        searchParams.append(key, String(item));
                    }
                });
            } else if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        const query = searchParams.toString();
        return query ? `${url}?${query}` : url;
    }

    static async request<T = any>(
        endpoint: string,
        options: FetchApiOptions = {}
    ): Promise<T> {
        const { method = 'GET', headers = {}, body, params, isFormData = false, skipAuth = false } = options;
        const url = this.buildEndpointUrl(endpoint);
        const fetchUrl = this.buildUrl(url, params);

        const authHeaders: Record<string, string> = { ...headers };
        if (!skipAuth) {
            const token = await this.getAuthToken();
            if (token) {
                authHeaders['Authorization'] = `Bearer ${token}`;
            }
        }

        const fetchOptions: RequestInit = {
            method,
            headers: isFormData ? { ...authHeaders } : {
                'Content-Type': 'application/json',
                ...authHeaders,
            },
        };

        if (body && method !== 'GET') {
            fetchOptions.body = isFormData ? body : JSON.stringify(body);
        }



        try {
            const response = await fetch(fetchUrl, fetchOptions);

            if (response.status === 204) {
                return null as T;
            }

            if (!response.ok) {
                let errorMessage = 'Server error';
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.detail) {
                        errorMessage = errorData.detail;
                    } else if (response.statusText) {
                        errorMessage = response.statusText;
                    }
                } catch (e) {
                    // Ignore JSON parse errors, use default message
                }

                // Show toast for error - strictly client side, will be ignored if on server (toast implementation is safe)
                if (typeof window !== 'undefined') {
                    toast.error(errorMessage);
                }
                throw new Error(errorMessage);
            }

            return response.json();
        } catch (error: any) {
            // If it's a network error or something not caught above
            const msg = error.message || 'Network request failed';
            // Avoid double toasting if we already threw with a message above
            if ((!error.message || error.message === 'Failed to fetch') && typeof window !== 'undefined') {
                toast.error('Network error: Unable to connect to server');
            }
            throw error;
        }
    }



    static get<T = any>(endpoint: string, params?: Record<string, string | number | Array<string | number>>, headers?: Record<string, string>, body?: any) {
        return this.request<T>(endpoint, { method: 'GET', params, headers, body });
    }

    static post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>, params?: Record<string, string | number>, isFormData: boolean = false) {
        return this.request<T>(endpoint, { method: 'POST', body, headers, params, isFormData });
    }

    static put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>, params?: Record<string, string | number>, isFormData: boolean = false) {
        return this.request<T>(endpoint, { method: 'PUT', body, headers, params, isFormData });
    }

    static delete<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
        return this.request<T>(endpoint, { method: 'DELETE', body, headers });
    }

    static patch<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
        return this.request<T>(endpoint, { method: 'PATCH', body, headers });
    }
}
