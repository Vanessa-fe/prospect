'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CSVContact, Contact, ImportPreview } from '@/types'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export async function previewImport(contacts: CSVContact[]): Promise<ActionResult<ImportPreview>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Récupérer tous les contacts existants pour détecter les doublons
    const { data: existingContactsData } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)

    const existingContacts = existingContactsData as Contact[] | null

    const validRows: CSVContact[] = []
    const invalidRows: Array<{ row: CSVContact; errors: string[] }> = []
    const duplicates: Array<{ row: CSVContact; existingContact: Contact }> = []

    for (const contact of contacts) {
      const errors: string[] = []

      // Valider les données de base (au moins un téléphone ou email)
      if (!contact.phone && !contact.email) {
        errors.push('Un contact doit avoir au moins un téléphone ou un email')
      }

      // Valider l'email
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        errors.push('Email invalide')
      }

      // Valider l'âge
      if (contact.age) {
        const ageStr = contact.age.toString().trim()
        if (ageStr) {
          const age = parseInt(ageStr, 10)
          if (isNaN(age) || age < 0 || age > 150) {
            errors.push('Âge invalide')
          }
        }
      }

      // Normaliser le téléphone
      let normalizedPhone: string | undefined
      if (contact.phone) {
        try {
          // Essayer de parser le numéro
          if (isValidPhoneNumber(contact.phone)) {
            const phoneNumber = parsePhoneNumber(contact.phone)
            normalizedPhone = phoneNumber.format('E.164')
          } else {
            // Si la validation échoue, garder le numéro tel quel s'il commence par +
            // Cela permet d'accepter les numéros internationaux moins courants
            const cleanPhone = contact.phone.trim()
            if (cleanPhone.startsWith('+') && cleanPhone.length >= 8) {
              normalizedPhone = cleanPhone
            } else {
              errors.push('Numéro de téléphone invalide')
            }
          }
        } catch {
          // En cas d'erreur, essayer quand même de garder le numéro s'il a le bon format
          const cleanPhone = contact.phone.trim()
          if (cleanPhone.startsWith('+') && cleanPhone.length >= 8) {
            normalizedPhone = cleanPhone
          } else {
            errors.push('Numéro de téléphone invalide')
          }
        }
      }

      // Détecter les doublons
      if (existingContacts && (normalizedPhone || contact.email)) {
        const duplicate = existingContacts.find(
          (existing) =>
            (normalizedPhone && existing.phone === normalizedPhone) ||
            (contact.email &&
              existing.email?.toLowerCase() === contact.email.toLowerCase())
        )

        if (duplicate) {
          duplicates.push({ row: contact, existingContact: duplicate })
          continue
        }
      }

      if (errors.length > 0) {
        invalidRows.push({ row: contact, errors })
      } else {
        validRows.push(contact)
      }
    }

    return {
      success: true,
      data: {
        validRows,
        invalidRows,
        duplicates,
      },
    }
  } catch (error) {
    console.error('Error in previewImport:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function bulkImportContacts(
  contacts: CSVContact[],
  options?: {
    updateDuplicates?: boolean
  }
): Promise<ActionResult<{ imported: number; updated: number }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Récupérer les statuts et sources par défaut
    const [{ data: defaultStatus }, { data: defaultSource }] = await Promise.all([
      supabase
        .from('contact_statuses')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single(),
      supabase
        .from('contact_sources')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(1)
        .single(),
    ])

    // Récupérer tous les statuts et sources pour le mapping
    const [{ data: allStatusesData }, { data: allSourcesData }] = await Promise.all([
      supabase.from('contact_statuses').select('id, name').eq('user_id', user.id),
      supabase.from('contact_sources').select('id, name').eq('user_id', user.id),
    ])

    const allStatuses = allStatusesData as Array<{ id: string; name: string }> | null
    const allSources = allSourcesData as Array<{ id: string; name: string }> | null

    let imported = 0
    let updated = 0

    for (const contact of contacts) {
      // Normaliser le téléphone
      let normalizedPhone: string | undefined
      if (contact.phone) {
        try {
          if (isValidPhoneNumber(contact.phone)) {
            const phoneNumber = parsePhoneNumber(contact.phone)
            normalizedPhone = phoneNumber.format('E.164')
          } else {
            // Si la validation échoue, garder le numéro tel quel s'il commence par +
            const cleanPhone = contact.phone.trim()
            if (cleanPhone.startsWith('+') && cleanPhone.length >= 8) {
              normalizedPhone = cleanPhone
            }
          }
        } catch {
          // En cas d'erreur, essayer quand même de garder le numéro s'il a le bon format
          const cleanPhone = contact.phone.trim()
          if (cleanPhone.startsWith('+') && cleanPhone.length >= 8) {
            normalizedPhone = cleanPhone
          }
        }
      }

      // Mapper le statut
      let statusId = (defaultStatus as { id: string } | null)?.id
      if (contact.status && allStatuses) {
        const matchingStatus = allStatuses.find(
          (s) => s.name.toLowerCase() === contact.status?.toLowerCase()
        )
        if (matchingStatus) {
          statusId = matchingStatus.id
        }
      }

      // Mapper la source
      let sourceId = (defaultSource as { id: string } | null)?.id
      if (contact.source && allSources) {
        const matchingSource = allSources.find(
          (s) => s.name.toLowerCase() === contact.source?.toLowerCase()
        )
        if (matchingSource) {
          sourceId = matchingSource.id
        }
      }

      // Vérifier si le contact existe déjà
      let existingContact: Contact | null = null
      if (normalizedPhone || contact.email) {
        const { data } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
          .or(
            `phone.eq.${normalizedPhone},email.eq.${contact.email?.toLowerCase()}`
          )
          .single()

        existingContact = data as Contact | null
      }

      if (existingContact && options?.updateDuplicates) {
        // Mettre à jour le contact existant
        await supabase
          .from('contacts')
          .update({
            first_name: contact.first_name || existingContact.first_name,
            last_name: contact.last_name || existingContact.last_name,
            nickname: contact.nickname || existingContact.nickname,
            phone: normalizedPhone || existingContact.phone,
            email: contact.email || existingContact.email,
            age: contact.age ? parseInt(contact.age, 10) : existingContact.age,
            city: contact.city || existingContact.city,
            status_id: statusId || existingContact.status_id,
            source_id: sourceId || existingContact.source_id,
            notes: contact.notes || existingContact.notes,
          } as never)
          .eq('id', existingContact.id)

        updated++
      } else if (!existingContact) {
        // Créer un nouveau contact
        await supabase
          .from('contacts')
          .insert({
            user_id: user.id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            nickname: contact.nickname,
            phone: normalizedPhone,
            email: contact.email,
            age: contact.age ? parseInt(contact.age, 10) : null,
            city: contact.city,
            status_id: statusId,
            source_id: sourceId,
            notes: contact.notes,
            favorite: false,
            risk_level: 'normal',
          } as never)

        imported++
      }
    }

    revalidatePath('/contacts')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: { imported, updated },
    }
  } catch (error) {
    console.error('Error in bulkImportContacts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
