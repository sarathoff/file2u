import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { fileName, fileType } = await req.json();
    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required.' }, { status: 400 });
    }

    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      subject: process.env.GOOGLE_WORKSPACE_USER_EMAIL, 
    });

    const drive = google.drive({ version: 'v3', auth });

    // --- CORRECTED API CALL ---
    // All parameters, including uploadType, are now in a single object.
    const fileResource = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
        mimeType: fileType,
      },
      fields: 'id',
      supportsAllDrives: true,
      uploadType: 'resumable', // The critical parameter
    });
    // --- END OF CORRECTION ---
    
    const uploadUrl = fileResource.headers.location;
    const fileId = fileResource.data.id;
    
    if (!uploadUrl) {
      console.error('Google Drive API did not return an upload URL.', {
        responseStatus: fileResource.status,
        responseData: fileResource.data,
      });
      throw new Error('Failed to get upload URL from Google Drive.');
    }

    const driveLink = `https://drive.google.com/file/d/${fileId}/view`;

    const shareCode = Math.floor(10000 + Math.random() * 90000);
    const { error } = await supabase
      .from('shared_files')
      .insert({ share_code: shareCode, file_url: driveLink });
    
    if (error) throw error;

    return NextResponse.json({ uploadUrl, shareCode, driveLink });

  } catch (error: any) {
    console.error('Error in start-upload endpoint:', error);
    return NextResponse.json({ error: 'Failed to start upload session.' }, { status: 500 });
  }
}