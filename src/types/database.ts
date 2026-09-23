/**
 * Types générés automatiquement depuis le schéma Supabase
 *
 * Pour générer ces types, exécuter:
 * npm run supabase:generate-types
 *
 * Prérequis:
 * 1. Avoir configuré les variables d'environnement Supabase
 * 2. Avoir Supabase CLI installé
 * 3. Avoir lancé `supabase link` pour connecter au projet
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string | null
          business_name: string | null
          business_type: string | null
          avatar_url: string | null
          selected_theme: string
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          business_name?: string | null
          business_type?: string | null
          avatar_url?: string | null
          selected_theme?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          business_name?: string | null
          business_type?: string | null
          avatar_url?: string | null
          selected_theme?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contact_statuses: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          order: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          order: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          order?: number
          is_default?: boolean
          created_at?: string
        }
      }
      contact_sources: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          order: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string | null
          order?: number
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          nickname: string | null
          phone: string | null
          email: string | null
          age: number | null
          city: string | null
          source_id: string | null
          status_id: string | null
          favorite: boolean
          risk_level: 'normal' | 'monitor' | 'insistent' | 'blocked'
          notes: string | null
          created_at: string
          updated_at: string
          last_interaction_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          nickname?: string | null
          phone?: string | null
          email?: string | null
          age?: number | null
          city?: string | null
          source_id?: string | null
          status_id?: string | null
          favorite?: boolean
          risk_level?: 'normal' | 'monitor' | 'insistent' | 'blocked'
          notes?: string | null
          created_at?: string
          updated_at?: string
          last_interaction_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          nickname?: string | null
          phone?: string | null
          email?: string | null
          age?: number | null
          city?: string | null
          source_id?: string | null
          status_id?: string | null
          favorite?: boolean
          risk_level?: 'normal' | 'monitor' | 'insistent' | 'blocked'
          notes?: string | null
          created_at?: string
          updated_at?: string
          last_interaction_at?: string | null
        }
      }
      contact_channels: {
        Row: {
          id: string
          contact_id: string
          channel_type: 'whatsapp' | 'sms' | 'telegram' | 'signal' | 'phone' | 'instagram' | 'email' | 'website' | 'other'
          username: string | null
          external_identifier: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          channel_type: 'whatsapp' | 'sms' | 'telegram' | 'signal' | 'phone' | 'instagram' | 'email' | 'website' | 'other'
          username?: string | null
          external_identifier?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          channel_type?: 'whatsapp' | 'sms' | 'telegram' | 'signal' | 'phone' | 'instagram' | 'email' | 'website' | 'other'
          username?: string | null
          external_identifier?: string | null
          created_at?: string
        }
      }
      interactions: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          type: 'message' | 'call_incoming' | 'call_outgoing' | 'call_missed' | 'note' | 'reminder' | 'system_event'
          channel: string | null
          occurred_at: string
          content: string | null
          duration: number | null
          direction: 'incoming' | 'outgoing' | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          type: 'message' | 'call_incoming' | 'call_outgoing' | 'call_missed' | 'note' | 'reminder' | 'system_event'
          channel?: string | null
          occurred_at: string
          content?: string | null
          duration?: number | null
          direction?: 'incoming' | 'outgoing' | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          type?: 'message' | 'call_incoming' | 'call_outgoing' | 'call_missed' | 'note' | 'reminder' | 'system_event'
          channel?: string | null
          occurred_at?: string
          content?: string | null
          duration?: number | null
          direction?: 'incoming' | 'outgoing' | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          title: string
          start_at: string
          end_at: string | null
          location: string | null
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          reminder_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          title: string
          start_at: string
          end_at?: string | null
          location?: string | null
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          reminder_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          title?: string
          start_at?: string
          end_at?: string | null
          location?: string | null
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          reminder_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          appointment_id: string | null
          amount: number
          deposit_amount: number
          payment_method: 'cash' | 'card' | 'transfer' | 'check' | 'paypal' | 'other' | null
          payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
          paid_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          appointment_id?: string | null
          amount: number
          deposit_amount?: number
          payment_method?: 'cash' | 'card' | 'transfer' | 'check' | 'paypal' | 'other' | null
          payment_status?: 'pending' | 'partial' | 'paid' | 'refunded'
          paid_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          appointment_id?: string | null
          amount?: number
          deposit_amount?: number
          payment_method?: 'cash' | 'card' | 'transfer' | 'check' | 'paypal' | 'other' | null
          payment_status?: 'pending' | 'partial' | 'paid' | 'refunded'
          paid_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          agency_id: string | null
          title: string
          due_at: string
          completed_at: string | null
          priority: 'low' | 'medium' | 'high'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id?: string | null
          agency_id?: string | null
          title: string
          due_at: string
          completed_at?: string | null
          priority?: 'low' | 'medium' | 'high'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string | null
          agency_id?: string | null
          title?: string
          due_at?: string
          completed_at?: string | null
          priority?: 'low' | 'medium' | 'high'
          created_at?: string
        }
      }
      agency_statuses: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          order: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          order: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          order?: number
          is_default?: boolean
          created_at?: string
        }
      }
      agency_sources: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          order: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string | null
          order?: number
          created_at?: string
        }
      }
      agencies: {
        Row: {
          id: string
          user_id: string
          name: string
          website: string | null
          city: string | null
          size_range: '1-5' | '6-15' | '16-50' | '50+' | null
          detected_stack: string[]
          stack_detected_at: string | null
          stack_evidence: Json | null
          signal_type: 'job_posting_dev' | 'nextjs_portfolio' | 'ai_offer' | 'other' | null
          signal_url: string | null
          signal_detected_at: string | null
          contact_name: string | null
          contact_role: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_linkedin_url: string | null
          preferred_channel: 'email' | 'linkedin' | 'phone' | 'other' | null
          status_id: string | null
          source_id: string | null
          notes: string | null
          last_interaction_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          website?: string | null
          city?: string | null
          size_range?: '1-5' | '6-15' | '16-50' | '50+' | null
          detected_stack?: string[]
          stack_detected_at?: string | null
          stack_evidence?: Json | null
          signal_type?: 'job_posting_dev' | 'nextjs_portfolio' | 'ai_offer' | 'other' | null
          signal_url?: string | null
          signal_detected_at?: string | null
          contact_name?: string | null
          contact_role?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_linkedin_url?: string | null
          preferred_channel?: 'email' | 'linkedin' | 'phone' | 'other' | null
          status_id?: string | null
          source_id?: string | null
          notes?: string | null
          last_interaction_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          website?: string | null
          city?: string | null
          size_range?: '1-5' | '6-15' | '16-50' | '50+' | null
          detected_stack?: string[]
          stack_detected_at?: string | null
          stack_evidence?: Json | null
          signal_type?: 'job_posting_dev' | 'nextjs_portfolio' | 'ai_offer' | 'other' | null
          signal_url?: string | null
          signal_detected_at?: string | null
          contact_name?: string | null
          contact_role?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_linkedin_url?: string | null
          preferred_channel?: 'email' | 'linkedin' | 'phone' | 'other' | null
          status_id?: string | null
          source_id?: string | null
          notes?: string | null
          last_interaction_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      agency_interactions: {
        Row: {
          id: string
          user_id: string
          agency_id: string
          type: 'message' | 'call_incoming' | 'call_outgoing' | 'call_missed' | 'note' | 'reminder' | 'system_event'
          channel: string | null
          occurred_at: string
          content: string | null
          duration: number | null
          direction: 'incoming' | 'outgoing' | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agency_id: string
          type: 'message' | 'call_incoming' | 'call_outgoing' | 'call_missed' | 'note' | 'reminder' | 'system_event'
          channel?: string | null
          occurred_at: string
          content?: string | null
          duration?: number | null
          direction?: 'incoming' | 'outgoing' | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agency_id?: string
          type?: 'message' | 'call_incoming' | 'call_outgoing' | 'call_missed' | 'note' | 'reminder' | 'system_event'
          channel?: string | null
          occurred_at?: string
          content?: string | null
          duration?: number | null
          direction?: 'incoming' | 'outgoing' | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      initialize_user_defaults: {
        Args: {
          target_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
