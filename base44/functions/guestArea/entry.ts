import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { decodeBase64 } from 'jsr:@std/encoding@1/base64';
import { checkRateLimit, UUID_V4_RE } from '../../shared/security.ts';
import { createAlbum, listAlbumAssets, uploadToAlbum, getThumbnailB64 } from '../../shared/immich.ts';

Deno.serve(async (req) => {
  try {
    // Límite alto porque los invitados suben varias fotos seguidas.
    if (!checkRateLimit(req, 60)) {
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, token } = body;

    // --- Acción de administración: activar el área de invitados de una boda ---
    if (action === 'setup') {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const w = await base44.asServiceRole.entities.Wedding.get(body.wedding_id);
      if (!w) return Response.json({ error: 'Not found' }, { status: 404 });

      let albumId = w.immich_album_id;
      if (!albumId) {
        albumId = await createAlbum(`Boda ${w.couple_names} — Invitados`);
      }
      const guestToken = w.guest_token || crypto.randomUUID();
      await base44.asServiceRole.entities.Wedding.update(w.id, {
        immich_album_id: albumId,
        guest_token: guestToken,
      });
      return Response.json({ guest_token: guestToken });
    }

    // --- Acciones de invitados: requieren token válido ---
    if (!token || typeof token !== 'string' || !UUID_V4_RE.test(token)) {
      return Response.json({ error: 'Invalid token' }, { status: 404 });
    }
    const results = await base44.asServiceRole.entities.Wedding.filter({ guest_token: token });
    const w = results[0];
    if (!w || !w.immich_album_id) return Response.json({ error: 'Not found' }, { status: 404 });

    if (action === 'upload') {
      const filename = (body.filename || 'foto.jpg').replace(/[^\w.\- ]/g, '_');
      const bytes = decodeBase64(body.data || '');
      if (!bytes.length || bytes.length > 15_000_000) {
        return Response.json({ error: 'Archivo no válido (máx. 15MB)' }, { status: 400 });
      }
      const assetId = await uploadToAlbum(w.immich_album_id, filename, bytes, 'image/jpeg');
      return Response.json({ ok: true, asset_id: assetId });
    }

    if (action === 'thumbnail') {
      // Los IDs de asset son UUIDs aleatorios de Immich, no enumerables.
      const assetId = body.asset_id || '';
      if (!UUID_V4_RE.test(assetId)) return Response.json({ error: 'Invalid asset' }, { status: 400 });
      const data = await getThumbnailB64(assetId, body.size);
      if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json({ data });
    }

    // Acción por defecto: listar fotos del álbum
    const assets = (await listAlbumAssets(w.immich_album_id))
      .sort((a, b) => new Date(b.fileCreatedAt) - new Date(a.fileCreatedAt))
      .map((a) => ({ id: a.id }));

    return Response.json({
      wedding: { couple_names: w.couple_names, event_date: w.event_date, location: w.location },
      assets,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});