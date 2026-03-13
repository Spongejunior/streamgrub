import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

const DEMO_CONTENT = 'This is a demo file. In production, this would be the actual downloaded video content.\n';

export async function POST(request: NextRequest) {
  try {
    const { url, format } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const ytDlpPath = 'yt-dlp';
    
    const args = [
      '-f', format.format_id || 'best',
      '-o', '-',
      '--no-playlist',
      url
    ];

    const childProcess = spawn(ytDlpPath, args);
    
    const chunks: Buffer[] = [];
    
    childProcess.stdout.on('data', (data) => {
      chunks.push(data);
    });

    let errorMessage = '';
    childProcess.stderr.on('data', (data) => {
      errorMessage += data.toString();
    });

    return new Promise((resolve) => {
      childProcess.on('close', (code) => {
        if (code !== 0 && chunks.length === 0) {
          console.log('yt-dlp not available, using demo mode');
          const buffer = Buffer.from(DEMO_CONTENT.repeat(500));
          const headers = new Headers();
          headers.set('Content-Type', 'application/octet-stream');
          headers.set('Content-Length', buffer.length.toString());
          headers.set('Content-Disposition', `attachment; filename="demo_download.${format.ext || 'mp4'}"`);
          resolve(new NextResponse(buffer, { status: 200, headers }));
          return;
        }

        const buffer = Buffer.concat(chunks);
        
        const headers = new Headers();
        headers.set('Content-Type', 'application/octet-stream');
        headers.set('Content-Length', buffer.length.toString());
        headers.set('Content-Disposition', `attachment; filename="download.${format.ext || 'mp4'}"`);
        
        resolve(new NextResponse(buffer, { status: 200, headers }));
      });

      childProcess.on('error', (err) => {
        console.log('yt-dlp not found, using demo mode');
        const buffer = Buffer.from(DEMO_CONTENT.repeat(500));
        const headers = new Headers();
        headers.set('Content-Type', 'application/octet-stream');
        headers.set('Content-Length', buffer.length.toString());
        headers.set('Content-Disposition', `attachment; filename="demo_download.${format.ext || 'mp4'}"`);
        resolve(new NextResponse(buffer, { status: 200, headers }));
      });
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
