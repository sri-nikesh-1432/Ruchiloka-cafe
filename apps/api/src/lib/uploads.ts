import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getConfig } from '../config/env';
import { HttpError } from './errors';

export function detectImageExtensionByMagicBytes(
  buffer: Buffer,
  allowMimetypeFallback = false,
  mimetype = ''
): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'png';
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  // AVIF: ....ftypavif / ftypavis
  if (
    buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
    buffer.subarray(8, 12).toString('ascii').includes('avi')
  ) {
    return 'avif';
  }

  if (allowMimetypeFallback) {
    if (mimetype === 'image/jpeg') return 'jpg';
    if (mimetype === 'image/png') return 'png';
    if (mimetype === 'image/webp') return 'webp';
  }
  return null;
}

export async function storeUploadedImage(params: {
  file: Express.Multer.File;
  folder: string;
  prefix: string;
  strictMagicBytes?: boolean;
  allowDataUriFallbackInServerless?: boolean;
}): Promise<{ imageUrl: string; storage: 'cloudinary' | 'local' | 'inline-data-uri' }> {
  const ext = detectImageExtensionByMagicBytes(
    params.file.buffer,
    !params.strictMagicBytes,
    params.file.mimetype
  );
  if (!ext) {
    throw new HttpError(
      400,
      'Unsupported or corrupted image file. Please upload a valid JPG, PNG, WebP, or AVIF image.',
      'INVALID_IMAGE_FILE'
    );
  }

  const config = getConfig();

  if (
    config.cloudinary.enabled &&
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret
  ) {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `folder=${params.folder}&timestamp=${timestamp}${config.cloudinary.apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const form = new FormData();
    const blob = new Blob([new Uint8Array(params.file.buffer)], { type: mime });
    form.append('file', blob, `${params.prefix}-${timestamp}.${ext}`);
    form.append('api_key', config.cloudinary.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', params.folder);
    form.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudinary.cloudName)}/image/upload`,
      { method: 'POST', body: form }
    );
    const payload = (await response.json()) as {
      secure_url?: string;
      error?: { message?: string };
    };
    if (!response.ok || !payload.secure_url) {
      throw new HttpError(
        502,
        payload.error?.message || 'Cloudinary image upload failed.',
        'IMAGE_UPLOAD_FAILED'
      );
    }

    return { imageUrl: payload.secure_url, storage: 'cloudinary' };
  }

  const isServerless =
    process.env.NETLIFY === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    if (params.allowDataUriFallbackInServerless) {
      const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      const base64 = params.file.buffer.toString('base64');
      return {
        imageUrl: `data:${mime};base64,${base64}`,
        storage: 'inline-data-uri',
      };
    }

    throw new HttpError(
      503,
      'Cloudinary credentials are not configured. Local disk uploads are unavailable in serverless production.',
      'CLOUDINARY_NOT_CONFIGURED'
    );
  }

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = `${params.prefix}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const targetPath = path.join(uploadsDir, filename);
  await fs.writeFile(targetPath, params.file.buffer);

  return {
    imageUrl: `${config.backendUrl}/uploads/${filename}`,
    storage: 'local',
  };
}
