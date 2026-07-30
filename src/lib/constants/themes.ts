/**
 * Configuration des thèmes disponibles
 */

export const THEMES = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Design épuré en noir et blanc',
  },
  {
    id: 'pink-candy',
    name: 'Pink Candy',
    description: 'Rose, lilas et blanc',
  },
  {
    id: 'dark-violet',
    name: 'Dark Violet',
    description: 'Violet foncé et rose',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Vert sauge et crème',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Bleu nuit et turquoise',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Pêche, orange et bordeaux',
  },
] as const

export type ThemeId = (typeof THEMES)[number]['id']
