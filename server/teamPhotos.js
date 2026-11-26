import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEAM_PHOTO_MAX_BYTES = 3 * 1024 * 1024;
export const TEAM_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'job-by-blaise-team';
const localDirectory = () => path.join(process.env.JBB_DB_DIR || fileURLToPath(new URL('../database/', import.meta.url)), 'team-photos');
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

export async function storeTeamPhoto(input, contentType) {
  if (!TEAM_PHOTO_TYPES.includes(contentType)) throw fail('Choisissez une image JPEG, PNG ou WebP.', 415);
  if (!Buffer.isBuffer(input) || !input.length || input.length > TEAM_PHOTO_MAX_BYTES) throw fail('La photo doit peser entre 1 octet et 3 Mo.');
  let output;
  try {
    const image = sharp(input, { limitInputPixels: 20000000, failOn: 'warning' });
    const meta = await image.metadata();
    const format = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' }[contentType];
    if (meta.format !== format || (meta.pages || 1) > 1) throw new Error('Format non conforme ou animé');
    // Réencode l’image, retire les métadonnées EXIF et corrige son orientation.
    output = await image.rotate().resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch {
    throw fail('Image illisible, animée ou trop grande (20 millions de pixels maximum). Utilisez une photo JPEG, PNG ou WebP valide.');
  }
  const filename = `${randomUUID()}.webp`;
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_KEY;
  if (url && key) {
    let response;
    try {
      response = await fetch(`${url}/storage/v1/object/${BUCKET}/${filename}`, {
        method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/webp', 'x-upsert': 'false', 'cache-control': '31536000' },
        body: output, signal: AbortSignal.timeout(20000),
      });
    } catch { throw fail('Stockage des photos indisponible. Réessayez dans un instant.', 502); }
    if (!response.ok) throw fail('Impossible d’enregistrer la photo. Vérifiez le stockage des photos de l’équipe.', 502);
    return `${url}/storage/v1/object/public/${BUCKET}/${filename}`;
  }
  if (process.env.VERCEL_ENV === 'production') throw fail('Le stockage permanent des photos doit être configuré.', 503);
  await fs.mkdir(localDirectory(), { recursive: true });
  await fs.writeFile(path.join(localDirectory(), filename), output, { flag: 'wx' });
  return `/api/team/photos/${filename}`;
}

export async function readLocalTeamPhoto(filename) {
  if (!/^[a-f0-9-]{36}\.webp$/.test(filename) || process.env.SUPABASE_URL) return null;
  try { return await fs.readFile(path.join(localDirectory(), filename)); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
