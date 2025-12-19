import { signal, effect } from '@preact/signals-react'

type Theme = 'light' | 'dark' | 'system'

// Get initial theme from localStorage or default to 'system'
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

// Resolve system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Theme signal
export const theme = signal<Theme>(getInitialTheme())

// Apply theme to document
const applyTheme = (themeValue: Theme) => {
  const root = document.documentElement
  const resolvedTheme = themeValue === 'system' ? getSystemTheme() : themeValue

  if (resolvedTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  localStorage.setItem('theme', themeValue)
}

// Effect to apply theme whenever it changes
effect(() => {
  applyTheme(theme.value)
})

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme.value === 'system') {
      applyTheme('system')
    }
  })
}

// Actions
export const setTheme = (newTheme: Theme) => {
  theme.value = newTheme
}

export const toggleTheme = () => {
  const current = theme.value
  if (current === 'light') {
    theme.value = 'dark'
  } else if (current === 'dark') {
    theme.value = 'light'
  } else {
    // If system, toggle based on current resolved theme
    theme.value = getSystemTheme() === 'dark' ? 'light' : 'dark'
  }
}

// Get resolved theme (actual light/dark value)
export const getResolvedTheme = (): 'light' | 'dark' => {
  return theme.value === 'system' ? getSystemTheme() : theme.value
}
