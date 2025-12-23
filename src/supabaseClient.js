import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANT: Replace these with your actual Supabase credentials
// You can find these in your Supabase project: Settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are configured
const isConfigured = supabaseUrl && supabaseAnonKey &&
    !supabaseUrl.includes('YOUR_') &&
    !supabaseAnonKey.includes('YOUR_');

// Create client only if configured, otherwise create a mock
let supabase;

if (isConfigured) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    // Create a mock client that returns empty data
    // This allows the UI to render for development/preview
    console.warn('⚠️ Supabase not configured. Using mock data. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.');

    supabase = {
        from: (table) => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
                    order: () => ({
                        limit: async () => ({ data: [], error: null })
                    }),
                    limit: async () => ({ data: [], error: null })
                }),
                order: () => ({
                    limit: async () => ({ data: [], error: null })
                }),
                single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
                limit: async () => ({ data: [], error: null })
            }),
            insert: () => ({
                select: () => ({
                    single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
                }),
                single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
            }),
            update: () => ({
                eq: () => ({
                    select: () => ({
                        single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
                    })
                })
            }),
            delete: () => ({
                eq: async () => ({ error: { message: 'Supabase not configured' } })
            })
        })
    };
}

export { supabase, isConfigured };
