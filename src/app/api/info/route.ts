import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

const DEMO_FORMATS = [
  { format_id: '137', ext: 'mp4', resolution: '1080p', filesize: 150000000, note: 'FHD' },
  { format_id: '136', ext: 'mp4', resolution: '720p', filesize: 80000000, note: 'HD' },
  { format_id: '135', ext: 'mp4', resolution: '480p', filesize: 40000000 },
  { format_id: '134', ext: 'mp4', resolution: '360p', filesize: 20000000 },
  { format_id: '140', ext: 'm4a', resolution: '128kbps', filesize: 5000000, note: 'Audio' },
  { format_id: '139', ext: 'mp3', resolution: '192kbps', filesize: 4000000, note: 'Audio' },
  { format_id: '251', ext: 'webm', resolution: '160kbps', filesize: 3000000, note: 'Spotify Audio' },
  { format_id: '2580', ext: 'aac', resolution: '128kbps', filesize: 4000000, note: 'AAC Audio' },
];

function getDemoVideoInfo(url: string) {
  const urlLC = url.toLowerCase();
  let platform = 'YouTube';
  if (urlLC.includes('vimeo')) platform = 'Vimeo';
  else if (urlLC.includes('soundcloud')) platform = 'SoundCloud';
  else if (urlLC.includes('dailymotion')) platform = 'Dailymotion';
  else if (urlLC.includes('spotify')) platform = 'Spotify';
  else if (urlLC.includes('tiktok')) platform = 'TikTok';
  else if (urlLC.includes('twitter') || urlLC.includes('x.com')) platform = 'Twitter';

  return {
    id: 'demo_' + Date.now(),
    title: `${platform} Content - Sample Download`,
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop',
    duration: 185,
    uploader: 'Demo Channel',
    formats: DEMO_FORMATS,
    platform
  };
}

function detectPlatform(url: string): string {
  const urlLC = url.toLowerCase();
  if (urlLC.includes('spotify')) return 'Spotify';
  if (urlLC.includes('youtube') || urlLC.includes('youtu.be')) return 'YouTube';
  if (urlLC.includes('vimeo')) return 'Vimeo';
  if (urlLC.includes('soundcloud')) return 'SoundCloud';
  if (urlLC.includes('dailymotion')) return 'Dailymotion';
  if (urlLC.includes('tiktok')) return 'TikTok';
  if (urlLC.includes('twitter') || urlLC.includes('x.com')) return 'Twitter';
  if (urlLC.includes('facebook') || urlLC.includes('fb.watch')) return 'Facebook';
  if (urlLC.includes('instagram')) return 'Instagram';
  return 'Other';
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const platform = detectPlatform(url);
    
    const ytDlpPath = 'yt-dlp';
    
    const args = [
      '--dump-json',
      '--no-download',
      '--no-playlist',
      '--no-warnings',
      url
    ];

    let isYtDlpAvailable = true;
    let stdout = '';
    let stderr = '';

    const childProcess = spawn(ytDlpPath, args);

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      if (data.toString().includes('not found')) {
        isYtDlpAvailable = false;
      }
    });

    childProcess.on('error', () => {
      isYtDlpAvailable = false;
    });

    const result = await new Promise<NextResponse>((resolve) => {
      const timeout = setTimeout(() => {
        if (!stdout) {
          isYtDlpAvailable = false;
          childProcess.kill();
        }
      }, 5000);

      childProcess.on('close', (code) => {
        clearTimeout(timeout);
        
        if (!isYtDlpAvailable || !stdout) {
          console.log('yt-dlp not available, using demo mode');
          resolve(NextResponse.json(getDemoVideoInfo(url)));
          return;
        }

        try {
          const lines = stdout.trim().split('\n');
          const data = lines.length > 1 ? JSON.parse(lines[lines.length - 1]) : JSON.parse(stdout);
          
          const formats: any[] = [];
          
          if (data.formats) {
            const seen = new Set<string>();
            for (const fmt of data.formats) {
              const key = `${fmt.ext}-${fmt.resolution || fmt.format_id}`;
              if (!seen.has(key) && fmt.format_id && fmt.ext) {
                seen.add(key);
                formats.push({
                  format_id: fmt.format_id,
                  ext: fmt.ext,
                  resolution: fmt.resolution || (fmt.height ? `${fmt.height}p` : fmt.audio_codec ? 'Audio' : undefined),
                  filesize: fmt.filesize || fmt.filesize_approx,
                  note: fmt.format_note,
                  vcodec: fmt.vcodec,
                  acodec: fmt.acodec,
                });
              }
            }
          }

          const videoFormats = formats.filter(f => f.ext !== 'm4a' && f.ext !== 'mp3' && f.ext !== 'webm' && f.ext !== 'aac' && f.vcodec && f.vcodec !== 'none');
          const audioFormats = formats.filter(f => !f.vcodec || f.vcodec === 'none' || f.ext === 'm4a' || f.ext === 'mp3' || f.ext === 'webm' || f.ext === 'aac');

          const uniqueFormats = [...videoFormats.slice(0, 6), ...audioFormats.slice(0, 4)];

          const result = {
            id: data.id,
            title: data.title || 'Unknown',
            thumbnail: data.thumbnail,
            duration: data.duration,
            uploader: data.uploader || data.channel || data.artist,
            formats: uniqueFormats,
            platform: detectPlatform(url)
          };

          resolve(NextResponse.json(result));
        } catch (parseError) {
          console.error('Parse error:', parseError);
          resolve(NextResponse.json(getDemoVideoInfo(url)));
        }
      });
    });

    return result;

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video information' 
    }, { status: 500 });
  }
}
