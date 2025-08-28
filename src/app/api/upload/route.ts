import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }

    // --- Authenticate using OAuth2 Refresh Token ---
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
    // --- End of authentication ---

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, webViewLink',
    });

    const driveLink = response.data.webViewLink;
    if (!driveLink) {
      throw new Error('File uploaded, but no link was returned.');
    }

    const shareCode = Math.floor(100 + Math.random() * 900);
    const { data, error } = await supabase
      .from('shared_files')
      .insert({ share_code: shareCode, file_url: driveLink })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ shareCode: data.share_code, driveLink: data.file_url });

  } catch (error: any) {
    console.error('Upload failed:', error.message);
    return NextResponse.json({ error: 'Upload process failed.', details: error.message }, { status: 500 });
  }
}