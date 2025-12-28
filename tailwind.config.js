/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary-blue': '#4FC3F7',
                'secondary-blue': '#5BC0EB',
                'primary-yellow': '#FFD93D',
                'secondary-green': '#6BCF9D',
                'warm-orange': '#FF9F43',
                'pink-coral': '#FF6F91',
                'text-navy': '#2C2C2C',
            },
            fontFamily: {
                nunito: ['var(--font-nunito)', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
