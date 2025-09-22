/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(10px)' },
        },
      },
      animation: {
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        fadeIn: 'fadeIn 0.3s ease-out',
        fadeOut: 'fadeOut 0.3s ease-in',
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        anton: ["Anton", "sans-serif"],
        borel: ["Borel", "sans-serif"],
        comicRelief: ['"Comic Relief"', "cursive"],
        eduNSWACTHandPre: ['"Edu NSW ACT Hand Pre"', "cursive"],
        lilitaOne: ['"Lilita One"', "cursive"],
      },
      animation: {
        "spin-slow": "spin 20s linear infinite",
        floatingBg: "floatingBg 120s linear infinite",
        float: "float 2s ease-in-out infinite",
      },
      keyframes: {
        floatingBg: {
          "0%": { transform: "translate(0, 0)" },
          "100%": { transform: "translate(0, -100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
