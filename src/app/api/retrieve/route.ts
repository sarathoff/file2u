import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// This function handles GET requests to /api/retrieve
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Share code is required.' }, { status: 400 });
    }

    // Query the database for a matching, non-expired code
    const { data, error } = await supabase
      .from('shared_files')
      .select('file_url')
      .eq('share_code', parseInt(code))
      .single(); // .single() ensures only one row is returned

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 404 });
    }

    // Return the found file URL
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Retrieve failed:', error.message);
    return NextResponse.json({ error: 'An error occurred while retrieving the file.' }, { status: 500 });
  }
}