import { useAuthStore } from '../store/authStore';

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

const API_BASE_URL = configuredApiUrl || (
  typeof window !== 'undefined'
    ? (window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api')
    : 'http://localhost:5000/api'
);

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...rest } = options;
  const token = useAuthStore.getState().token;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (params) {
    const cleanParams = Object.entries(params)
      .filter(([_, val]) => val !== undefined && val !== null && val !== '')
      .reduce((acc, [key, val]) => ({ ...acc, [key]: String(val) }), {});
    const searchParams = new URLSearchParams(cleanParams);
    url += `?${searchParams.toString()}`;
  }

  // Set default headers
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const config = {
    ...rest,
    headers: {
      ...defaultHeaders,
      ...headers
    }
  };

  const response = await fetch(url, config);

  // If 401 Unauthorized, log out user
  if (response.status === 401) {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  get: <T = any>(url: string, params?: RequestOptions['params'], options?: Omit<RequestOptions, 'params'>) => 
    apiRequest<T>(url, { method: 'GET', params, ...options }),
    
  post: <T = any>(url: string, body?: any, options?: RequestOptions) => 
    apiRequest<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...options }),
    
  put: <T = any>(url: string, body?: any, options?: RequestOptions) => 
    apiRequest<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...options }),
    
  delete: <T = any>(url: string, options?: RequestOptions) => 
    apiRequest<T>(url, { method: 'DELETE', ...options })
};
export { API_BASE_URL };
