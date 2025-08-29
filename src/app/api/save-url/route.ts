import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const { fileUrl } = await req.json();
    if (!fileUrl) {
      return NextResponse.json({ error: 'fileUrl is required.' }, { status: 400 });
    }

    // Generate a unique 5-digit share code
    const shareCode = Math.floor(10000 + Math.random() * 90000);

    const { error } = await supabase
      .from('shared_files')
      .insert({ share_code: shareCode, file_url: fileUrl });

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error('Failed to save file information.');
    }

    return NextResponse.json({ shareCode, fileUrl });
  } catch (error: any) {
    console.error('Error in save-url endpoint:', error);
    return NextResponse.json({ error: 'Failed to save file URL.' }, { status: 500 });
  }
}