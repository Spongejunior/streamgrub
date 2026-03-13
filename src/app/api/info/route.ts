import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const ytDlpPath = 'yt-dlp';
    
    const args = [
      '--dump-json',
      '--no-download',
      '--no-playlist',
      url
    ];

    return new Promise((resolve) => {
      const process = spawn(ytDlpPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0 && !stdout) {
          console.error('yt-dlp error:', stderr);
          resolve(NextResponse.json({ 
            error: 'Failed to fetch video info. Make sure yt-dlp is installed.' 
          }, { status: 500 }));
          return;
        }

        try {
          const data = JSON.parse(stdout);
          
          const formats = [];
          
          if (data.formats) {
            for (const fmt of data.formats) {
              if (fmt.format_id && fmt.ext) {
                formats.push({
                  format_id: fmt.format_id,
                  ext: fmt.ext,
                  resolution: fmt.resolution || (fmt.height ? `${fmt.height}p` : undefined),
                  filesize: fmt.filesize,
                  filesize_approx: fmt.filesize_approx,
                  note: fmt.format_note
                });
              }
            }
          }

          const result = {
            id: data.id,
            title: data.title,
            thumbnail: data.thumbnail,
            duration: data.duration,
            uploader: data.uploader || data.channel,
            formats: formats.slice(0, 20)
          };

          resolve(NextResponse.json(result));
        } catch (parseError) {
          console.error('Parse error:', parseError);
          resolve(NextResponse.json({ 
            error: 'Failed to parse video information' 
          }, { status: 500 }));
        }
      });

      process.on('error', (err) => {
        console.error('Process error:', err);
        resolve(NextResponse.json({ 
          error: 'yt-dlp is not installed. Please install it to use this feature.' 
        }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
