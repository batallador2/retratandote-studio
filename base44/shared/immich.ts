// Helpers compartidos para hablar con el servidor Immich (VPS).
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

export function immichCfg() {
  const url = (Deno.env.get('IMMICH_SERVER_URL') || '').replace(/\/$/, '');
  if (!url) throw new Error('Immich no configurado');
  return { url, headers: { 'x-api-key': Deno.env.get('IMMICH_API_KEY') || '' } };
}

export async function createAlbum(name) {
  const { url, headers } = immichCfg();
  const res = await fetch(`${url}/api/albums`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ albumName: name }),
  });
  if (!res.ok) throw new Error(`Immich error creando álbum: ${res.status} ${await res.text()}`);
  return (await res.json()).id;
}

export async function listAlbumAssets(albumId) {
  const { url, headers } = immichCfg();
  const res = await fetch(`${url}/api/albums/${albumId}`, { headers });
  if (!res.ok) throw new Error(`Immich error leyendo álbum: ${res.status}`);
  const album = await res.json();
  return album.assets || [];
}

export async function uploadToAlbum(albumId, filename, bytes, contentType) {
  const { url, headers } = immichCfg();
  const now = new Date().toISOString();
  const form = new FormData();
  form.append('assetData', new Blob([bytes], { type: contentType || 'image/jpeg' }), filename);
  form.append('deviceAssetId', `base44-${crypto.randomUUID()}`);
  form.append('deviceId', 'base44');
  form.append('fileCreatedAt', now);
  form.append('fileModifiedAt', now);
  const up = await fetch(`${url}/api/assets`, { method: 'POST', headers, body: form });
  if (!up.ok) throw new Error(`Immich error subiendo: ${up.status} ${await up.text()}`);
  const asset = await up.json();
  const add = await fetch(`${url}/api/albums/${albumId}/assets`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: [asset.id] }),
  });
  if (!add.ok) throw new Error(`Immich error añadiendo al álbum: ${add.status}`);
  return asset.id;
}

export async function getThumbnailB64(assetId, size) {
  const { url, headers } = immichCfg();
  const s = size === 'preview' ? 'preview' : 'thumbnail';
  const r = await fetch(`${url}/api/assets/${assetId}/thumbnail?size=${s}`, { headers });
  if (!r.ok) return null;
  const buf = new Uint8Array(await r.arrayBuffer());
  return `data:image/jpeg;base64,${encodeBase64(buf)}`;
}

export async function deleteAssets(ids) {
  const { url, headers } = immichCfg();
  const res = await fetch(`${url}/api/assets`, {
    method: 'DELETE',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, force: true }),
  });
  if (!res.ok) throw new Error(`Immich error borrando: ${res.status}`);
}

export async function deleteAlbum(albumId) {
  const { url, headers } = immichCfg();
  await fetch(`${url}/api/albums/${albumId}`, { method: 'DELETE', headers });
}

// Enlace compartido de Immich: su "key" permite servir miniaturas y vídeo
// directamente al navegador sin exponer la API key del servidor.
export async function createShareKey(albumId) {
  const { url, headers } = immichCfg();
  const res = await fetch(`${url}/api/shared-links`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'ALBUM', albumId, allowDownload: true, allowUpload: false, showMetadata: false }),
  });
  if (!res.ok) throw new Error(`Immich error creando enlace: ${res.status} ${await res.text()}`);
  return (await res.json()).key;
}

// URLs directas (autenticadas con la key del enlace compartido) para el frontend.
export function assetUrls(baseUrl, asset, key) {
  return {
    id: asset.id,
    type: asset.type,
    thumb: `${baseUrl}/api/assets/${asset.id}/thumbnail?size=thumbnail&key=${key}`,
    preview: `${baseUrl}/api/assets/${asset.id}/thumbnail?size=preview&key=${key}`,
    video: asset.type === 'VIDEO' ? `${baseUrl}/api/assets/${asset.id}/video/playback?key=${key}` : null,
  };
}