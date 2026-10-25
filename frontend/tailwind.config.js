/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        ground: '#f9fbfc',
        surface: '#ffffff',
        raised: '#f4f6f8',
        active: '#ebedee',
        border: '#e8eaec',
        rule: '#f0f1f2',
        control: '#cdced1',
        text: '#131416',
        muted: '#5d5f60',
        accent: '#1b6c80',
        positive: '#1e7b4f',
        negative: '#c4242a',
        warning: '#92400e',
      },
    },
  },
  plugins: [],
}
