import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utilitaire pour fusionner les classes Tailwind CSS
 * Combinaison de clsx et tailwind-merge pour gérer les conflits
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
