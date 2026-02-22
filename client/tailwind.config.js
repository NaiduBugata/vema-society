/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: '#0f172a',
                primary: {
                    light: '#6366f1',
                    DEFAULT: '#4f46e5',
                    dark: '#4338ca',
                },
            }
        },
    },
    plugins: [],
}
