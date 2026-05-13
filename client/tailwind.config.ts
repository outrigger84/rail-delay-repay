import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0b0d0d',
        s1:      '#121515',
        s2:      '#181c1c',
        s3:      '#1f2525',
        b1:      '#252b2b',
        b2:      '#2f3838',
        amber:   '#e8a020',
        'amber-d': '#7a5512',
        green:   '#3dba6e',
        red:     '#e05252',
        dim:     '#757068',
        faint:   '#3f3d38',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
