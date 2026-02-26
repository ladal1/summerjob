import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SummerJob',
    short_name: 'SummerJob',
    description: 'Aplikace pro dobrovolnickou brigádu SummerJob',
    start_url: '/my-plan',
    display: 'standalone',
    background_color: '#fff0d6',
    theme_color: '#fac505',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
