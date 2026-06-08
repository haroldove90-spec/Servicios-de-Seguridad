/**
 * Supabase client initialization
 */
import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const rawUrl = metaEnv.VITE_SUPABASE_URL || 'https://orcjrjshauiudlewnczr.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').trim();
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yY2pyanNoYXVpdWRsZXduY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTI5MzIsImV4cCI6MjA5NjA2ODkzMn0.0YB9HhBsYqiSvQfoNgmgjuWxUjYL3s0eB9MT6boJ6Jg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
