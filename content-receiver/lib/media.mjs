import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const MAX_MEDIA_BYTES_PER_FILE = 4 * 1024 * 1024;
export const MAX_MEDIA_BYTES_TOTAL = 24 * 1024 * 1024;

/**
 * File type detection by content, never by the name the client sent.
 * Only raster formats a browser can display are accepted.
 */
export function sniffImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (buffer.subarray(0, 4).toString('ascii') === 'GIF8') {
    return { mime: 'image/gif', ext: 'gif' };
  }
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('ascii');
    if (brand === 'avif' || brand === 'avis') return { mime: 'image/avif', ext: 'avif' };
  }
  return null;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Stores one image under /media/<sha256>.<ext>.
 * Content addressing makes repeated syncs of the same file a no-op and lets
 * nginx cache the file immutably.
 */
export async function storeImage({ dataBase64, publicDir }) {
  if (typeof dataBase64 !== 'string' || dataBase64.length < 32) {
    throw new Error('media_data_missing');
  }
  const buffer = Buffer.from(dataBase64, 'base64');
  if (buffer.length === 0) throw new Error('media_data_empty');
  if (buffer.length > MAX_MEDIA_BYTES_PER_FILE) {
    throw new Error(`media_too_large:${buffer.length}`);
  }

  const kind = sniffImage(buffer);
  if (!kind) throw new Error('media_type_not_allowed');

  const digest = sha256(buffer);
  const filename = `${digest}.${kind.ext}`;
  const dir = path.join(publicDir, 'media');
  await fs.mkdir(dir, { recursive: true });

  const target = path.join(dir, filename);
  try {
    await fs.access(target);
  } catch {
    const tmp = `${target}.tmp-${process.pid}`;
    await fs.writeFile(tmp, buffer, { mode: 0o644 });
    await fs.rename(tmp, target);
  }

  return {
    path: `/media/${filename}`,
    mime: kind.mime,
    bytes: buffer.length,
    sha256: digest,
  };
}

/**
 * Article bodies reference images as elomai-media:<sha256>.<ext> so the
 * public URL stays stable no matter where the file physically lives.
 */
export function rewriteMediaReferences(html, resolve) {
  return String(html).replace(/elomai-media:([a-f0-9]{64}\.[a-z0-9]{2,4})/g, (_match, name) => {
    const resolved = resolve(name);
    return resolved || '/media/missing.webp';
  });
}
