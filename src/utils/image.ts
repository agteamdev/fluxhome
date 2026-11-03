import { blobToDataUrl } from './blob';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
/** Longest side and JPEG quality to try, from best to smallest, until the result is small enough. */
const STEPS = [
  { side: 2560, quality: 0.85 },
  { side: 1920, quality: 0.8 },
  { side: 1600, quality: 0.72 },
  { side: 1280, quality: 0.65 },
];

/** Scales a size down so that it fits into the box (never scales up). */
export function fitWithin(width: number, height: number, maxWidth: number, maxHeight: number): { width: number; height: number } {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Turns a picture chosen by the user into a compact JPEG "data:" URL for the page background.
 * Everything happens in the browser: the picture is never uploaded anywhere.
 * Returns null when the file is not a usable picture or cannot be made small enough (`maxChars` characters).
 */
export async function imageFileToDataUrl(file: File, maxChars: number): Promise<string | null> {
  if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SOURCE_BYTES) return null;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }

  try {
    for (const step of STEPS) {
      const { width, height } = fitWithin(bitmap.width, bitmap.height, step.side, step.side);
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.fillStyle = '#ffffff'; // transparent PNGs become white instead of black
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
      const dataUrl = await blobToDataUrl(await canvas.convertToBlob({ type: 'image/jpeg', quality: step.quality }));
      if (dataUrl.length <= maxChars) return dataUrl;
    }
    return null;
  } finally {
    bitmap.close();
  }
}

/**
 * Turns a picture chosen by the user into a small square PNG "data:" URL (an icon).
 * The picture is cropped to a square from the middle; transparency is kept.
 * Returns null when the file is not a usable picture or the result is larger than `maxChars` characters.
 */
export async function imageFileToIcon(file: File, maxChars: number, sizes: number[] = [64, 48, 32]): Promise<string | null> {
  if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SOURCE_BYTES) return null;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    for (const size of sizes) {
      const canvas = new OffscreenCanvas(size, size);
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
      const dataUrl = await blobToDataUrl(await canvas.convertToBlob({ type: 'image/png' }));
      if (dataUrl.length <= maxChars) return dataUrl;
    }
    return null;
  } finally {
    bitmap.close();
  }
}
