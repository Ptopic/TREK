import fs from 'fs';
import path from 'path';
import { db } from '../db/database';

export const placeImagesDir = path.join(__dirname, '../../uploads/photos');
export const MAX_PLACE_IMAGE_SIZE = 10 * 1024 * 1024;

export interface PlaceImage {
  id: number;
  trip_id: number;
  place_id: number;
  filename: string;
  original_name: string;
  file_size: number | null;
  mime_type: string | null;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
  url: string;
}

export function isSupportedPlaceImage(file: Express.Multer.File | undefined): boolean {
  if (!file) return false;
  if (!file.mimetype?.startsWith('image/')) return false;
  const ext = path.extname(file.originalname || '').toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'].includes(ext);
}

export function placeExists(tripId: string | number, placeId: string | number): boolean {
  return !!db.prepare('SELECT 1 FROM places WHERE id = ? AND trip_id = ?').get(placeId, tripId);
}

function formatImage(row: Omit<PlaceImage, 'url'>): PlaceImage {
  return {
    ...row,
    url: `/api/trips/${row.trip_id}/places/${row.place_id}/images/${row.id}`,
  };
}

export function listPlaceImages(tripId: string | number, placeId: string | number): PlaceImage[] {
  const rows = db.prepare(`
    SELECT id, trip_id, place_id, filename, original_name, file_size, mime_type, caption, taken_at, created_at
    FROM photos
    WHERE trip_id = ? AND place_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(tripId, placeId) as Omit<PlaceImage, 'url'>[];
  return rows.map(formatImage);
}

export function createPlaceImage(
  tripId: string | number,
  placeId: string | number,
  file: Express.Multer.File,
): PlaceImage {
  const result = db.prepare(`
    INSERT INTO photos (trip_id, place_id, filename, original_name, file_size, mime_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(tripId, placeId, file.filename, file.originalname, file.size, file.mimetype);

  const row = db.prepare(`
    SELECT id, trip_id, place_id, filename, original_name, file_size, mime_type, caption, taken_at, created_at
    FROM photos
    WHERE id = ?
  `).get(result.lastInsertRowid) as Omit<PlaceImage, 'url'>;
  return formatImage(row);
}

export function getPlaceImage(
  tripId: string | number,
  placeId: string | number,
  imageId: string | number,
): PlaceImage | null {
  const row = db.prepare(`
    SELECT id, trip_id, place_id, filename, original_name, file_size, mime_type, caption, taken_at, created_at
    FROM photos
    WHERE id = ? AND trip_id = ? AND place_id = ?
  `).get(imageId, tripId, placeId) as Omit<PlaceImage, 'url'> | undefined;
  return row ? formatImage(row) : null;
}

export function resolvePlaceImagePath(filename: string): { resolved: string; safe: boolean } {
  const safeName = path.basename(filename);
  const resolved = path.resolve(path.join(placeImagesDir, safeName));
  return { resolved, safe: resolved.startsWith(path.resolve(placeImagesDir)) };
}

export async function deletePlaceImage(image: PlaceImage): Promise<void> {
  const { resolved, safe } = resolvePlaceImagePath(image.filename);
  if (!safe) throw new Error('Unsafe image path');
  await fs.promises.rm(resolved, { force: true });
  db.prepare('DELETE FROM photos WHERE id = ?').run(image.id);
}

export async function deleteImagesForPlace(tripId: string | number, placeId: string | number): Promise<void> {
  const images = listPlaceImages(tripId, placeId);
  for (const image of images) {
    await deletePlaceImage(image);
  }
}

export function deleteImagesForPlaceSync(tripId: string | number, placeId: string | number): void {
  const images = listPlaceImages(tripId, placeId);
  for (const image of images) {
    const { resolved, safe } = resolvePlaceImagePath(image.filename);
    if (!safe) continue;
    try {
      fs.rmSync(resolved, { force: true });
      db.prepare('DELETE FROM photos WHERE id = ?').run(image.id);
    } catch (err) {
      console.error(`[place-images] Failed to delete ${image.filename}:`, err);
    }
  }
}
