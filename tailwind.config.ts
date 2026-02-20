import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f4ea",
        ink: "#201c18",
        line: "#d2d8e0",
        accent: "#1d5db9",
        accentSoft: "#1b87ad"
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "SUIT",
          "Noto Sans KR",
          "Apple SD Gothic Neo",
          "sans-serif"
        ]
      },
      keyframes: {
        rise: {
          "0%": {
            opacity: "0",
            transform: "translateY(8px) scale(0.96)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)"
          }
        },
        pop: {
          "0%": {
            opacity: "0",
            transform: "scale(0.92)"
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)"
          }
        }
      },
      animation: {
        rise: "rise 320ms ease both",
        pop: "pop 280ms ease both"
      }
    }
  },
  plugins: []
};

export default config;

