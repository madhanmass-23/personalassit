export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'
).replace(/\/+$/, '');

export class ApiError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export interface FetchClientOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | Record<string, unknown> | object | null;
}

export async function fetchClient(endpoint: string, options: FetchClientOptions = {}) {
  const cleanBaseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'
  ).replace(/\/+$/, '');

  const cleanEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const url = `${cleanBaseUrl}${cleanEndpoint}`;
  
  // Create default options, handling JSON serialization and credentials
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };

  let body = options.body;
  if (body && typeof body !== 'string' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    body: body as BodyInit,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
    // Required for HttpOnly cookie session auth cross-origin
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
    }

    if (!response.ok || (data && data.success === false)) {
      const message = data?.error?.message || 'An error occurred';
      const code = data?.error?.code || 'UNKNOWN_ERROR';
      throw new ApiError(message, code, response.status);
    }

    return data?.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Network error', 'NETWORK_ERROR', 0);
  }
}

export interface BlobResponse {
  blob: Blob;
  filename?: string;
}

export async function fetchBlob(
  endpoint: string,
  options: FetchClientOptions = {}
): Promise<BlobResponse> {
  const cleanBaseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'
  ).replace(/\/+$/, '');

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBaseUrl}${cleanEndpoint}`;

  const defaultHeaders: Record<string, string> = {
    Accept: 'text/csv, application/octet-stream, */*',
  };

  let body = options.body;
  if (body && typeof body !== 'string' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  const config: RequestInit = {
    ...options,
    body: body as BodyInit | null | undefined,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let message = 'Failed to download file';
      try {
        const text = await response.text();
        const errJson = text ? JSON.parse(text) : null;
        message = errJson?.error?.message || errJson?.message || message;
      } catch {
        // Fallback to default message
      }
      throw new ApiError(message, 'DOWNLOAD_ERROR', response.status);
    }

    // Extract filename from Content-Disposition header if available
    let filename: string | undefined;
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].trim());
      }
    }

    const blob = await response.blob();
    return { blob, filename };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error during download',
      'NETWORK_ERROR',
      0
    );
  }
}
