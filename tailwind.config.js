import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config}
 *
 *  Token NAMES are intentionally kept identical to the template (brand, navy,
 *  silver, midnight, flame) so every component re-skins from this one file and
 *  feature work flows across client forks. Only the hex VALUES change.
 *
 *  Stephanie's palette: Coldwell Banker navy + a warm gold accent + warm
 *  greige neutrals. Reads as Coldwell Banker, feels warm and friendly.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Coldwell Banker blue (links, secondary structural accents)
        brand: {
          50:  '#eef4fb',
          100: '#d2e3f6',
          200: '#a6c6ea',
          300: '#6fa1db',
          400: '#3b79c7',
          500: '#1c59a9',
          600: '#0e4391',
          700: '#0b3270',
          800: '#0a2654',
          900: '#07193a',
        },
        // Deep CB navy darks
        navy: {
          600: '#15294a',
          700: '#0e1e3a',
          800: '#0a1730',
          900: '#050d1c',
        },
        // Warm greige neutrals (friendly, not cool slate)
        silver: {
          50:  '#faf8f5',
          100: '#f3efe9',
          200: '#e7e0d6',
          300: '#d2c7b8',
          400: '#a99c89',
          500: '#7e7363',
          600: '#5e5447',
          700: '#463f35',
          800: '#2e2922',
          900: '#1a1611',
        },
        // Structural CB navy (sidebar, dark sections, hero)
        midnight: {
          700: '#1f3a5f',
          800: '#15294a',
          900: '#0e1e3a',
          950: '#081328',
        },
        // Warm gold accent (buttons, active states, highlights). Kept under the
        // name "flame" so template components that reference flame-* re-skin.
        flame: {
          50:  '#fbf6ec',
          100: '#f5e8c9',
          200: '#ecd496',
          300: '#ddb95c',
          400: '#cf9f30',
          500: '#bd8717',
          600: '#9a6a10',
          700: '#7c5410',
          800: '#593d0e',
          900: '#3b280a',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'flame-glow': '0 0 24px -4px rgba(189, 135, 23, 0.4)',
      },
    },
  },
  plugins: [typography],
};
