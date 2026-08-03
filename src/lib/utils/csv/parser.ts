import Papa from 'papaparse'
import type { CSVContact } from '@/types'

export interface ParseResult {
  data: CSVContact[]
  errors: string[]
  meta: {
    fields?: string[]
    truncated: boolean
    aborted: boolean
  }
}

export function parseContactsCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normaliser les en-têtes
        const normalized = header.toLowerCase().trim()
        const mapping: Record<string, string> = {
          'prénom': 'first_name',
          'prenom': 'first_name',
          'firstname': 'first_name',
          'prénom / pseudo': 'first_name',
          'prenom / pseudo': 'first_name',
          'pseudo': 'nickname',
          'nom': 'last_name',
          'lastname': 'last_name',
          'surnom': 'nickname',
          'téléphone': 'phone',
          'telephone': 'phone',
          'tel': 'phone',
          '+numéro': 'phone',
          '+numero': 'phone',
          'numéro': 'phone',
          'numero': 'phone',
          'email': 'email',
          'mail': 'email',
          'âge': 'age',
          'age': 'age',
          'ville': 'city',
          'city': 'city',
          'source': 'source',
          'plateforme': 'source',
          'platform': 'source',
          'statut': 'status',
          'status': 'status',
          'notes': 'notes',
          'note': 'notes',
          'raison': 'notes',
        }
        return mapping[normalized] || normalized
      },
      transform: (value: string, header: string) => {
        // Nettoyer les numéros de téléphone
        if (header === 'phone' && value) {
          // Remplacer ++ par + et enlever les espaces
          return value.replace(/^\+\+/, '+').replace(/\s/g, '')
        }
        return value
      },
      complete: (results) => {
        const errors: string[] = []

        // Vérifier les erreurs de parsing
        if (results.errors.length > 0) {
          results.errors.forEach((error) => {
            errors.push(`Ligne ${error.row}: ${error.message}`)
          })
        }

        // Valider les données
        const data = results.data as CSVContact[]

        resolve({
          data,
          errors,
          meta: {
            fields: results.meta.fields,
            truncated: results.meta.truncated,
            aborted: results.meta.aborted,
          },
        })
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [error.message],
          meta: {
            truncated: false,
            aborted: true,
          },
        })
      },
    })
  })
}

export function validateContact(contact: CSVContact): string[] {
  const errors: string[] = []

  // Au moins un téléphone ou un email (le nom n'est plus obligatoire)
  if (!contact.phone && !contact.email) {
    errors.push('Un contact doit avoir au moins un téléphone ou un email')
  }

  // Valider l'email si présent
  if (contact.email && !isValidEmail(contact.email)) {
    errors.push(`Email invalide: ${contact.email}`)
  }

  // Valider l'âge si présent
  if (contact.age) {
    const ageStr = contact.age.toString().trim()
    if (ageStr) {
      const age = parseInt(ageStr, 10)
      if (isNaN(age) || age < 0 || age > 150) {
        errors.push(`Âge invalide: ${contact.age}`)
      }
    }
  }

  return errors
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateContactsTemplate(): string {
  const headers = [
    'first_name',
    'last_name',
    'nickname',
    'phone',
    'email',
    'age',
    'city',
    'source',
    'status',
    'notes',
  ]

  const exampleRow = {
    first_name: 'Jean',
    last_name: 'Dupont',
    nickname: 'JD',
    phone: '+33612345678',
    email: 'jean.dupont@example.com',
    age: '35',
    city: 'Paris',
    source: 'Bouche à oreille',
    status: 'Prospect',
    notes: 'Contact intéressé par nos services',
  }

  return Papa.unparse([exampleRow], {
    header: true,
    columns: headers,
  })
}
