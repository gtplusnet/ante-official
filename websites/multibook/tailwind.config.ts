import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors from Quasar project
        'oxford-blue': '#0f1f4b',
        'multibook-yellow': '#f1f06c',
        'multibook-red': '#fe6568',
        'multibook-light-blue': '#c1e0fe',
        'multibook-dark-blue': '#0d1b87',
        'text-inactive': '#b1c4df',
        'text-active': '#eef066',
        'multibook-yellow-hover': '#eed94c',
      },
      backgroundImage: {
        'multibook-gradient': 'linear-gradient(73deg, #c1e0fe 0%, #0d1b87 35%, #fe6568 65%, #f1f06c 100%)',
      },
      fontFamily: {
        'noto-sans': ['"Noto Sans"', 'sans-serif'],
        'raleway': ['Raleway', 'sans-serif'],
      },
      screens: {
        'mobile': '600px',
        'tablet': '990px',
        'desktop': '1300px',
      },
      backdropBlur: {
        'navigation': '100px',
      },
      animation: {
        'infinite-scroll': 'infinite-scroll 40s linear infinite',
        'infinite-scroll-slow': 'infinite-scroll 60s linear infinite',
        'infinite-scroll-fast': 'infinite-scroll 25s linear infinite',
        'infinite-scroll-very-fast': 'infinite-scroll 15s linear infinite',
      },
      keyframes: {
        'infinite-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      minHeight: {
        'hero': '100vh',
        'cta': '55vh',
      },
      maxWidth: {
        'container': '1300px',
      },
    },
  },
  plugins: [],
} satisfies Config;