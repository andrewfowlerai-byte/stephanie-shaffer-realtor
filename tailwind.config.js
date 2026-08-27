import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config}
 *
 *  Token NAMES are intentionally kept identical to the template (brand, navy,
 *  silver, midnight, flame) so every component re-skins from this one file and
 *  feature work flows across client forks. Only the hex VALUES change.
 *
 *  Stephanie's palette: Russell Real Estate Services navy + a burgundy accent
 *  + warm greige neutrals. Reads as Russell, professional and grounded.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Russell navy-blue (links, secondary structural accents)
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
        // Deep navy darks
        navy: {
          600: '#243a6b',
          700: '#1d2f5c',
          800: '#182857',
          900: '#101b3c',
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
        // Structural navy (sidebar, dark sections, hero)
        midnight: {
          700: '#2a3d6b',
          800: '#1f3160',
          900: '#182857',
          950: '#101b3c',
        },
        // Russell maroon accent (buttons, active states, highlights), matching the
        // rule in the Russell Real Estate Services logo. Kept under the name
        // "flame" so template components that reference flame-* re-skin. Sampled
        // from the logo file: navy #182857, maroon #97262c.
        flame: {
          50:  '#fbf1f2',
          100: '#f7dcde',
          200: '#eeb9bc',
          300: '#e08c91',
          400: '#cd5a61',
          500: '#b23a41',
          600: '#97262c',
          700: '#7c1f24',
          800: '#5c171b',
          900: '#3d0f12',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'flame-glow': '0 0 24px -4px rgba(151, 38, 44, 0.4)',
      },
    },
  },
  plugins: [typography],
};
