import type { Database } from './database'

/**
 * Types métier dérivés des types de base de données
 */

// Alias pour les types de tables
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type ContactStatus = Database['public']['Tables']['contact_statuses']['Row']
export type ContactSource = Database['public']['Tables']['contact_sources']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactChannel = Database['public']['Tables']['contact_channels']['Row']
export type Interaction = Database['public']['Tables']['interactions']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Reminder = Database['public']['Tables']['reminders']['Row']

// Types d'insertion
export type InsertUserProfile = Database['public']['Tables']['user_profiles']['Insert']
export type InsertContactStatus = Database['public']['Tables']['contact_statuses']['Insert']
export type InsertContactSource = Database['public']['Tables']['contact_sources']['Insert']
export type InsertContact = Database['public']['Tables']['contacts']['Insert']
export type InsertContactChannel = Database['public']['Tables']['contact_channels']['Insert']
export type InsertInteraction = Database['public']['Tables']['interactions']['Insert']
export type InsertAppointment = Database['public']['Tables']['appointments']['Insert']
export type InsertPayment = Database['public']['Tables']['payments']['Insert']
export type InsertReminder = Database['public']['Tables']['reminders']['Insert']

// Types de mise à jour
export type UpdateUserProfile = Database['public']['Tables']['user_profiles']['Update']
export type UpdateContactStatus = Database['public']['Tables']['contact_statuses']['Update']
export type UpdateContactSource = Database['public']['Tables']['contact_sources']['Update']
export type UpdateContact = Database['public']['Tables']['contacts']['Update']
export type UpdateContactChannel = Database['public']['Tables']['contact_channels']['Update']
export type UpdateInteraction = Database['public']['Tables']['interactions']['Update']
export type UpdateAppointment = Database['public']['Tables']['appointments']['Update']
export type UpdatePayment = Database['public']['Tables']['payments']['Update']
export type UpdateReminder = Database['public']['Tables']['reminders']['Update']

// Types énumérés
export type RiskLevel = Contact['risk_level']
export type ChannelType = ContactChannel['channel_type']
export type InteractionType = Interaction['type']
export type InteractionDirection = NonNullable<Interaction['direction']>
export type AppointmentStatus = Appointment['status']
export type PaymentMethod = NonNullable<Payment['payment_method']>
export type PaymentStatus = Payment['payment_status']
export type ReminderPriority = Reminder['priority']

// Types composés pour les vues avec relations
export type ContactWithRelations = Contact & {
  status?: ContactStatus | null
  source?: ContactSource | null
  channels?: ContactChannel[]
}

export type InteractionWithContact = Interaction & {
  contact: Contact
}

export type AppointmentWithContact = Appointment & {
  contact: Contact
}

export type PaymentWithRelations = Payment & {
  contact: Contact
  appointment?: Appointment | null
}

export type ReminderWithContact = Reminder & {
  contact?: Contact | null
}

// Types pour les formulaires
export type ContactFormData = Omit<InsertContact, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_interaction_at'>
export type AppointmentFormData = Omit<InsertAppointment, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type PaymentFormData = Omit<InsertPayment, 'id' | 'user_id' | 'created_at'>
export type ReminderFormData = Omit<InsertReminder, 'id' | 'user_id' | 'created_at'>
export type InteractionFormData = Omit<InsertInteraction, 'id' | 'user_id' | 'created_at'>

// Types pour les statistiques du dashboard
export type DashboardStats = {
  totalContacts: number
  newContactsThisMonth: number
  appointmentsToday: number
  overdueReminders: number
  revenueThisMonth: number
}

export type ContactsByStatus = {
  statusName: string
  statusColor: string
  count: number
}

export type ContactsBySource = {
  sourceName: string
  count: number
}

// Types pour l'import/export
export type CSVContact = {
  first_name?: string
  last_name?: string
  nickname?: string
  phone?: string
  email?: string
  age?: string
  city?: string
  source?: string
  status?: string
  notes?: string
}

export type ImportPreview = {
  validRows: CSVContact[]
  invalidRows: Array<{ row: CSVContact; errors: string[] }>
  duplicates: Array<{ row: CSVContact; existingContact: Contact }>
}
