/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        gaming: {
          primary: '#3B82F6',
          secondary: '#6366F1',
          accent: '#8B5CF6',
          dark: {
            100: '#1F2937',
            200: '#111827',
            300: '#0F172A',
          },
          light: {
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
          }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
} 