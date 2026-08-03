'use client'

import { useEffect } from 'react'
import { applyTheme, getStoredTheme } from '@/lib/themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Appliquer le thème au chargement
    const theme = getStoredTheme()
    applyTheme(theme)
  }, [])

  return <>{children}</>
}
