import { error } from "console";

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Callback to trigger re-authentication when token is invalid
let onUnauthorizedCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
    onUnauthorizedCallback = callback;
};

export interface FetchApiOptions {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string | number>;
    isFormData?: boolean;
}

export class FetchApi {
    private static baseUrl: string = process.env.BASE_URL || 'https://tutoriaend.shakibul.me';

    /**
     * Parse error response from backend API
     * Handles two formats:
     * 1. Simple detail: { "detail": "Error message" }
     * 2. Field-based: { "field_name": ["Error 1", "Error 2"], "other_field": ["Error"] }
     */
    private static parseErrorResponse(errorData: any, fallbackMessage: string = 'Server error'): string {
        if (!errorData || typeof errorData !== 'object') {
            return fallbackMessage;
        }

        // Format 1: { "detail": "Error message" }
        if (errorData.detail) {
            return typeof errorData.detail === 'string' ? errorData.detail : fallbackMessage;
        }

        // Format 2: Field-based validation errors
        const errorMessages: string[] = [];

        for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
                // Capitalize and format field name (e.g., "student_name" -> "Student name")
                const fieldName = field
                    .split('_')
                    .map((word, index) => index === 0
                        ? word.charAt(0).toUpperCase() + word.slice(1)
                        : word.toLowerCase()
                    )
                    .join(' ');

                messages.forEach((msg: string) => {
                    errorMessages.push(`${fieldName}: ${msg}`);
                });
            } else if (typeof messages === 'string') {
                // Handle single string error for a field
                const fieldName = field
                    .split('_')
                    .map((word, index) => index === 0
                        ? word.charAt(0).toUpperCase() + word.slice(1)
                        : word.toLowerCase()
                    )
                    .join(' ');
                errorMessages.push(`${fieldName}: ${messages}`);
            }
        }

        return errorMessages.length > 0 ? errorMessages.join('\n') : fallbackMessage;
    }

    private static buildEndpointUrl(endpoint: string): string {
        // If endpoint is already a full URL, return it
        if (endpoint.startsWith('http')) return endpoint;

        let url = this.baseUrl;
        if (!url.startsWith('http')) {
            url = `http://${url}`;
        }

        // Remove trailing slash from base if present
        if (url.endsWith('/')) {
            url = url.slice(0, -1);
        }

        // Remove leading slash from endpoint if present
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

        return `${url}/${cleanEndpoint}`;
    }

    private static buildUrl(url: string, params?: Record<string, string | number>): string {
        if (!params) return url;
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return query ? `${url}?${query}` : url;
    }

    static async request<T = any>(
        endpoint: string,
        options: FetchApiOptions = {}
    ): Promise<T> {
        const { method = 'GET', headers = {}, body, params, isFormData = false } = options;
        const url = this.buildEndpointUrl(endpoint);
        const fetchUrl = this.buildUrl(url, params);


        const fetchOptions: RequestInit = {
            method,
            headers: isFormData ? { ...headers } : {
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        if (body && method !== 'GET') {
            fetchOptions.body = isFormData ? body : JSON.stringify(body);
        }
        if (url.includes('undefined')) {
            console.error('Invalid URL constructed:', fetchUrl);
        }
        console.log('FetchApi Request:', { url: fetchUrl, options: fetchOptions });
        const response = await fetch(fetchUrl, fetchOptions);

        // Handle 401 Unauthorized - token is invalid/expired
        if (response.status === 401) {
            console.log('Received 401 Unauthorized - triggering re-authentication');
            if (onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }
        }

        if (response.status === 204) {
            return null as T;
        }
        // const responseText = await response.text();
        // console.log('FetchApi Response:', { status: response.status, body: responseText });

        if (!response.ok) {
            let errorMessage = 'Server error';
            try {
                const errorData = await response.json();
                errorMessage = this.parseErrorResponse(errorData, response.statusText);
            } catch (e) {
                // If JSON parsing fails, use status text or default message
                errorMessage = response.statusText || `HTTP Error ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }



    static get<T = any>(endpoint: string, params?: Record<string, string | number>, headers?: Record<string, string>, body?: any) {
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


