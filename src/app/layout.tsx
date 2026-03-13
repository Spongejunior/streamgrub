import type { Metadata } from "next";
import { AppProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "StreamGrab - Download Videos from Anywhere",
  description: "Download videos and audio from YouTube, Vimeo, SoundCloud and 1000+ streaming platforms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
