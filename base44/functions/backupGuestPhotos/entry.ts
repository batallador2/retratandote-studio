import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { ensureWeddingFolders } from '../../shared/drive.ts';
import { weddingAlbums, syncAlbumToDrive } from '../../shared/backup.ts';

// Copia incremental de fotos (Immich → Google Drive) para bodas activas:
// fotos de invitados y galerías de avance/entrega, cada álbum en su subcarpeta.
// También programa la fecha de archivo definitivo al cerrar una boda.
// Pensada para ejecutarse periódicamente desde un workflow.
const UPLOAD_BUDGET = 10; // fotos por ejecución para no agotar el tiempo

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;

    const configs = await svc.entities.AppConfig.list('-created_date', 1);
    const delayDays = configs[0]?.archive_delay_days ?? 60;

    const all = await svc.entities.Wedding.list('-created_date', 200);
    const weddings = all.filter((w) => !w.archived);
    const today = new Date().toISOString().slice(0, 10);

    // 1. Programar archivo definitivo para bodas entregadas/cerradas sin fecha.
    for (const w of weddings) {
      if (['galeria_entregada', 'cerrado'].includes(w.status) && !w.archive_due_date) {
        const due = new Date();
        due.setDate(due.getDate() + delayDays);
        await svc.entities.Wedding.update(w.id, { archive_due_date: due.toISOString().slice(0, 10) });
      }
    }

    // 2. Copia incremental de fotos nuevas de todos los álbumes de cada boda.
    let budget = UPLOAD_BUDGET;
    let gAuth = null;
    const summary = [];

    for (const w of weddings) {
      if (budget <= 0) break;
      const albums = weddingAlbums(w);
      if (albums.length === 0) continue;

      const backed = await svc.entities.BackupItem.filter({ wedding_id: w.id }, '-created_date', 1000);
      const backedIds = new Set(backed.map((b) => b.asset_id));
      const startCount = backedIds.size;

      let weddingFolderId = null;
      const getDrive = async () => {
        if (!gAuth) {
          const { accessToken } = await svc.connectors.getConnection('googledrive');
          gAuth = { Authorization: `Bearer ${accessToken}` };
        }
        if (!weddingFolderId) {
          weddingFolderId = (await ensureWeddingFolders(w, svc, gAuth)).folderId;
        }
        return { gAuth, parentId: weddingFolderId };
      };

      let uploaded = 0;
      let remaining = 0;
      for (const { albumId, folder } of albums) {
        const r = await syncAlbumToDrive(svc, w.id, albumId, folder, getDrive, backedIds, budget - uploaded);
        uploaded += r.uploaded;
        remaining += r.remaining;
      }
      budget -= uploaded;

      if (uploaded > 0) {
        await svc.entities.Wedding.update(w.id, {
          last_backup_date: today,
          backup_count: startCount + uploaded,
        });
        summary.push({ wedding: w.couple_names, uploaded, pending: remaining });
      }
    }

    return Response.json({ ok: true, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});