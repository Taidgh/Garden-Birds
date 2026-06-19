/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka One"', 'cursive'],
        body:    ['"Nunito"', 'sans-serif'],
        ui:      ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'xs':   ['0.8rem',  { lineHeight: '1.4' }],
        'sm':   ['0.925rem',{ lineHeight: '1.5' }],
        'base': ['1.05rem', { lineHeight: '1.6' }],
        'lg':   ['1.15rem', { lineHeight: '1.5' }],
        'xl':   ['1.3rem',  { lineHeight: '1.4' }],
        '2xl':  ['1.55rem', { lineHeight: '1.3' }],
        '3xl':  ['1.9rem',  { lineHeight: '1.2' }],
        '4xl':  ['2.3rem',  { lineHeight: '1.1' }],
      },
      colors: {
        paper:     '#fffdf7',
        parchment: '#f5f0e8',
        cream:     '#ede6d4',
        ink: {
          dark:  '#2c2416',
          mid:   '#5c4d30',
          light: '#8c7a55',
          faint: '#b8a880',
        },
        bark:  '#8c6a3a',
        moss:  '#4a6741',
        fern:  '#6b8c58',
        stone: '#9e9080',
        amber: '#c9980a',
        rust:  '#b85c20',
        berry: '#7c4a8c',
        sky:   '#4a7fa8',
      },
    }
  },
  plugins: []
}
