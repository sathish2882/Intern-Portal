/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Calibri", "system-ui", "sans-serif"],
      body: ["Calibri", "system-ui", "sans-serif"],
      heading: ["Calibri", "system-ui", "sans-serif"],
      jakarta: ["Calibri", "system-ui", "sans-serif"],
      syne: ["Calibri", "system-ui", "sans-serif"],
      mono: ["Calibri", "system-ui", "sans-serif"],
    },
    extend: {
      colors: {
        /* User portal — light navy */
        navy: "#0d1b2e",
        navy2: "#132238",
        navy3: "#1a2f4a",
        blue: "#1d6ede",
        bluelt: "#2d80f5",
        sky: "#e8f1fd",
        slate: "#4a5e78",
        mist: "#8fa3bb",
        line: "#dce6f0",
        lightbg: "#f4f7fc",

        /* Admin portal — dark gold */
        abg: "#0b0b0e",
        abg2: "#111116",
        abg3: "#18181f",
        abg4: "#1f1f28",
        gold: "#e9a628",
        golddim: "rgba(233,166,40,0.10)",
        goldtxt: "#ffc85a",
        adark: "#eeebe3",
        amuted: "#7a7885",
        amuted2: "#4a4857",
        asuccess: "#3dba78",
        adanger: "#e05252",
        ainfo: "#5a9ef5",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s cubic-bezier(.2,1,.4,1) both",
        shake: "shake 0.35s ease",
        blink: "blink 1s ease infinite",
        spin: "spin 0.65s linear infinite",
      },
    },
  },
  plugins: [],
};
