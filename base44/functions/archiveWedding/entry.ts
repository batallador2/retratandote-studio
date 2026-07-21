import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { ensureWeddingFolders, uploadToDrive } from '../../shared/drive.ts';
import { listAlbumAssets, deleteAssets, deleteAlbum } from '../../shared/immich.ts';
import { weddingAlbums, syncAlbumToDrive } from '../../shared/backup.ts';

// Archivo definitivo de una boda (con confirmación del fotógrafo):
// 1) copia los documentos a Drive, 2) completa la copia de todos los álbumes
// (invitados, avance y entrega) en sus subcarpetas, 3) verifica y borra los
// álbumes de Immich. Procesa por lotes: el frontend llama hasta done=true.
const BATCH = 4;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const svc = base44.asServiceRole;

    const { wedding_id } = await req.json();
    const w = await svc.entities.Wedding.get(wedding_id);
    if (!w) return Response.json({ error: 'Not found' }, { status: 404 });

    const { accessToken } = await svc.connectors.getConnection('googledrive');
    const gAuth = { Authorization: `Bearer ${accessToken}` };
    const { folderId, docsId, folderUrl } = await ensureWeddingFolders(w, svc, gAuth);

    // 1. Copiar documentos de la boda a Drive (una sola vez).
    if (!w.docs_archived) {
      const docs = await svc.entities.Document.filter({ wedding_id: w.id }, '-created_date', 100);
      for (const d of docs) {
        const { signed_url } = await svc.integrations.Core.CreateFileSignedUrl({ file_uri: d.file_uri });
        const res = await fetch(signed_url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        const uriName = (d.file_uri || '').split('/').pop() || '';
        const ext = uriName.includes('.') ? '.' + uriName.split('.').pop() : '';
        const name = d.name.includes('.') ? d.name : d.name + ext;
        await uploadToDrive(name, docsId, buf, gAuth);
      }
      await svc.entities.Wedding.update(w.id, { docs_archived: true });
    }

    const finalize = async () => {
      await svc.entities.Wedding.update(w.id, {
        archived: true,
        archived_date: new Date().toISOString().slice(0, 10),
        archive_folder_url: folderUrl,
        immich_album_id: '',
        guest_token: '',
        immich_avance_album_id: '',
        immich_avance_share_key: '',
        immich_entrega_album_id: '',
        immich_entrega_share_key: '',
      });
    };

    // Sin álbumes en Immich: nada que mover, solo marcar como archivada.
    const albums = weddingAlbums(w);
    if (albums.length === 0) {
      await finalize();
      return Response.json({ done: true, folder_url: folderUrl, remaining: 0 });
    }

    const backed = await svc.entities.BackupItem.filter({ wedding_id: w.id }, '-created_date', 1000);
    const backedIds = new Set(backed.map((b) => b.asset_id));

    // 2. Completar la copia de cada álbum a su subcarpeta (por lotes).
    let budget = BATCH;
    let archived = 0;
    let remaining = 0;
    for (const { albumId, folder } of albums) {
      const r = await syncAlbumToDrive(svc, w.id, albumId, folder, async () => ({ gAuth, parentId: folderId }), backedIds, budget);
      budget -= r.uploaded;
      archived += r.uploaded;
      remaining += r.remaining;
    }
    if (archived > 0 || remaining > 0) {
      return Response.json({ done: false, archived, remaining, folder_url: folderUrl });
    }

    // 3. Todo copiado y verificado: borrar álbumes de Immich y cerrar.
    for (const { albumId } of albums) {
      const assets = await listAlbumAssets(albumId).catch(() => []);
      if (assets.length > 0) await deleteAssets(assets.map((a) => a.id));
      await deleteAlbum(albumId);
    }
    await svc.entities.BackupItem.deleteMany({ wedding_id: w.id });
    await finalize();
    return Response.json({ done: true, folder_url: folderUrl, remaining: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});