export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      club_hosts: {
        Row: {
          club_title: string
          created_at: string
          id: string
          linked_user_id: string | null
          public_name: string
          updated_at: string
        }
        Insert: {
          club_title: string
          created_at?: string
          id?: string
          linked_user_id?: string | null
          public_name: string
          updated_at?: string
        }
        Update: {
          club_title?: string
          created_at?: string
          id?: string
          linked_user_id?: string | null
          public_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          alt_text: string
          caption: string | null
          created_at: string
          id: string
          is_published: boolean
          sort_order: number
          storage_path: string
          taken_on: string | null
          title: string
          trip_id: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          alt_text: string
          caption?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          sort_order?: number
          storage_path: string
          taken_on?: string | null
          title: string
          trip_id?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          alt_text?: string
          caption?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          sort_order?: number
          storage_path?: string
          taken_on?: string | null
          title?: string
          trip_id?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gallery_photos_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      membership_access_overrides: {
        Row: {
          created_at: string
          ends_at: string | null
          granted_by: string
          id: string
          reason: string
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          starts_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          granted_by: string
          id?: string
          reason: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          granted_by?: string
          id?: string
          reason?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      membership_account_restrictions: {
        Row: {
          created_at: string
          internal_reason: string | null
          restricted_at: string | null
          restriction: Database['public']['Enums']['membership_restriction']
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          internal_reason?: string | null
          restricted_at?: string | null
          restriction?: Database['public']['Enums']['membership_restriction']
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          internal_reason?: string | null
          restricted_at?: string | null
          restriction?: Database['public']['Enums']['membership_restriction']
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      membership_applications: {
        Row: {
          age_status: Database['public']['Enums']['membership_age_status']
          confirmed_at: string | null
          confirmed_by: string | null
          contact_email: string
          created_at: string
          dues_claimed_at: string | null
          dues_payment_claimed: boolean
          experience_notes: string | null
          full_name: string
          guardian_consent: Database['public']['Enums']['guardian_consent_status']
          membership_access_override_id: string | null
          primary_interest: string
          status: Database['public']['Enums']['membership_application_status']
          updated_at: string
          user_id: string
        }
        Insert: {
          age_status: Database['public']['Enums']['membership_age_status']
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact_email: string
          created_at?: string
          dues_claimed_at?: string | null
          dues_payment_claimed?: boolean
          experience_notes?: string | null
          full_name: string
          guardian_consent: Database['public']['Enums']['guardian_consent_status']
          membership_access_override_id?: string | null
          primary_interest: string
          status?: Database['public']['Enums']['membership_application_status']
          updated_at?: string
          user_id: string
        }
        Update: {
          age_status?: Database['public']['Enums']['membership_age_status']
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact_email?: string
          created_at?: string
          dues_claimed_at?: string | null
          dues_payment_claimed?: boolean
          experience_notes?: string | null
          full_name?: string
          guardian_consent?: Database['public']['Enums']['guardian_consent_status']
          membership_access_override_id?: string | null
          primary_interest?: string
          status?: Database['public']['Enums']['membership_application_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'membership_applications_membership_access_override_id_fkey'
            columns: ['membership_access_override_id']
            isOneToOne: true
            referencedRelation: 'membership_access_overrides'
            referencedColumns: ['id']
          },
        ]
      }
      membership_checkout_attempts: {
        Row: {
          amount_cents: number
          checkout_url: string | null
          created_at: string
          currency: string
          expires_at: string
          id: string
          status: Database['public']['Enums']['membership_checkout_status']
          stripe_checkout_session_id: string | null
          stripe_price_id: string
          test_mode: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          expires_at: string
          id?: string
          status?: Database['public']['Enums']['membership_checkout_status']
          stripe_checkout_session_id?: string | null
          stripe_price_id: string
          test_mode: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          status?: Database['public']['Enums']['membership_checkout_status']
          stripe_checkout_session_id?: string | null
          stripe_price_id?: string
          test_mode?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      membership_entitlements: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          payment_id: string
          revoked_at: string | null
          revoked_reason: string | null
          starts_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          payment_id: string
          revoked_at?: string | null
          revoked_reason?: string | null
          starts_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          payment_id?: string
          revoked_at?: string | null
          revoked_reason?: string | null
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'membership_entitlements_payment_id_fkey'
            columns: ['payment_id']
            isOneToOne: true
            referencedRelation: 'membership_payments'
            referencedColumns: ['id']
          },
        ]
      }
      membership_payments: {
        Row: {
          amount_cents: number
          checkout_attempt_id: string
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          receipt_url: string | null
          status: Database['public']['Enums']['membership_payment_status']
          stripe_checkout_session_id: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          test_mode: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          checkout_attempt_id: string
          created_at?: string
          currency: string
          id?: string
          paid_at?: string | null
          receipt_url?: string | null
          status: Database['public']['Enums']['membership_payment_status']
          stripe_checkout_session_id: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          test_mode: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          checkout_attempt_id?: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          receipt_url?: string | null
          status?: Database['public']['Enums']['membership_payment_status']
          stripe_checkout_session_id?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          test_mode?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'membership_payments_checkout_attempt_id_fkey'
            columns: ['checkout_attempt_id']
            isOneToOne: true
            referencedRelation: 'membership_checkout_attempts'
            referencedColumns: ['id']
          },
        ]
      }
      membership_review_items: {
        Row: {
          created_at: string
          id: string
          payment_id: string | null
          reason_code: string
          reason_detail: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database['public']['Enums']['membership_review_status']
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_id?: string | null
          reason_code: string
          reason_detail: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['membership_review_status']
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_id?: string | null
          reason_code?: string
          reason_detail?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['membership_review_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'membership_review_items_payment_id_fkey'
            columns: ['payment_id']
            isOneToOne: false
            referencedRelation: 'membership_payments'
            referencedColumns: ['id']
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          joined_on: string
          member_since: string | null
          role: Database['public']['Enums']['club_role']
          status: Database['public']['Enums']['membership_status']
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          joined_on?: string
          member_since?: string | null
          role?: Database['public']['Enums']['club_role']
          status?: Database['public']['Enums']['membership_status']
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          joined_on?: string
          member_since?: string | null
          role?: Database['public']['Enums']['club_role']
          status?: Database['public']['Enums']['membership_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          birthday: string | null
          carpool_profile: Json | null
          created_at: string
          emergency_contact: Json | null
          gear_profile: Json | null
          general_waiver_signed_at: string | null
          general_waiver_version: string | null
          interests_preferences: Json | null
          notification_settings: Json | null
          phone: string | null
          privacy_settings: Json | null
          skills_certs: Json | null
          travel_profile: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birthday?: string | null
          carpool_profile?: Json | null
          created_at?: string
          emergency_contact?: Json | null
          gear_profile?: Json | null
          general_waiver_signed_at?: string | null
          general_waiver_version?: string | null
          interests_preferences?: Json | null
          notification_settings?: Json | null
          phone?: string | null
          privacy_settings?: Json | null
          skills_certs?: Json | null
          travel_profile?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birthday?: string | null
          carpool_profile?: Json | null
          created_at?: string
          emergency_contact?: Json | null
          gear_profile?: Json | null
          general_waiver_signed_at?: string | null
          general_waiver_version?: string | null
          interests_preferences?: Json | null
          notification_settings?: Json | null
          phone?: string | null
          privacy_settings?: Json | null
          skills_certs?: Json | null
          travel_profile?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          first_name: string | null
          last_name: string | null
          pronouns: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          first_name?: string | null
          last_name?: string | null
          pronouns?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          first_name?: string | null
          last_name?: string | null
          pronouns?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      schedule_review_items: {
        Row: {
          created_at: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          schedule_key: string
          scheduled_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          schedule_key: string
          scheduled_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          schedule_key?: string
          scheduled_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          attempt_count: number
          event_type: string
          last_error: string | null
          processed_at: string | null
          received_at: string
          status: Database['public']['Enums']['webhook_processing_status']
          stripe_event_id: string
          test_mode: boolean
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          event_type: string
          last_error?: string | null
          processed_at?: string | null
          received_at?: string
          status?: Database['public']['Enums']['webhook_processing_status']
          stripe_event_id: string
          test_mode: boolean
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          event_type?: string
          last_error?: string | null
          processed_at?: string | null
          received_at?: string
          status?: Database['public']['Enums']['webhook_processing_status']
          stripe_event_id?: string
          test_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      trip_attendance: {
        Row: {
          attended: boolean | null
          created_at: string
          feedback: Json | null
          responded_at: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          created_at?: string
          feedback?: Json | null
          responded_at?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          created_at?: string
          feedback?: Json | null
          responded_at?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_attendance_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_carpools: {
        Row: {
          created_at: string
          id: string
          kind: Database['public']['Enums']['carpool_kind']
          note: string | null
          seats: number | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database['public']['Enums']['carpool_kind']
          note?: string | null
          seats?: number | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database['public']['Enums']['carpool_kind']
          note?: string | null
          seats?: number | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_carpools_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          is_deleted: boolean
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_comments_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_drafts: {
        Row: {
          activity_tags: string[]
          created_at: string
          created_by: string
          difficulty: Database['public']['Enums']['trip_difficulty'] | null
          ends_at: string | null
          id: string
          is_official: boolean
          location_notes: string | null
          max_participants: number | null
          meeting_location_name: string | null
          overview_carpool_need_gear: string | null
          overview_equipment: string | null
          overview_weather: string | null
          overview_what: string | null
          overview_where: string | null
          primary_location_name: string | null
          short_summary: string | null
          starts_at: string | null
          time_zone: string | null
          title: string | null
          updated_at: string
          visibility: Database['public']['Enums']['trip_visibility']
        }
        Insert: {
          activity_tags?: string[]
          created_at?: string
          created_by: string
          difficulty?: Database['public']['Enums']['trip_difficulty'] | null
          ends_at?: string | null
          id?: string
          is_official?: boolean
          location_notes?: string | null
          max_participants?: number | null
          meeting_location_name?: string | null
          overview_carpool_need_gear?: string | null
          overview_equipment?: string | null
          overview_weather?: string | null
          overview_what?: string | null
          overview_where?: string | null
          primary_location_name?: string | null
          short_summary?: string | null
          starts_at?: string | null
          time_zone?: string | null
          title?: string | null
          updated_at?: string
          visibility?: Database['public']['Enums']['trip_visibility']
        }
        Update: {
          activity_tags?: string[]
          created_at?: string
          created_by?: string
          difficulty?: Database['public']['Enums']['trip_difficulty'] | null
          ends_at?: string | null
          id?: string
          is_official?: boolean
          location_notes?: string | null
          max_participants?: number | null
          meeting_location_name?: string | null
          overview_carpool_need_gear?: string | null
          overview_equipment?: string | null
          overview_weather?: string | null
          overview_what?: string | null
          overview_where?: string | null
          primary_location_name?: string | null
          short_summary?: string | null
          starts_at?: string | null
          time_zone?: string | null
          title?: string | null
          updated_at?: string
          visibility?: Database['public']['Enums']['trip_visibility']
        }
        Relationships: [
          {
            foreignKeyName: 'trip_drafts_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      trip_favorites: {
        Row: {
          created_at: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_favorites_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_hosts: {
        Row: {
          credited_title: string
          host_id: string
          sort_order: number
          trip_id: string
        }
        Insert: {
          credited_title: string
          host_id: string
          sort_order?: number
          trip_id: string
        }
        Update: {
          credited_title?: string
          host_id?: string
          sort_order?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_hosts_host_id_fkey'
            columns: ['host_id']
            isOneToOne: false
            referencedRelation: 'club_hosts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trip_hosts_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_leaders: {
        Row: {
          created_at: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_leaders_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_private: {
        Row: {
          description_private: string | null
          lat: number | null
          lng: number | null
          location_private: string | null
          meetup_point: string | null
          recommended_gear: string[] | null
          required_gear: string[] | null
          trip_id: string
          updated_at: string
          weather_notes: string | null
        }
        Insert: {
          description_private?: string | null
          lat?: number | null
          lng?: number | null
          location_private?: string | null
          meetup_point?: string | null
          recommended_gear?: string[] | null
          required_gear?: string[] | null
          trip_id: string
          updated_at?: string
          weather_notes?: string | null
        }
        Update: {
          description_private?: string | null
          lat?: number | null
          lng?: number | null
          location_private?: string | null
          meetup_point?: string | null
          recommended_gear?: string[] | null
          required_gear?: string[] | null
          trip_id?: string
          updated_at?: string
          weather_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'trip_private_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: true
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_rsvps: {
        Row: {
          created_at: string
          note: string | null
          status: Database['public']['Enums']['trip_rsvp_status']
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          status: Database['public']['Enums']['trip_rsvp_status']
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          status?: Database['public']['Enums']['trip_rsvp_status']
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_rsvps_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_tag_options: {
        Row: {
          created_at: string
          tag: string
        }
        Insert: {
          created_at?: string
          tag: string
        }
        Update: {
          created_at?: string
          tag?: string
        }
        Relationships: []
      }
      trip_waivers: {
        Row: {
          body: string
          title: string
          trip_id: string
          updated_at: string
          version: string
        }
        Insert: {
          body: string
          title: string
          trip_id: string
          updated_at?: string
          version: string
        }
        Update: {
          body?: string
          title?: string
          trip_id?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_waivers_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: true
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trips: {
        Row: {
          activity_id: string | null
          activity_tags: string[]
          capacity: number | null
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          description_public: string | null
          difficulty: Database['public']['Enums']['trip_difficulty'] | null
          ends_at: string
          id: string
          is_all_day: boolean
          is_official: boolean
          location_public: string | null
          overview_carpool_need_gear: string | null
          overview_equipment: string | null
          overview_weather: string | null
          overview_what: string | null
          overview_where: string | null
          rsvp_deadline: string | null
          schedule_key: string | null
          starts_at: string
          time_zone: string
          title: string
          updated_at: string
          visibility: Database['public']['Enums']['trip_visibility']
          waitlist_enabled: boolean
        }
        Insert: {
          activity_id?: string | null
          activity_tags?: string[]
          capacity?: number | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description_public?: string | null
          difficulty?: Database['public']['Enums']['trip_difficulty'] | null
          ends_at: string
          id?: string
          is_all_day?: boolean
          is_official?: boolean
          location_public?: string | null
          overview_carpool_need_gear?: string | null
          overview_equipment?: string | null
          overview_weather?: string | null
          overview_what?: string | null
          overview_where?: string | null
          rsvp_deadline?: string | null
          schedule_key?: string | null
          starts_at: string
          time_zone?: string
          title: string
          updated_at?: string
          visibility?: Database['public']['Enums']['trip_visibility']
          waitlist_enabled?: boolean
        }
        Update: {
          activity_id?: string | null
          activity_tags?: string[]
          capacity?: number | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description_public?: string | null
          difficulty?: Database['public']['Enums']['trip_difficulty'] | null
          ends_at?: string
          id?: string
          is_all_day?: boolean
          is_official?: boolean
          location_public?: string | null
          overview_carpool_need_gear?: string | null
          overview_equipment?: string | null
          overview_weather?: string | null
          overview_what?: string | null
          overview_where?: string | null
          rsvp_deadline?: string | null
          schedule_key?: string | null
          starts_at?: string
          time_zone?: string
          title?: string
          updated_at?: string
          visibility?: Database['public']['Enums']['trip_visibility']
          waitlist_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'trips_activity_id_fkey'
            columns: ['activity_id']
            isOneToOne: false
            referencedRelation: 'activities'
            referencedColumns: ['id']
          },
        ]
      }
      user_interests: {
        Row: {
          activity_id: string
          created_at: string
          experience_level: number
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          experience_level?: number
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          experience_level?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_interests_activity_id_fkey'
            columns: ['activity_id']
            isOneToOne: false
            referencedRelation: 'activities'
            referencedColumns: ['id']
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          trip_email_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          trip_email_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          trip_email_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_waivers: {
        Row: {
          id: string
          signature_name: string | null
          signed_at: string
          user_id: string
          version: string
          waiver_key: string
        }
        Insert: {
          id?: string
          signature_name?: string | null
          signed_at?: string
          user_id: string
          version: string
          waiver_key: string
        }
        Update: {
          id?: string
          signature_name?: string | null
          signed_at?: string
          user_id?: string
          version?: string
          waiver_key?: string
        }
        Relationships: []
      }
      waiver_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          key: string
          title: string
          version: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          key: string
          title: string
          version: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          key?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_membership_review_item: {
        Args: { p_review_id: string; p_reviewer_id: string }
        Returns: string
      }
      can_manage_trip: {
        Args: { p_trip_id: string; p_uid: string }
        Returns: boolean
      }
      can_view_trip: {
        Args: { p_trip_id: string; p_uid: string }
        Returns: boolean
      }
      can_view_trip_private: {
        Args: { p_trip_id: string; p_uid: string }
        Returns: boolean
      }
      can_view_trip_readonly: {
        Args: { p_trip_id: string }
        Returns: boolean
      }
      confirm_membership_guardian_consent: {
        Args: { p_reviewer_id: string; p_user_id: string }
        Returns: undefined
      }
      confirm_zelle_membership_application: {
        Args: { p_reviewer_id: string; p_user_id: string }
        Returns: string
      }
      get_my_membership_access: {
        Args: never
        Returns: {
          access_active: boolean
          expires_at: string
          override_active: boolean
          provisional_access: boolean
          restriction: string
        }[]
      }
      get_my_membership_application: {
        Args: never
        Returns: {
          age_status: string
          application_status: string
          confirmed_at: string
          contact_email: string
          created_at: string
          dues_payment_claimed: boolean
          experience_notes: string
          full_name: string
          guardian_consent: string
          primary_interest: string
          updated_at: string
        }[]
      }
      get_my_membership_payment_history: {
        Args: never
        Returns: {
          amount_cents: number
          currency: string
          granted_ends_at: string
          granted_starts_at: string
          payment_date: string
          public_status: string
          receipt_url: string
        }[]
      }
      has_membership_access: { Args: { p_uid: string }; Returns: boolean }
      has_provisional_membership_access: { Args: never; Returns: boolean }
      is_active_member: { Args: { p_uid: string }; Returns: boolean }
      is_banned: { Args: { p_uid: string }; Returns: boolean }
      is_staff_or_admin: { Args: { p_uid: string }; Returns: boolean }
      process_membership_checkout_event: {
        Args: {
          p_amount_cents: number
          p_attempt_id: string
          p_checkout_session_id: string
          p_currency: string
          p_customer_id: string | null
          p_event_id: string
          p_event_type: string
          p_paid_at: string
          p_payment_intent_id: string
          p_receipt_url: string | null
          p_test_mode: boolean
          p_user_id: string
        }
        Returns: {
          duplicate_event: boolean
          entitlement_id: string
          payment_id: string
          review_required: boolean
        }[]
      }
      process_membership_dispute_event: {
        Args: {
          p_dispute_recorded_at: string
          p_event_id: string
          p_event_type: string
          p_payment_intent_id: string
          p_test_mode: boolean
        }
        Returns: {
          access_suspended: boolean
          review_required: boolean
        }[]
      }
      process_membership_refund_event: {
        Args: {
          p_amount_refunded: number
          p_event_id: string
          p_event_type: string
          p_payment_intent_id: string
          p_refund_recorded_at: string
          p_test_mode: boolean
        }
        Returns: {
          entitlement_revoked: boolean
          review_required: boolean
        }[]
      }
      try_uuid: { Args: { p: string }; Returns: string }
    }
    Enums: {
      carpool_kind: 'offer' | 'need'
      club_role: 'regular' | 'staff' | 'leadership' | 'admin'
      guardian_consent_status: 'not_required' | 'pending' | 'confirmed'
      membership_age_status: 'adult' | 'minor'
      membership_application_status: 'submitted' | 'confirmed' | 'withdrawn'
      membership_checkout_status:
        | 'open'
        | 'completed'
        | 'expired'
        | 'canceled'
        | 'failed'
        | 'review_required'
      membership_payment_status:
        | 'pending'
        | 'paid'
        | 'failed'
        | 'refunded'
        | 'partially_refunded'
        | 'disputed'
        | 'review_required'
      membership_restriction: 'normal' | 'suspended' | 'banned'
      membership_review_status:
        | 'pending'
        | 'approved'
        | 'refund_requested'
        | 'refunded'
        | 'dismissed'
      membership_status:
        | 'active'
        | 'inactive'
        | 'pending'
        | 'past_due'
        | 'canceled'
        | 'suspended'
        | 'banned'
      trip_difficulty: 'beginner' | 'intermediate' | 'hard' | 'expert'
      trip_rsvp_status:
        | 'going'
        | 'maybe'
        | 'not_going'
        | 'invited'
        | 'removed'
        | 'waitlisted'
      trip_visibility: 'public' | 'members' | 'minimal'
      webhook_processing_status: 'processing' | 'succeeded' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      carpool_kind: ['offer', 'need'],
      club_role: ['regular', 'staff', 'leadership', 'admin'],
      guardian_consent_status: ['not_required', 'pending', 'confirmed'],
      membership_age_status: ['adult', 'minor'],
      membership_application_status: ['submitted', 'confirmed', 'withdrawn'],
      membership_checkout_status: [
        'open',
        'completed',
        'expired',
        'canceled',
        'failed',
        'review_required',
      ],
      membership_payment_status: [
        'pending',
        'paid',
        'failed',
        'refunded',
        'partially_refunded',
        'disputed',
        'review_required',
      ],
      membership_restriction: ['normal', 'suspended', 'banned'],
      membership_review_status: [
        'pending',
        'approved',
        'refund_requested',
        'refunded',
        'dismissed',
      ],
      membership_status: [
        'active',
        'inactive',
        'pending',
        'past_due',
        'canceled',
        'suspended',
        'banned',
      ],
      trip_difficulty: ['beginner', 'intermediate', 'hard', 'expert'],
      trip_rsvp_status: [
        'going',
        'maybe',
        'not_going',
        'invited',
        'removed',
        'waitlisted',
      ],
      trip_visibility: ['public', 'members', 'minimal'],
      webhook_processing_status: ['processing', 'succeeded', 'failed'],
    },
  },
} as const
