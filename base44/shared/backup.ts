// Copia de álbumes de Immich a Google Drive, compartida entre backupGuestPhotos y archiveWedding.
import { immichCfg, listAlbumAssets } from './immich.ts';
import { ensureFolder, uploadToDrive } from './drive.ts';

// Álbumes de una boda a copiar, cada uno con su subcarpeta separada en Drive.
export function weddingAlbums(w) {
  return [
    { albumId: w.immich_album_id, folder: 'Fotos invitados' },
    { albumId: w.immich_avance_album_id, folder: 'Galería Avance' },
    { albumId: w.immich_entrega_album_id, folder: 'Galería Entrega' },
  ].filter((a) => a.albumId);
}

// Copia hasta `limit` assets pendientes de un álbum a su subcarpeta de Drive.
// `getDrive` se invoca solo si hay algo pendiente y devuelve { gAuth, parentId }.
// Registra cada copia en BackupItem y añade el id a `backedIds`.
export async function syncAlbumToDrive(svc, weddingId, albumId, folderName, getDrive, backedIds, limit) {
  if (limit <= 0) return { uploaded: 0, remaining: 0 };
  const assets = await listAlbumAssets(albumId).catch(() => []);
  const pending = assets.filter((a) => !backedIds.has(a.id));
  if (pending.length === 0) return { uploaded: 0, remaining: 0 };

  const { url, headers } = immichCfg();
  const { gAuth, parentId } = await getDrive();
  const folderId = await ensureFolder(folderName, parentId, gAuth);

  let uploaded = 0;
  for (const a of pending.slice(0, limit)) {
    const orig = await fetch(`${url}/api/assets/${a.id}/original`, { headers });
    if (!orig.ok) continue;
    const buf = await orig.arrayBuffer();
    const name = a.originalFileName || `${a.id}.jpg`;
    const fileId = await uploadToDrive(name, folderId, buf, gAuth);
    await svc.entities.BackupItem.create({ wedding_id: weddingId, asset_id: a.id, drive_file_id: fileId, filename: name });
    backedIds.add(a.id);
    uploaded++;
  }
  return { uploaded, remaining: pending.length - uploaded };
}