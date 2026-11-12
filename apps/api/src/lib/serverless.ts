import type { HandlerContext, HandlerEvent } from '@netlify/functions';

/**
 * Normalizes incoming Netlify Function paths so both rewritten `/api/*` requests
 * (`/.netlify/functions/api/...`), direct function calls, and `/uploads/*`
 * asset requests resolve consistently against the Express router.
 */
export function normalizeServerlessPath(rawPath: string): string {
  const pathOnly = (rawPath || '/').split('?')[0] || '/';
  let stripped = pathOnly.replace(/^\/\.netlify\/functions\/api(?=\/|$)/i, '');
  if (!stripped) {
    stripped = '/';
  }
  if (!stripped.startsWith('/')) {
    stripped = `/${stripped}`;
  }
  if (
    stripped === '/api' ||
    stripped.startsWith('/api/') ||
    stripped === '/uploads' ||
    stripped.startsWith('/uploads/')
  ) {
    return stripped;
  }
  if (stripped === '/') {
    return '/';
  }
  return `/api${stripped}`;
}

export interface NormalizedLambdaEvent extends HandlerEvent {
  body: string;
  requestContext: {
    requestId: string;
    identity: {
      sourceIp: string;
    };
  };
}

/**
 * Ensures Netlify's HandlerEvent matches the fields serverless-http expects from
 * an AWS API Gateway v1 event (non-null body and initialized requestContext).
 */
export function normalizeNetlifyEvent(
  event: HandlerEvent,
  context?: Partial<HandlerContext>
): NormalizedLambdaEvent {
  const headers = event.headers ?? {};
  const netlifyIp = headers['x-nf-client-connection-ip'];
  const forwardedIp = headers['x-forwarded-for']?.split(',')[0]?.trim();
  const sourceIp = (typeof netlifyIp === 'string' && netlifyIp.trim()) || forwardedIp || '127.0.0.1';

  const existingRequestContext = (
    event as unknown as {
      requestContext?: { requestId?: string; identity?: { sourceIp?: string } };
    }
  ).requestContext;

  return {
    ...event,
    path: normalizeServerlessPath(event.path || '/'),
    body: event.body ?? '',
    headers,
    multiValueHeaders: event.multiValueHeaders ?? {},
    requestContext: {
      requestId: existingRequestContext?.requestId || context?.awsRequestId || 'netlify-request',
      identity: {
        sourceIp: existingRequestContext?.identity?.sourceIp || sourceIp,
      },
    },
  };
}
