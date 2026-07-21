import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { decodeBase64 } from 'jsr:@std/encoding@1/base64';
import { UUID_V4_RE } from '../../shared/security.ts';
import { immichCfg, createAlbum, listAlbumAssets, uploadToAlbum, deleteAssets, createShareKey, assetUrls } from '../../shared/immich.ts';

const PHASES = ['avance', 'entrega'];
const PHASE_LABELS = { avance: 'Avance', entrega: 'Entrega' };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, wedding_id, phase } = body;
    const w = await base44.asServiceRole.entities.Wedding.get(wedding_id);
    if (!w) return Response.json({ error: 'Not found' }, { status: 404 });

    // Crea los álbumes de Avance y Entrega en Immich + sus enlaces compartidos.
    if (action === 'setup') {
      const updates = {};
      for (const p of PHASES) {
        let albumId = w[`immich_${p}_album_id`];
        if (!albumId) {
          albumId = await createAlbum(`Boda ${w.couple_names} — ${PHASE_LABELS[p]}`);
          updates[`immich_${p}_album_id`] = albumId;
        }
        if (!w[`immich_${p}_share_key`]) {
          updates[`immich_${p}_share_key`] = await createShareKey(albumId);
        }
      }
      if (Object.keys(updates).length) {
        await base44.asServiceRole.entities.Wedding.update(w.id, updates);
      }
      return Response.json({ ok: true });
    }

    if (!PHASES.includes(phase)) return Response.json({ error: 'Invalid phase' }, { status: 400 });
    const albumId = w[`immich_${phase}_album_id`];
    const key = w[`immich_${phase}_share_key`];
    if (!albumId || !key) return Response.json({ error: 'Galería no creada todavía' }, { status: 400 });

    if (action === 'upload') {
      const filename = (body.filename || 'foto.jpg').replace(/[^\w.\- ]/g, '_');
      const bytes = decodeBase64(body.data || '');
      if (!bytes.length || bytes.length > 30_000_000) {
        return Response.json({ error: 'Archivo no válido (máx. 30MB)' }, { status: 400 });
      }
      const assetId = await uploadToAlbum(albumId, filename, bytes, body.content_type || 'image/jpeg');
      return Response.json({ ok: true, asset_id: assetId });
    }

    if (action === 'remove') {
      const assetId = body.asset_id || '';
      if (!UUID_V4_RE.test(assetId)) return Response.json({ error: 'Invalid asset' }, { status: 400 });
      await deleteAssets([assetId]);
      const picks = await base44.asServiceRole.entities.AlbumSelection.filter({ wedding_id: w.id, asset_id: assetId });
      if (picks[0]) await base44.asServiceRole.entities.AlbumSelection.delete(picks[0].id);
      return Response.json({ ok: true });
    }

    // Acción por defecto: listar los assets del álbum de la fase.
    const { url } = immichCfg();
    const assets = (await listAlbumAssets(albumId))
      .sort((a, b) => new Date(a.fileCreatedAt) - new Date(b.fileCreatedAt))
      .map((a) => assetUrls(url, a, key));
    return Response.json({ assets });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});