import { supabase } from './supabaseClient';

// Adapter to prevent breaking changes during migration from Base44 to Supabase
// This allows the app to compile and run while slowly migrating all 85+ files.
export const base44 = {
  auth: {
    me: async () => {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user || null;
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
      
      return {
        list: async (orderBy, limit) => {
          let query = supabase.from(tableName).select('*');
          if (orderBy) query = query.order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') });
          if (limit) query = query.limit(limit);
          const { data, error } = await query;
          if (error) console.error(`Error listing ${tableName}:`, error);
          return data || [];
        },
        create: async (payload) => {
          const { data, error } = await supabase.from(tableName).insert(payload).select().single();
          if (error) console.error(`Error creating ${tableName}:`, error);
          return data;
        },
        update: async (id, payload) => {
          const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
          if (error) console.error(`Error updating ${tableName}:`, error);
          return data;
        },
        delete: async (id) => {
          const { error } = await supabase.from(tableName).delete().eq('id', id);
          if (error) console.error(`Error deleting ${tableName}:`, error);
        },
        filter: async (filters) => {
          let query = supabase.from(tableName).select('*');
          Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
          });
          const { data, error } = await query;
          if (error) console.error(`Error filtering ${tableName}:`, error);
          return data || [];
        }
      };
    }
  }),
  functions: {
    invoke: async (funcName, args) => {
      console.log(`Mocking Edge Function invoke: ${funcName}`, args);
      return { success: true, message: "Funcionalidad en migración" };
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
