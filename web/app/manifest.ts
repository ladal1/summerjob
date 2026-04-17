import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SummerJob',
    short_name: 'SummerJob',
    description: 'Aplikace pro dobrovolnickou brigádu SummerJob',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff0d6',
    theme_color: '#fac505',
    icons: [
      {
        src: '/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
    ],
  }
}
