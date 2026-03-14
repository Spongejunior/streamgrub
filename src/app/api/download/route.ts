import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

const ACTIVE_DOWNLOADS = new Map<string, boolean>();

export async function POST(request: NextRequest) {
  try {
    const { url, format } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const downloadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    ACTIVE_DOWNLOADS.set(downloadId, true);

    try {
      const ytDlpPath = 'yt-dlp';
      
      let formatArg = format?.format_id || 'best';
      if (format?.ext === 'mp3' || format?.ext === 'm4a' || format?.ext === 'webm') {
        formatArg = 'bestaudio/best';
      }

      const args = [
        '-f', formatArg,
        '-o', '-',
        '--no-playlist',
        '--no-warnings',
        '--quiet',
        url
      ];

      const childProcess = spawn(ytDlpPath, args);
      let isYtDlpAvailable = true;
      let stderrData = '';

      childProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        if (data.toString().includes('not found') || data.toString().includes('command not found')) {
          isYtDlpAvailable = false;
        }
      });

      childProcess.on('error', () => {
        isYtDlpAvailable = false;
      });

      const checkTimeout = setTimeout(() => {
        if (!isYtDlpAvailable) {
          childProcess.kill();
        }
      }, 2000);

      await new Promise<void>((resolve) => {
        childProcess.on('close', () => {
          clearTimeout(checkTimeout);
          resolve();
        });
      });

      if (!isYtDlpAvailable || childProcess.killed) {
        const ext = format?.ext || 'mp4';
        const demoContent = `Demo content for ${url}\nInstall yt-dlp for real downloads: pip install yt-dlp`;
        const buffer = Buffer.from(demoContent.repeat(200), 'utf-8');
        
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': buffer.length.toString(),
            'Content-Disposition': `attachment; filename="download.${ext}"`,
            'Cache-Control': 'no-cache',
          }
        });
      }

      const stream = new ReadableStream({
        start(controller) {
          childProcess.stdout.on('data', (chunk: Buffer) => {
            if (ACTIVE_DOWNLOADS.has(downloadId)) {
              controller.enqueue(chunk);
            }
          });

          childProcess.on('error', (err) => {
            console.error('yt-dlp error:', err);
            controller.error(err);
          });

          childProcess.on('close', () => {
            ACTIVE_DOWNLOADS.delete(downloadId);
            try {
              controller.close();
            } catch (e) {}
          });
        },
        cancel() {
          ACTIVE_DOWNLOADS.delete(downloadId);
          childProcess.kill();
        }
      });

      const ext = format?.ext || 'mp4';
      const contentType = ext === 'mp3' ? 'audio/mpeg' 
        : ext === 'm4a' ? 'audio/mp4'
        : ext === 'webm' ? 'audio/webm'
        : 'video/mp4';

      return new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="download.${ext}"`,
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        }
      });

    } finally {
      setTimeout(() => ACTIVE_DOWNLOADS.delete(downloadId), 120000);
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    active: ACTIVE_DOWNLOADS.size,
    status: 'ready'
  });
}
