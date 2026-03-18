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
      profiles: {
        Row: {
          id: string
          role: 'landlord' | 'renter'
          full_name: string
          phone: string | null
          status: 'pending' | 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'landlord' | 'renter'
          full_name: string
          phone?: string | null
          status?: 'pending' | 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'landlord' | 'renter'
          full_name?: string
          phone?: string | null
          status?: 'pending' | 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          id: string
          landlord_id: string
          address_line_1: string
          address_line_2: string | null
          city: string
          postcode: string
          property_type: 'house' | 'flat' | 'studio' | 'room'
          bedrooms: number
          status: 'active' | 'inactive'
          emergency_contacts: Json
          house_rules: string | null
          move_in_guide: string | null
          wifi_details: string | null
          utility_info: string | null
          bin_collection_day: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          landlord_id: string
          address_line_1: string
          address_line_2?: string | null
          city: string
          postcode: string
          property_type: 'house' | 'flat' | 'studio' | 'room'
          bedrooms: number
          status?: 'active' | 'inactive'
          emergency_contacts?: Json
          house_rules?: string | null
          move_in_guide?: string | null
          wifi_details?: string | null
          utility_info?: string | null
          bin_collection_day?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          landlord_id?: string
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          postcode?: string
          property_type?: 'house' | 'flat' | 'studio' | 'room'
          bedrooms?: number
          status?: 'active' | 'inactive'
          emergency_contacts?: Json
          house_rules?: string | null
          move_in_guide?: string | null
          wifi_details?: string | null
          utility_info?: string | null
          bin_collection_day?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenancies: {
        Row: {
          id: string
          property_id: string
          renter_id: string
          lease_start: string
          lease_end: string | null
          rent_amount_pence: number
          rent_frequency: 'weekly' | 'monthly'
          deposit_amount_pence: number | null
          deposit_scheme: string | null
          deposit_reference: string | null
          status: 'active' | 'pending' | 'ended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          renter_id: string
          lease_start: string
          lease_end?: string | null
          rent_amount_pence: number
          rent_frequency?: 'weekly' | 'monthly'
          deposit_amount_pence?: number | null
          deposit_scheme?: string | null
          deposit_reference?: string | null
          status?: 'active' | 'pending' | 'ended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          renter_id?: string
          lease_start?: string
          lease_end?: string | null
          rent_amount_pence?: number
          rent_frequency?: 'weekly' | 'monthly'
          deposit_amount_pence?: number | null
          deposit_scheme?: string | null
          deposit_reference?: string | null
          status?: 'active' | 'pending' | 'ended'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          tenancy_id: string
          uploaded_by: string
          category: string
          file_name: string
          file_size: number
          mime_type: string
          storage_path: string
          version: number
          parent_document_id: string | null
          review_status: 'pending' | 'accepted' | 'more_info_needed'
          review_note: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenancy_id: string
          uploaded_by: string
          category: string
          file_name: string
          file_size: number
          mime_type: string
          storage_path: string
          version?: number
          parent_document_id?: string | null
          review_status?: 'pending' | 'accepted' | 'more_info_needed'
          review_note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenancy_id?: string
          uploaded_by?: string
          category?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          storage_path?: string
          version?: number
          parent_document_id?: string | null
          review_status?: 'pending' | 'accepted' | 'more_info_needed'
          review_note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          property_id: string
          invited_by: string
          email: string
          token: string
          renter_name: string | null
          lease_start: string | null
          rent_amount_pence: number | null
          status: 'pending' | 'accepted' | 'expired'
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          invited_by: string
          email: string
          token: string
          renter_name?: string | null
          lease_start?: string | null
          rent_amount_pence?: number | null
          status?: 'pending' | 'accepted' | 'expired'
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          invited_by?: string
          email?: string
          token?: string
          renter_name?: string | null
          lease_start?: string | null
          rent_amount_pence?: number | null
          status?: 'pending' | 'accepted' | 'expired'
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
