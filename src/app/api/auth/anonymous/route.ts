import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Server-side anonymous sign-in.
 * This avoids client-side CORS/network issues when calling Supabase directly from the browser.
 */
export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase env vars are not configured.' },
      { status: 500 }
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Anonymous sign-in failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ session: data.session, user: data.user });
}
