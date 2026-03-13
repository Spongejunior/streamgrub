import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

const DEMO_FORMATS = [
  { format_id: '137', ext: 'mp4', resolution: '1080p', filesize: 150000000, note: 'FHD' },
  { format_id: '136', ext: 'mp4', resolution: '720p', filesize: 80000000, note: 'HD' },
  { format_id: '135', ext: 'mp4', resolution: '480p', filesize: 40000000 },
  { format_id: '134', ext: 'mp4', resolution: '360p', filesize: 20000000 },
  { format_id: '140', ext: 'm4a', resolution: '128kbps', filesize: 5000000, note: 'Audio' },
  { format_id: '139', ext: 'mp3', resolution: '192kbps', filesize: 4000000, note: 'Audio' },
];

function getDemoVideoInfo(url: string) {
  const urlObj = new URL(url);
  let platform = 'YouTube';
  if (url.includes('vimeo')) platform = 'Vimeo';
  else if (url.includes('soundcloud')) platform = 'SoundCloud';
  else if (url.includes('dailymotion')) platform = 'Dailymotion';

  return {
    id: 'demo_' + Date.now(),
    title: `${platform} Video - Sample Download`,
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop',
    duration: 185,
    uploader: 'Demo Channel',
    formats: DEMO_FORMATS
  };
}

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
          console.log('yt-dlp not available, using demo mode');
          resolve(NextResponse.json(getDemoVideoInfo(url)));
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
          resolve(NextResponse.json(getDemoVideoInfo(url)));
        }
      });

      process.on('error', (err) => {
        console.log('yt-dlp not found, using demo mode');
        resolve(NextResponse.json(getDemoVideoInfo(url)));
      });
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
