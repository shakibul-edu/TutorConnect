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
    private static baseUrl: string = process.env.BASE_URL || '127.0.0.1:8000';

    private static buildEndpointUrl(endpoint: string): string {
        if (!this.baseUrl) {
            throw new Error('Base URL is not set. Use FetchApi.setBaseUrl(url) first.');
        }
        return `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
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
            headers: isFormData ? {...headers } : {
            'Content-Type': 'application/json',
            ...headers,
            },
        };

        if (body && method !== 'GET') {
            fetchOptions.body = isFormData ? body : JSON.stringify(body);
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
        
        if (response.status === 204){
            return null as T;
        }
        // const responseText = await response.text();
        // console.log('FetchApi Response:', { status: response.status, body: responseText });

        if (!response.ok) {
            let errorMessage = 'Server error';
            try {
                const errorData = await response.json();
                
                // Handle field-specific validation errors
                // Format: { "field_name": ["error message 1", "error message 2"] }
                if (errorData && typeof errorData === 'object' && !errorData.detail) {
                    const errorMessages: string[] = [];
                    
                    for (const [field, messages] of Object.entries(errorData)) {
                        if (Array.isArray(messages)) {
                            // Capitalize field name and add each error message
                            const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                            messages.forEach((msg: string) => {
                                errorMessages.push(`${fieldName}: ${msg}`);
                            });
                        } else if (typeof messages === 'string') {
                            // Handle single string error
                            const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                            errorMessages.push(`${fieldName}: ${messages}`);
                        }
                    }
                    
                    if (errorMessages.length > 0) {
                        errorMessage = errorMessages.join(' | ');
                    }
                } else if (errorData && errorData.detail) {
                    // Handle general error detail
                    errorMessage = errorData.detail;
                } else if (response.statusText) {
                    errorMessage = response.statusText;
                }
            } catch (e) {
                // Ignore JSON parse errors, use default message
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }


      
    static get<T = any>(endpoint: string, params?: Record<string, string | number>, headers?: Record<string, string>, body?: any) {
        return this.request<T>(endpoint, { method: 'GET', params, headers, body });
    }

    static post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>,params?: Record<string, string | number>, isFormData: boolean = false) {
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


