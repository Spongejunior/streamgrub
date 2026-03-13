# StreamGrab - Video/Audio Download Manager

## Project Overview

**Project Name:** StreamGrab
**Type:** Web Application (Next.js)
**Core Functionality:** A browser-based download manager that captures videos and audio from YouTube and other streaming platforms, similar to Internet Download Manager (IDM).
**Target Users:** Users who want to download videos/audio from streaming platforms for offline viewing.

## UI/UX Specification

### Layout Structure

**Header**
- Logo: "StreamGrab" with download icon
- Dark theme toggle (optional)
- Minimal, fixed at top

**Main Content Area**
- URL input section (hero area)
- Download queue/list section
- Active downloads with progress
- Completed downloads history

**Responsive Breakpoints**
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (adaptive)
- Desktop: > 1024px (full layout)

### Visual Design

**Color Palette**
- Background: `#0a0a0f` (deep dark)
- Surface: `#14141f` (card background)
- Surface Elevated: `#1e1e2e` (hover states)
- Primary: `#f97316` (orange - main accent)
- Primary Hover: `#ea580c`
- Secondary: `#22d3ee` (cyan - for progress)
- Success: `#22c55e` (green)
- Error: `#ef4444` (red)
- Text Primary: `#fafafa`
- Text Secondary: `#a1a1aa`
- Border: `#27272a`

**Typography**
- Font Family: "Outfit" (headings), "JetBrains Mono" (URLs/code)
- Headings: 700 weight, tracking tight
- Body: 400 weight
- Sizes: h1 (2.5rem), h2 (1.5rem), body (1rem), small (0.875rem)

**Spacing System**
- Base unit: 4px
- Sections: 64px padding
- Cards: 24px padding
- Elements: 12px-16px gaps

**Visual Effects**
- Card shadows: `0 4px 24px rgba(0,0,0,0.4)`
- Border radius: 12px (cards), 8px (buttons/inputs)
- Subtle gradient overlays on hero
- Glow effects on primary buttons
- Smooth transitions: 200ms ease

### Components

**URL Input Bar**
- Large input field with placeholder "Paste video URL here..."
- Platform auto-detection badge (YouTube, Vimeo, etc.)
- "Add to Queue" button (primary)
- States: default, focused (orange glow), error

**Format Selector Modal**
- Triggered after URL validation
- Video tabs: Video+Audio, Audio Only
- Quality options: 2160p, 1080p, 720p, 480p, 360p (for video)
- Audio: MP3, WAV, FLAC
- File size estimates
- "Download" CTA button

**Download Card (Queue Item)**
- Thumbnail (if available)
- Title (truncated)
- Platform icon badge
- Progress bar (cyan fill)
- Speed indicator
- ETA
- Pause/Resume/Cancel buttons
- Status: queued, downloading, paused, completed, error

**Download Card (Completed)**
- Thumbnail
- Title
- File size
- Format badge
- Duration
- "Open File" / "Open Folder" / "Delete" actions
- Download timestamp

**Empty States**
- Queue empty: Illustration + "Paste a URL to start downloading"
- Completed empty: "No downloads yet"

### Animations

- URL input focus: subtle scale + glow
- Button hover: lift + brightness
- Progress bar: smooth fill animation
- Cards: fade-in on add, slide-out on remove
- Download complete: pulse/success animation

## Functionality Specification

### Core Features

1. **URL Input & Validation**
   - Accept URLs from YouTube, Vimeo, Dailymotion, SoundCloud, and 1000+ sites
   - Validate URL format client-side
   - Auto-detect platform from URL
   - Support batch URL pasting (one per line)

2. **Video Info Fetching**
   - Fetch video metadata (title, thumbnail, duration, available formats)
   - Display format selection UI
   - Show file size estimates

3. **Download Queue**
   - Add multiple URLs to queue
   - Sequential downloading (one at a time to avoid rate limits)
   - Persist queue in localStorage
   - Reorder queue (drag & drop - optional)

4. **Download Progress**
   - Real-time progress percentage
   - Download speed (MB/s)
   - ETA calculation
   - Pause/Resume capability
   - Cancel with cleanup

5. **Download History**
   - Keep history of completed downloads
   - Show download date, file size, format
   - Quick actions: open file, open folder, copy link, delete

6. **Settings**
   - Default download location (display only - actual saves to browser)
   - Default format preference
   - Concurrent downloads limit

### User Interactions

1. User pastes URL → Click "Add" → App fetches info → Format modal appears
2. User selects format → Click "Download" → Added to queue
3. Download starts automatically → Progress shown in real-time
4. Download completes → Moved to history → Notification
5. User can pause/resume/cancel from queue

### Data Handling

- Queue and history stored in localStorage
- No server-side storage required
- Downloads served via API routes

### Edge Cases

- Invalid URL: Show error message
- Unavailable video: Show "video unavailable" error
- Network interruption: Auto-pause, show retry option
- Rate limiting: Queue delays, show warning
- Unsupported site: Show "unsupported platform" message

## Technical Implementation

### API Routes

- `POST /api/info` - Fetch video metadata using yt-dlp
- `POST /api/download` - Start download, return stream
- `GET /api/progress/[id]` - Get download progress

### Dependencies

- `yt-dlp` - Video downloading (requires installation)
- `ffmpeg` - Audio conversion (requires installation)
- Frontend: React, Tailwind CSS 4

### Note

This app requires `yt-dlp` and `ffmpeg` to be installed on the system for actual downloads to work. The UI demonstrates full functionality, and the API will attempt to use these tools when available.

## Acceptance Criteria

1. ✅ URL input accepts and validates video URLs
2. ✅ Platform is auto-detected and shown as badge
3. ✅ Format selection modal shows quality options
4. ✅ Downloads appear in queue with progress
5. ✅ Progress shows percentage, speed, and ETA
6. ✅ Completed downloads appear in history
7. ✅ Pause/Resume/Cancel work correctly
8. ✅ History persists across page refreshes
9. ✅ Responsive design works on mobile
10. ✅ Dark theme with orange accent throughout
