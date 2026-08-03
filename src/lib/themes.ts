export type Theme = {
  name: string
  label: string
  colors: {
    primary: string
    primaryForeground: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    mutedForeground: string
    border: string
    ring: string
  }
}

export const themes: Record<string, Theme> = {
  blue: {
    name: 'blue',
    label: 'Bleu Océan',
    colors: {
      primary: '221 83% 53%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96%',
      accent: '210 40% 90%',
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '210 40% 96%',
      mutedForeground: '215 16% 47%',
      border: '214 32% 91%',
      ring: '221 83% 53%',
    },
  },
  purple: {
    name: 'purple',
    label: 'Violet Mystique',
    colors: {
      primary: '262 83% 58%',
      primaryForeground: '210 40% 98%',
      secondary: '270 50% 95%',
      accent: '270 50% 90%',
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '270 50% 95%',
      mutedForeground: '215 16% 47%',
      border: '270 50% 91%',
      ring: '262 83% 58%',
    },
  },
  pink: {
    name: 'pink',
    label: 'Rose Passion',
    colors: {
      primary: '330 81% 60%',
      primaryForeground: '210 40% 98%',
      secondary: '330 50% 95%',
      accent: '330 50% 90%',
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '330 50% 95%',
      mutedForeground: '215 16% 47%',
      border: '330 50% 91%',
      ring: '330 81% 60%',
    },
  },
  green: {
    name: 'green',
    label: 'Vert Nature',
    colors: {
      primary: '142 76% 36%',
      primaryForeground: '210 40% 98%',
      secondary: '138 50% 95%',
      accent: '138 50% 90%',
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '138 50% 95%',
      mutedForeground: '215 16% 47%',
      border: '138 50% 91%',
      ring: '142 76% 36%',
    },
  },
  orange: {
    name: 'orange',
    label: 'Orange Énergique',
    colors: {
      primary: '24 95% 53%',
      primaryForeground: '210 40% 98%',
      secondary: '24 50% 95%',
      accent: '24 50% 90%',
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '24 50% 95%',
      mutedForeground: '215 16% 47%',
      border: '24 50% 91%',
      ring: '24 95% 53%',
    },
  },
  teal: {
    name: 'teal',
    label: 'Turquoise Moderne',
    colors: {
      primary: '173 80% 40%',
      primaryForeground: '210 40% 98%',
      secondary: '173 50% 95%',
      accent: '173 50% 90%',
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '173 50% 95%',
      mutedForeground: '215 16% 47%',
      border: '173 50% 91%',
      ring: '173 80% 40%',
    },
  },
  red: {
    name: 'red',
    label: 'Rouge Audacieux',
    colors: {
      primary: '0 84% 60%',
      primaryForeground: '210 40% 98%',
      secondary: '0 50% 95%',
      accent: '0 50% 90%',
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '0 50% 95%',
      mutedForeground: '215 16% 47%',
      border: '0 50% 91%',
      ring: '0 84% 60%',
    },
  },
  indigo: {
    name: 'indigo',
    label: 'Indigo Profond',
    colors: {
      primary: '239 84% 67%',
      primaryForeground: '210 40% 98%',
      secondary: '239 50% 95%',
      accent: '239 50% 90%',
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '239 50% 95%',
      mutedForeground: '215 16% 47%',
      border: '239 50% 91%',
      ring: '239 84% 67%',
    },
  },
}

export function applyTheme(themeName: string) {
  const theme = themes[themeName]
  if (!theme) return

  const root = document.documentElement

  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    root.style.setProperty(cssVar, value)
  })
}

export function getStoredTheme(): string {
  if (typeof window === 'undefined') return 'blue'
  return localStorage.getItem('app-theme') || 'blue'
}

export function setStoredTheme(themeName: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('app-theme', themeName)
  applyTheme(themeName)
}
