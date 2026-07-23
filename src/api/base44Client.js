import { supabase } from './supabaseClient';

// Adapter to prevent breaking changes during migration from Base44 to Supabase
// This allows the app to compile and run while slowly migrating all 85+ files.
export const base44 = {
  auth: {
    me: async () => {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user || null;
    },
    loginViaEmailPassword: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    register: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    loginWithProvider: async (provider, redirectTo) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + (redirectTo || '/') }
      });
      if (error) throw error;
      return data;
    },
    verifyOtp: async ({ email, otpCode }) => {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' });
      if (error) throw error;
      return data;
    },
    resendOtp: async (email) => {
      const { data, error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      return data;
    },
    setToken: (token) => {
      // Supabase manages sessions automatically
    },
    logout: async () => {
      await supabase.auth.signOut();
      window.location.href = '/login';
    },
    redirectToLogin: () => {
      window.location.href = '/login';
    }
  },
  entities: new Proxy({}, {
    get: function(target, entityName) {
      // Convert entity name to table name (e.g., Wedding -> weddings, GalleryPhoto -> gallery_photos)
      let tableName = entityName.replace(/([A-Z])/g, '_$1').toLowerCase().substring(1) + 's';
      if (tableName === 'gallery_photo_s') tableName = 'gallery_photos';
      if (tableName === 'calendar_block_s') tableName = 'calendar_blocks';
      if (tableName === 'wedding_extra_s') tableName = 'wedding_extras';
      if (tableName === 'app_config_s') tableName = 'app_configs';
      if (tableName === 'extra_service_s') tableName = 'extra_services';
      if (tableName === 'client_message_s') tableName = 'client_messages';
      
      const normalizeItem = (item) => {
        if (!item) return item;
        return {
          ...item,
          url: item.url || item.file_url || item.file_uri || '',
          file_url: item.file_url || item.url || item.file_uri || '',
          couple_names: item.couple_names || item.client_name || item.title || '',
          event_date: item.event_date || item.wedding_date || '',
          created_date: item.created_date || item.created_at || '',
          concept: item.concept || item.name || '',
          name: item.name || item.concept || ''
        };
      };

      return {
        get: async (id) => {
          const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
          if (error) console.error(`Error getting ${tableName}:`, error);
          return normalizeItem(data);
        },
        list: async (orderBy, limit) => {
          let query = supabase.from(tableName).select('*');
          if (orderBy) {
            let col = orderBy.replace('-', '');
            if (col === 'created_date') col = 'created_at';
            query = query.order(col, { ascending: !orderBy.startsWith('-') });
          }
          if (limit) query = query.limit(limit);
          const { data, error } = await query;
          if (error) {
            console.error(`Error listing ${tableName}:`, error);
            const retry = await supabase.from(tableName).select('*');
            return (retry.data || []).map(normalizeItem);
          }
          return (data || []).map(normalizeItem);
        },
        filter: async (criteria, orderBy) => {
          let query = supabase.from(tableName).select('*');
          Object.keys(criteria).forEach((key) => {
            query = query.eq(key, criteria[key]);
          });
          if (orderBy) {
            let col = orderBy.replace('-', '');
            if (col === 'created_date') col = 'created_at';
            query = query.order(col, { ascending: !orderBy.startsWith('-') });
          }
          const { data, error } = await query;
          if (error) {
            console.error(`Error filtering ${tableName}:`, error);
            return [];
          }
          return (data || []).map(normalizeItem);
        },
        create: async (payload) => {
          const cleanPayload = { ...payload };
          if (tableName === 'weddings') {
            cleanPayload.portal_token = cleanPayload.portal_token || ('portal_' + Math.random().toString(36).substring(2, 9));
            cleanPayload.guest_token = cleanPayload.guest_token || ('guest_' + Math.random().toString(36).substring(2, 9));
            cleanPayload.client_name = cleanPayload.client_name || cleanPayload.couple_names || cleanPayload.name || 'Cliente';
            cleanPayload.client_email = cleanPayload.client_email || cleanPayload.email || '';
            cleanPayload.title = cleanPayload.title || `Boda de ${cleanPayload.couple_names}`;
            delete cleanPayload.email;
            delete cleanPayload.phone;
          }
          if (tableName === 'wedding_extras') {
            cleanPayload.name = cleanPayload.name || cleanPayload.concept || 'Extra';
            cleanPayload.concept = cleanPayload.concept || cleanPayload.name || 'Extra';
          }
          const { data, error } = await supabase.from(tableName).insert(cleanPayload).select().single();
          if (error) console.error(`Error creating ${tableName}:`, error);
          return normalizeItem(data);
        },
        bulkCreate: async (items) => {
          const { data, error } = await supabase.from(tableName).insert(items).select();
          if (error) console.error(`Error bulk creating ${tableName}:`, error);
          return (data || []).map(normalizeItem);
        },
        update: async (id, payload) => {
          const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
          if (error) console.error(`Error updating ${tableName}:`, error);
          return normalizeItem(data);
        },
        delete: async (id) => {
          const { error } = await supabase.from(tableName).delete().eq('id', id);
          if (error) console.error(`Error deleting ${tableName}:`, error);
        },
        filter: async (filters) => {
          let query = supabase.from(tableName).select('*');
          Object.keys(filters).forEach(key => {
            let col = key;
            if (col === 'created_date') col = 'created_at';
            query = query.eq(col, filters[key]);
          });
          const { data, error } = await query;
          if (error) console.error(`Error filtering ${tableName}:`, error);
          return (data || []).map(normalizeItem);
        }
      };
    }
  }),
  functions: {
    invoke: async (funcName, args) => {
      const { token, action, content, filename, data: base64Data } = args || {};

      if (funcName === "clientPortal") {
        const { data: w, error: wErr } = await supabase
          .from('weddings')
          .select('*')
          .eq('portal_token', token)
          .maybeSingle();

        if (wErr || !w) {
          return { data: { wedding: null } };
        }

        const normalize = (item) => item ? {
          ...item,
          couple_names: item.couple_names || item.client_name || item.title || '',
          event_date: item.event_date || item.wedding_date || '',
          created_date: item.created_date || item.created_at || ''
        } : null;

        const wedding = normalize(w);

        if (action === "saveBilling" && content) {
          const { billing_name, billing_nif, billing_address } = content;
          await supabase.from('weddings').update({
            billing_name,
            billing_nif,
            billing_address
          }).eq('id', wedding.id);
          wedding.billing_name = billing_name;
          wedding.billing_nif = billing_nif;
          wedding.billing_address = billing_address;
        }

        if (action === "sendMessage" && content) {
          await supabase.from('client_messages').insert({
            wedding_id: wedding.id,
            sender: 'client',
            content: content.trim()
          });
        }

        if (action === "downloadDocument" && content) {
          const { data: doc } = await supabase.from('documents').select('*').eq('id', content).maybeSingle();
          return {
            data: {
              signed_url: doc?.file_uri || ''
            }
          };
        }

        if (action === "toggleAlbumPick" && content) {
          const { data: existing } = await supabase.from('album_selections').select('*').eq('wedding_id', wedding.id).eq('asset_id', content).maybeSingle();
          if (existing) {
            await supabase.from('album_selections').delete().eq('id', existing.id);
          } else {
            await supabase.from('album_selections').insert({ wedding_id: wedding.id, asset_id: content });
          }
          return { data: { success: true } };
        }

        const [{ data: payments }, { data: messages }, { data: photos }, { data: documents }, { data: extras }, { data: picks }] = await Promise.all([
          supabase.from('payments').select('*').eq('wedding_id', wedding.id),
          supabase.from('client_messages').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: true }),
          supabase.from('gallery_photos').select('*').eq('wedding_id', wedding.id),
          supabase.from('documents').select('*').eq('wedding_id', wedding.id).eq('visible_to_client', true),
          supabase.from('wedding_extras').select('*').eq('wedding_id', wedding.id),
          supabase.from('album_selections').select('*').eq('wedding_id', wedding.id)
        ]);

        const avance = (photos || [])
          .filter(p => p.section === 'avance')
          .map(p => ({ id: p.id, thumb: p.url || p.file_url, preview: p.url || p.file_url, type: (p.filename || '').match(/\.(mp4|mov|avi|webm)$/i) ? 'VIDEO' : 'IMAGE' }));

        const entrega = (photos || [])
          .filter(p => p.section === 'entrega' || p.section === 'official' || !p.section)
          .map(p => ({ id: p.id, thumb: p.url || p.file_url, preview: p.url || p.file_url, type: (p.filename || '').match(/\.(mp4|mov|avi|webm)$/i) ? 'VIDEO' : 'IMAGE' }));

        const delivery = {
          avance,
          entrega,
          album_picks: (picks || []).map(pk => pk.asset_id)
        };

        return {
          data: {
            wedding,
            payments: (payments || []).map(normalize),
            messages: (messages || []).map(normalize),
            photos: (photos || []).map(normalize),
            documents: (documents || []).map(normalize),
            extras: (extras || []).map(normalize),
            delivery
          }
        };
      }

      if (funcName === "guestArea") {
        const { data: w, error: wErr } = await supabase
          .from('weddings')
          .select('*')
          .eq('guest_token', token)
          .maybeSingle();

        if (wErr || !w) {
          return { data: { wedding: null } };
        }

        const normalize = (item) => item ? {
          ...item,
          url: item.url || item.file_url || item.file_uri || '',
          file_url: item.file_url || item.url || item.file_uri || '',
          couple_names: item.couple_names || item.client_name || item.title || '',
          event_date: item.event_date || item.wedding_date || '',
          created_date: item.created_date || item.created_at || ''
        } : null;

        const wedding = normalize(w);

        if (action === "upload" && base64Data) {
          const file_url = `data:image/jpeg;base64,${base64Data}`;
          await supabase.from('gallery_photos').insert({
            wedding_id: wedding.id,
            url: file_url,
            file_url: file_url,
            filename: filename || 'guest_photo.jpg',
            section: 'guest'
          });
        }

        if (action === "thumbnail" || action === "asset") {
          const assetId = args.asset_id || args.id;
          const { data: photo } = await supabase.from('gallery_photos').select('*').eq('id', assetId).maybeSingle();
          return {
            data: {
              data: photo?.url || photo?.file_url || photo?.file_uri || ''
            }
          };
        }

        const { data: assets } = await supabase.from('gallery_photos').select('*').eq('wedding_id', wedding.id);

        return {
          data: {
            wedding,
            assets: (assets || []).map(normalize)
          }
        };
      }

      if (funcName === "deliveryGallery") {
        const { action, wedding_id, phase, filename, data, asset_id, content_type } = args;

        if (action === "setup") {
          await supabase.from('weddings').update({
            immich_avance_album_id: `avance_${wedding_id}`,
            immich_entrega_album_id: `entrega_${wedding_id}`
          }).eq('id', wedding_id);
          return { data: { success: true } };
        }

        if (action === "upload" && data) {
          const mime = content_type || 'image/jpeg';
          const file_url = `data:${mime};base64,${data}`;
          await supabase.from('gallery_photos').insert({
            wedding_id,
            url: file_url,
            file_url: file_url,
            filename: filename || 'file',
            section: phase || 'avance'
          });
          return { data: { success: true } };
        }

        if (action === "remove" && asset_id) {
          await supabase.from('gallery_photos').delete().eq('id', asset_id);
          return { data: { success: true } };
        }

        if (action === "list") {
          const { data: photos } = await supabase.from('gallery_photos').select('*').eq('wedding_id', wedding_id);
          const filtered = (photos || []).filter(p => p.section === phase || p.section === 'official');
          const assets = filtered.map(p => ({
            id: p.id,
            thumb: p.url || p.file_url,
            preview: p.url || p.file_url,
            type: (p.filename || '').match(/\.(mp4|mov|avi|webm)$/i) ? 'VIDEO' : 'IMAGE'
          }));
          return { data: { assets } };
        }

        return { data: { assets: [] } };
      }

      if (funcName === "archiveWedding") {
        const { wedding_id } = args;
        const archived_date = new Date().toISOString().split("T")[0];
        if (wedding_id) {
          await supabase.from('weddings').update({
            archived: true,
            archived_date
          }).eq('id', wedding_id);
        }
        return {
          data: {
            done: true,
            remaining: 0
          }
        };
      }

      return { data: { success: true } };
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        if (!file) return { file_url: '', url: '' };
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ file_url: reader.result, url: reader.result });
          };
          reader.readAsDataURL(file);
        });
      },
      UploadPrivateFile: async ({ file }) => {
        if (!file) return { file_uri: '' };
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ file_uri: reader.result });
          };
          reader.readAsDataURL(file);
        });
      },
      CreateFileSignedUrl: async ({ file_uri }) => {
        return { signed_url: file_uri || '' };
      }
    }
  }
};
