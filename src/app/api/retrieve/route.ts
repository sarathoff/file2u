import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Share code is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('shared_files')
      .select('file_url')
      .eq('share_code', parseInt(code))
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Retrieve failed:', error.message);
    return NextResponse.json({ error: 'An error occurred while retrieving the file.' }, { status: 500 });
  }
}