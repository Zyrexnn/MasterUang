import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gneolbtdmfjonfuwyzjr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env file')
}

// Safe client initialization
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    })
    : null as any;

if (!supabase) {
    console.error('CRITICAL: Supabase client could not be initialized. Check .env');
}

// Test connection on load
if (supabase) {
    supabase.auth.getSession().then(({ data, error }: any) => {
        if (error) {
            console.error('❌ Supabase connection error:', error.message)
        } else {
            console.log('✅ Supabase connected successfully')
        }
    }).catch((e: any) => console.error('Supabase Init Catch:', e))
}

export function useSupabase() {
    return { supabase }
}
