import { buildApiV1Url, resolveUrlConfig } from '@/config/urls';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = options;

  const config = resolveUrlConfig();
  if (!config.isConfigured || !config.apiBaseUrl) {
    throw new ApiError(
      config.configurationError ?? 'API endpoint configuration is missing.',
      503,
      'API_NOT_CONFIGURED'
    );
  }

  const url = new URL(buildApiV1Url(path));
  if (query) {
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, String(val));
      }
    });
  }

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  requestHeaders.set('X-Requested-With', 'Ruchiloka-Web');

  let serializedBody: BodyInit | undefined;
  if (body instanceof FormData) {
    serializedBody = body;
  } else if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
    serializedBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...rest,
      headers: requestHeaders,
      body: serializedBody,
      credentials: 'include',
    });
  } catch (networkError) {
    throw new ApiError(
      'Unable to reach Ruchiloka servers right now. Please check your connection or try again shortly.',
      0,
      'NETWORK_UNAVAILABLE',
      networkError
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : `Request failed with status ${response.status}`);
    const code =
      payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string'
        ? payload.code
        : undefined;
    const details =
      payload && typeof payload === 'object' && 'details' in payload ? payload.details : undefined;
    throw new ApiError(message, response.status, code, details);
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}
