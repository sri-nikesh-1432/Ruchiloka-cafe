import http from 'node:http';
import { PassThrough } from 'node:stream';
import type { Express } from 'express';

export interface InvokeRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'OPTIONS';
  path: string;
  headers?: Record<string, string>;
  cookies?: string[];
  body?: unknown;
}

export interface InvokeResponse {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

export function invokeApp(app: Express, opts: InvokeRequestOptions): Promise<InvokeResponse> {
  return new Promise((resolve, reject) => {
    const socket = new PassThrough() as unknown as PassThrough & {
      remoteAddress: string;
      encrypted: boolean;
      writable: boolean;
      readable: boolean;
      destroyed: boolean;
      cork: () => void;
      uncork: () => void;
      destroy: () => void;
    };
    socket.remoteAddress = '127.0.0.1';
    socket.encrypted = false;
    socket.writable = true;
    socket.readable = true;
    socket.destroyed = false;
    socket.cork = () => undefined;
    socket.uncork = () => undefined;
    socket.destroy = () => undefined;

    const req = new http.IncomingMessage(socket as never);
    req.method = opts.method;
    req.url = opts.path;

    const normalizedHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(opts.headers ?? {})) {
      normalizedHeaders[k.toLowerCase()] = v;
    }
    if (opts.cookies && opts.cookies.length > 0) {
      normalizedHeaders.cookie = opts.cookies.join('; ');
    }

    let payloadBuffer: Buffer | null = null;
    if (opts.body !== undefined) {
      const json = JSON.stringify(opts.body);
      payloadBuffer = Buffer.from(json, 'utf8');
      normalizedHeaders['content-type'] ??= 'application/json';
      normalizedHeaders['content-length'] = String(payloadBuffer.byteLength);
    }
    req.headers = normalizedHeaders;

    const res = new http.ServerResponse(req);
    const chunks: Buffer[] = [];
    let settled = false;

    const finishResponse = () => {
      if (settled) return;
      settled = true;

      const text = Buffer.concat(chunks).toString('utf8');
      const rawHeaders = res.getHeaders();
      const headers: Record<string, string | string[] | undefined> = {};
      for (const [key, val] of Object.entries(rawHeaders)) {
        if (typeof val === 'number') headers[key.toLowerCase()] = String(val);
        else headers[key.toLowerCase()] = val;
      }

      let parsedBody: unknown = text;
      const contentType = String(headers['content-type'] ?? '');
      if (contentType.includes('application/json') && text) {
        try {
          parsedBody = JSON.parse(text);
        } catch {
          parsedBody = text;
        }
      }

      try {
        res.emit('finish');
      } catch {
        // ignore listener errors during teardown
      }

      resolve({
        status: res.statusCode,
        headers,
        text,
        body: parsedBody,
      });
    };

    res.write = ((chunk: unknown, encoding?: unknown, cb?: unknown) => {
      if (chunk !== undefined && chunk !== null && typeof chunk !== 'function') {
        const buf = Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(String(chunk), typeof encoding === 'string' ? (encoding as BufferEncoding) : 'utf8');
        chunks.push(buf);
      }
      if (typeof encoding === 'function') (encoding as () => void)();
      if (typeof cb === 'function') (cb as () => void)();
      return true;
    }) as typeof res.write;

    res.end = ((chunk?: unknown, encoding?: unknown, cb?: unknown) => {
      if (chunk !== undefined && chunk !== null && typeof chunk !== 'function') {
        const buf = Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(String(chunk), typeof encoding === 'string' ? (encoding as BufferEncoding) : 'utf8');
        chunks.push(buf);
      }
      if (typeof chunk === 'function') (chunk as () => void)();
      if (typeof encoding === 'function') (encoding as () => void)();
      if (typeof cb === 'function') (cb as () => void)();
      finishResponse();
      return res;
    }) as typeof res.end;

    res.on('error', reject);

    app(req, res);

    queueMicrotask(() => {
      if (payloadBuffer) {
        req.push(payloadBuffer);
      }
      req.push(null);
    });
  });
}
