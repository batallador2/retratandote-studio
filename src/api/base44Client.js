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

        const [{ data: payments }, { data: messages }, { data: photos }, { data: documents }, { data: extras }] = await Promise.all([
          supabase.from('payments').select('*').eq('wedding_id', wedding.id),
          supabase.from('client_messages').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: true }),
          supabase.from('gallery_photos').select('*').eq('wedding_id', wedding.id),
          supabase.from('documents').select('*').eq('wedding_id', wedding.id).eq('visible_to_client', true),
          supabase.from('wedding_extras').select('*').eq('wedding_id', wedding.id)
        ]);

        return {
          data: {
            wedding,
            payments: (payments || []).map(normalize),
            messages: (messages || []).map(normalize),
            photos: (photos || []).map(normalize),
            documents: (documents || []).map(normalize),
            extras: (extras || []).map(normalize),
            delivery: null
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
          couple_names: item.couple_names || item.client_name || item.title || '',
          event_date: item.event_date || item.wedding_date || '',
          created_date: item.created_date || item.created_at || ''
        } : null;

        const wedding = normalize(w);

        if (action === "upload" && base64Data) {
          const file_url = `data:image/jpeg;base64,${base64Data}`;
          await supabase.from('gallery_photos').insert({
            wedding_id: wedding.id,
            file_url,
            filename: filename || 'guest_photo.jpg',
            section: 'guest'
          });
        }

        const { data: assets } = await supabase.from('gallery_photos').select('*').eq('wedding_id', wedding.id);

        return {
          data: {
            wedding,
            assets: (assets || []).map(normalize)
          }
        };
      }

      return { data: { success: true } };
    }
  },
  integrations: {
    Core: {
      UploadPrivateFile: async ({ file }) => {
        // Mock upload until full storage migration
        console.log(`Mocking upload of file ${file?.name}`);
        return { file_uri: `mock_uri_${Date.now()}` };
      },
      CreateFileSignedUrl: async ({ file_uri }) => {
        return { signed_url: `https://dummyimage.com/600x400/000/fff&text=${file_uri}` };
      }
    }
  }
};
