import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { checkRateLimit, UUID_V4_RE } from '../../shared/security.ts';
import { immichCfg, listAlbumAssets, assetUrls } from '../../shared/immich.ts';

Deno.serve(async (req) => {
  try {
    if (!checkRateLimit(req, 15)) {
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    }

    const base44 = createClientFromRequest(req);
    const { token, action, content } = await req.json();

    if (!token || typeof token !== 'string' || !UUID_V4_RE.test(token)) {
      return Response.json({ error: 'Invalid token' }, { status: 404 });
    }

    const results = await base44.asServiceRole.entities.Wedding.filter({ portal_token: token });
    const w = results[0];
    if (!w) return Response.json({ error: 'Not found' }, { status: 404 });

    if (action === 'downloadDocument') {
      const docs = await base44.asServiceRole.entities.Document.filter({ id: content, wedding_id: w.id, visible_to_client: true });
      const doc = docs[0];
      if (!doc) return Response.json({ error: 'Not found' }, { status: 404 });
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri, expires_in: 300 });
      return Response.json({ signed_url });
    }

    if (action === 'saveBilling') {
      const clean = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 300) : '');
      const billing_name = clean(content?.billing_name);
      const billing_nif = clean(content?.billing_nif);
      const billing_address = clean(content?.billing_address);
      if (!billing_name || !billing_nif || !billing_address) {
        return Response.json({ error: 'Missing fields' }, { status: 400 });
      }
      await base44.asServiceRole.entities.Wedding.update(w.id, { billing_name, billing_nif, billing_address });
      w.billing_name = billing_name;
      w.billing_nif = billing_nif;
      w.billing_address = billing_address;
    }

    if (action === 'toggleAlbumPick') {
      const assetId = String(content || '');
      if (!UUID_V4_RE.test(assetId)) return Response.json({ error: 'Invalid asset' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.AlbumSelection.filter({ wedding_id: w.id, asset_id: assetId });
      if (existing[0]) await base44.asServiceRole.entities.AlbumSelection.delete(existing[0].id);
      else await base44.asServiceRole.entities.AlbumSelection.create({ wedding_id: w.id, asset_id: assetId });
      return Response.json({ ok: true });
    }

    if (action === 'sendMessage') {
      const text = (content || '').trim();
      if (!text || text.length > 2000) {
        return Response.json({ error: 'Invalid message' }, { status: 400 });
      }
      await base44.asServiceRole.entities.ClientMessage.create({
        wedding_id: w.id,
        sender: 'cliente',
        content: text,
      });
    }

    const [payments, messages, photos, documents, extras] = await Promise.all([
      base44.asServiceRole.entities.Payment.filter({ wedding_id: w.id }, 'due_date'),
      base44.asServiceRole.entities.ClientMessage.filter({ wedding_id: w.id }, 'created_date'),
      base44.asServiceRole.entities.GalleryPhoto.filter({ wedding_id: w.id }, 'order'),
      base44.asServiceRole.entities.Document.filter({ wedding_id: w.id, visible_to_client: true }, 'created_date'),
      base44.asServiceRole.entities.WeddingExtra.filter({ wedding_id: w.id }, 'created_date'),
    ]);

    // Only expose fields the couple needs — no email/phone/notes/tokens.
    const wedding = {
      id: w.id,
      couple_names: w.couple_names,
      event_date: w.event_date,
      location: w.location,
      package_name: w.package_name,
      total_price: w.total_price,
      extras: w.extras,
      status: w.status,
      gallery_url: w.gallery_url,
      contract_signed: w.contract_signed,
      billing_name: w.billing_name,
      billing_nif: w.billing_nif,
      billing_address: w.billing_address,
    };
    const safePayments = payments.map((p) => ({
      id: p.id, label: p.label, amount: p.amount, due_date: p.due_date, paid: p.paid, paid_date: p.paid_date,
    }));
    const safeMessages = messages.map((m) => ({
      id: m.id, sender: m.sender, content: m.content, created_date: m.created_date,
    }));

    const safePhotos = photos.map((p) => ({
      id: p.id, url: p.url, caption: p.caption, order: p.order, is_cover: p.is_cover,
    }));
    const safeDocuments = documents.map((d) => ({
      id: d.id, name: d.name, doc_type: d.doc_type, created_date: d.created_date,
    }));
    const safeExtras = extras.map((x) => ({ id: x.id, concept: x.concept, description: x.description, amount: x.amount }));

    // Galerías de entrega servidas desde Immich (avance / entrega / selección de álbum).
    let delivery = null;
    try {
      if (w.immich_avance_album_id || w.immich_entrega_album_id) {
        const { url } = immichCfg();
        delivery = { avance: [], entrega: [], album_picks: [] };
        for (const p of ['avance', 'entrega']) {
          const albumId = w[`immich_${p}_album_id`];
          const key = w[`immich_${p}_share_key`];
          if (!albumId || !key) continue;
          const assets = await listAlbumAssets(albumId);
          delivery[p] = assets
            .sort((a, b) => new Date(a.fileCreatedAt) - new Date(b.fileCreatedAt))
            .map((a) => assetUrls(url, a, key));
        }
        const picks = await base44.asServiceRole.entities.AlbumSelection.filter({ wedding_id: w.id });
        delivery.album_picks = picks.map((s) => s.asset_id);
      }
    } catch (_e) {
      delivery = null; // Si Immich no responde, el portal sigue funcionando.
    }

    return Response.json({ wedding, payments: safePayments, messages: safeMessages, photos: safePhotos, documents: safeDocuments, extras: safeExtras, delivery });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});