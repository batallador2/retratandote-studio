// Utilidades compartidas de Google Drive para copia y archivado de bodas.
const DRIVE = 'https://www.googleapis.com/drive/v3';

export async function ensureFolder(name, parentId, authHeader) {
  const safeName = name.replace(/'/g, "\\'");
  const q = encodeURIComponent(
    `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
  );
  const search = await fetch(`${DRIVE}/files?q=${q}&fields=files(id)`, { headers: authHeader });
  if (!search.ok) throw new Error(`Drive error buscando carpeta: ${search.status} ${await search.text()}`);
  const found = (await search.json()).files;
  if (found && found.length > 0) return found[0].id;

  const create = await fetch(`${DRIVE}/files?fields=id`, {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
  });
  if (!create.ok) throw new Error(`Drive error creando carpeta: ${create.status} ${await create.text()}`);
  return (await create.json()).id;
}

// Sube un archivo (buffer) a una carpeta de Drive. Devuelve el id del archivo.
export async function uploadToDrive(name, folderId, buf, authHeader) {
  const init = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parents: [folderId] }),
  });
  if (!init.ok) throw new Error(`Drive error iniciando subida: ${init.status} ${await init.text()}`);
  const uploadUrl = init.headers.get('location');
  const up = await fetch(uploadUrl, { method: 'PUT', body: buf });
  if (!up.ok) throw new Error(`Drive error subiendo archivo: ${up.status} ${await up.text()}`);
  return (await up.json()).id;
}

// Garantiza la estructura: Archivo Retratándote / Año / Fecha · Pareja / {Fotos invitados, Documentos}
// Persiste archive_drive_folder_id en la boda si es nuevo. `svc` = base44.asServiceRole.
export async function ensureWeddingFolders(w, svc, authHeader) {
  let folderId = w.archive_drive_folder_id;
  if (!folderId) {
    const rootId = await ensureFolder('Archivo Retratándote', 'root', authHeader);
    const year = (w.event_date || '').slice(0, 4) || 'Sin fecha';
    const yearId = await ensureFolder(year, rootId, authHeader);
    const weddingName = `${w.event_date || 'fecha-pendiente'} · ${w.couple_names}`;
    folderId = await ensureFolder(weddingName, yearId, authHeader);
    await svc.entities.Wedding.update(w.id, { archive_drive_folder_id: folderId });
  }
  const photosId = await ensureFolder('Fotos invitados', folderId, authHeader);
  const docsId = await ensureFolder('Documentos', folderId, authHeader);
  return { folderId, photosId, docsId, folderUrl: `https://drive.google.com/drive/folders/${folderId}` };
}