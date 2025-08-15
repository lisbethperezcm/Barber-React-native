/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,tsx}", "./src/**/*.{js,tsx}"],
  theme: {
    extend: {

      colors: {
        background: "#000000",
        foreground: "#FFFFFF",
        card: "#000000",
        "card-foreground": "#FFFFFF",
        popover: "#000000",
        "popover-foreground": "#FFFFFF",
        primary: "#FFFFFF",
        "primary-foreground": "#343434",
        secondary: "#444444",
        "secondary-foreground": "#FFFFFF",
        muted: "#444444",
        "muted-foreground": "#B4B4B4",
        accent: "#444444",
        "accent-foreground": "#FFFFFF",
        destructive: "#BB3E2E",
        "destructive-foreground": "#E6786D",
        border: "#444444",
        input: "#444444",
        ring: "#6F6F6F",
        chart1: "#6A4FFF",
        chart2: "#4DE8B2",
        chart3: "#FFD45B",
        chart4: "#C04DFF",
        chart5: "#FF9B4D",
        sidebar: "#343434",
        "sidebar-foreground": "#FFFFFF",
        "sidebar-primary": "#6A4FFF",
        "sidebar-primary-foreground": "#FFFFFF",
        "sidebar-accent": "#444444",
        "sidebar-accent-foreground": "#FFFFFF",
        "sidebar-border": "#444444",
        "sidebar-ring": "#6F6F6F",
        brand: "#E2B34D" // Dorado de tu barbería
      },
    },
  },
  plugins: [],
}

