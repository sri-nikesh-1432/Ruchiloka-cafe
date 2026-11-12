import serverless from 'serverless-http';
import type { Handler, HandlerResponse } from '@netlify/functions';
import { createApp } from '../../apps/api/src/app';
import { normalizeNetlifyEvent } from '../../apps/api/src/lib/serverless';

let cachedExpressHandler: ReturnType<typeof serverless> | null = null;

function getExpressHandler(): ReturnType<typeof serverless> {
  if (!cachedExpressHandler) {
    const app = createApp();
    cachedExpressHandler = serverless(app, {
      binary: ['image/*', 'multipart/form-data', 'application/octet-stream'],
    });
  }
  return cachedExpressHandler;
}

export const handler: Handler = async (event, context) => {
  const normalizedEvent = normalizeNetlifyEvent(event, context);
  const expressHandler = getExpressHandler();
  const response = await expressHandler(normalizedEvent, context);

  return (
    response ?? {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Empty response returned by API handler.',
      }),
    }
  ) as HandlerResponse;
};
