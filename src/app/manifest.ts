import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Personal Assistant',
    short_name: 'Assistant',
    description: 'Your personal operating system for tasks, money, and focus.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#111827',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
