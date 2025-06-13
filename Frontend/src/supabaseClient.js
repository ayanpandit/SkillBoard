import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://onycregeasqgincwcdkz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWNyZWdlYXNxZ2luY3djZGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDQyNjAsImV4cCI6MjA2NTM4MDI2MH0.8Ax1qCDDaC3zAEOyR1fgGg8jEWq8CDLPVVF0TMJqkWQ';

// Create Supabase client with production redirect URL
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Set the site URL to the production URL
    site: 'https://skillboard-nit5.onrender.com'
  }
});
