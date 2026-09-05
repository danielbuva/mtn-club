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
      account_age_declarations: {
        Row: {
          declared_at: string
          is_18_or_older: boolean
          source: string
          user_id: string
        }
        Insert: {
          declared_at?: string
          is_18_or_older: boolean
          source?: string
          user_id: string
        }
        Update: {
          declared_at?: string
          is_18_or_older?: boolean
          source?: string
          user_id?: string
        }
        Relationships: []
      }
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
      account_deletion_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_error: string | null
          requested_by: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          requested_by: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_activity_events: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          id: string
          resource_id: string | null
          resource_type: string
          result: string
          subject_user_id: string | null
          summary: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          resource_id?: string | null
          resource_type: string
          result?: string
          subject_user_id?: string | null
          summary: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          resource_id?: string | null
          resource_type?: string
          result?: string
          subject_user_id?: string | null
          summary?: string
        }
        Relationships: []
      }
      admin_capabilities: {
        Row: {
          action: string
          created_at: string
          is_active: boolean
          key: string
          label: string
          phase: number
          resource: string
          supports_assigned_scope: boolean
        }
        Insert: {
          action: string
          created_at?: string
          is_active?: boolean
          key: string
          label: string
          phase?: number
          resource: string
          supports_assigned_scope?: boolean
        }
        Update: {
          action?: string
          created_at?: string
          is_active?: boolean
          key?: string
          label?: string
          phase?: number
          resource?: string
          supports_assigned_scope?: boolean
        }
        Relationships: []
      }
      admin_role_grants: {
        Row: {
          capability_key: string
          created_at: string
          role_id: string
          scope: Database['public']['Enums']['admin_permission_scope']
          updated_at: string
        }
        Insert: {
          capability_key: string
          created_at?: string
          role_id: string
          scope?: Database['public']['Enums']['admin_permission_scope']
          updated_at?: string
        }
        Update: {
          capability_key?: string
          created_at?: string
          role_id?: string
          scope?: Database['public']['Enums']['admin_permission_scope']
          updated_at?: string
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_super_admin: boolean
          is_system: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_super_admin?: boolean
          is_system?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_super_admin?: boolean
          is_system?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'admin_user_roles_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'admin_roles'
            referencedColumns: ['id']
          },
        ]
      }
      club_hosts: {
        Row: {
          club_title: string
          created_at: string
          id: string
          display_order: number
          is_active: boolean
          linked_user_id: string | null
          public_name: string
          role_key: string | null
          updated_at: string
        }
        Insert: {
          club_title: string
          created_at?: string
          id?: string
          display_order?: number
          is_active?: boolean
          linked_user_id?: string | null
          public_name: string
          role_key?: string | null
          updated_at?: string
        }
        Update: {
          club_title?: string
          created_at?: string
          id?: string
          display_order?: number
          is_active?: boolean
          linked_user_id?: string | null
          public_name?: string
          role_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      club_admin_settings: {
        Row: {
          currency: string
          dues_amount_cents: number
          id: boolean
          non_admin_upcoming_trip_limit: number
          registration_enabled: boolean
          time_zone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          currency?: string
          dues_amount_cents?: number
          id?: boolean
          non_admin_upcoming_trip_limit?: number
          registration_enabled?: boolean
          time_zone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          currency?: string
          dues_amount_cents?: number
          id?: boolean
          non_admin_upcoming_trip_limit?: number
          registration_enabled?: boolean
          time_zone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      club_terms: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          is_active: boolean
          name: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          is_active?: boolean
          name: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          is_active?: boolean
          name?: string
          starts_on?: string
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
      mailing_list_consent_events: {
        Row: {
          consent_source: string
          created_at: string
          email: string
          id: string
          subscribed: boolean
          user_id: string
        }
        Insert: {
          consent_source: string
          created_at?: string
          email: string
          id?: string
          subscribed: boolean
          user_id: string
        }
        Update: {
          consent_source?: string
          created_at?: string
          email?: string
          id?: string
          subscribed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      mailing_list_subscriptions: {
        Row: {
          consent_source: string
          created_at: string
          email: string
          subscribed: boolean
          subscribed_at: string | null
          unsubscribed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_source: string
          created_at?: string
          email: string
          subscribed?: boolean
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_source?: string
          created_at?: string
          email?: string
          subscribed?: boolean
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          payment_id: string | null
          revoked_at: string | null
          revoked_reason: string | null
          starts_at: string
          user_id: string
          zelle_payment_id: string | null
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          payment_id?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          starts_at: string
          user_id: string
          zelle_payment_id?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          payment_id?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          starts_at?: string
          user_id?: string
          zelle_payment_id?: string | null
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
      membership_zelle_payments: {
        Row: {
          amount_cents: number
          claim_source: string
          claimed_at: string
          created_at: string
          currency: string
          id: string
          internal_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database['public']['Enums']['zelle_payment_status']
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          claim_source?: string
          claimed_at?: string
          created_at?: string
          currency?: string
          id?: string
          internal_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['zelle_payment_status']
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          claim_source?: string
          claimed_at?: string
          created_at?: string
          currency?: string
          id?: string
          internal_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['zelle_payment_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          queued_at: string | null
          registered_at: string | null
          registration_state: string
          revision: number
          status: Database['public']['Enums']['trip_rsvp_status']
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          queued_at?: string | null
          registered_at?: string | null
          registration_state?: string
          revision?: number
          status: Database['public']['Enums']['trip_rsvp_status']
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          queued_at?: string | null
          registered_at?: string | null
          registration_state?: string
          revision?: number
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
          archived_at: string | null
          capacity: number | null
          cancellation_reason: string | null
          canceled_at: string | null
          canceled_by: string | null
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          description_public: string | null
          difficulty: Database['public']['Enums']['trip_difficulty'] | null
          ends_at: string
          id: string
          is_all_day: boolean
          is_official: boolean
          lifecycle_status: Database['public']['Enums']['trip_lifecycle_status']
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
          archived_at?: string | null
          capacity?: number | null
          cancellation_reason?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description_public?: string | null
          difficulty?: Database['public']['Enums']['trip_difficulty'] | null
          ends_at: string
          id?: string
          is_all_day?: boolean
          is_official?: boolean
          lifecycle_status?: Database['public']['Enums']['trip_lifecycle_status']
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
          archived_at?: string | null
          capacity?: number | null
          cancellation_reason?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description_public?: string | null
          difficulty?: Database['public']['Enums']['trip_difficulty'] | null
          ends_at?: string
          id?: string
          is_all_day?: boolean
          is_official?: boolean
          lifecycle_status?: Database['public']['Enums']['trip_lifecycle_status']
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
      registration_account_merges: {
        Row: {
          merged_at: string
          primary_id: string
          secondary_id: string
        }
        Insert: {
          merged_at?: string
          primary_id: string
          secondary_id: string
        }
        Update: {
          merged_at?: string
          primary_id?: string
          secondary_id?: string
        }
        Relationships: []
      }
      registration_delivery_events: {
        Row: {
          delivery_status: string | null
          id: string
          provider_id: string | null
          received_at: string
        }
        Insert: {
          delivery_status?: string | null
          id: string
          provider_id?: string | null
          received_at?: string
        }
        Update: {
          delivery_status?: string | null
          id?: string
          provider_id?: string | null
          received_at?: string
        }
        Relationships: []
      }
      registration_events: {
        Row: {
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          kind: string
          trip_id: string
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          kind: string
          trip_id: string
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'registration_events_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      registration_guardian_reviews: {
        Row: {
          evidence: string
          reviewed_at: string
          reviewer_id: string
          trip_id: string
          user_id: string
          waiver_id: string | null
        }
        Insert: {
          evidence: string
          reviewed_at?: string
          reviewer_id: string
          trip_id: string
          user_id: string
          waiver_id?: string | null
        }
        Update: {
          evidence?: string
          reviewed_at?: string
          reviewer_id?: string
          trip_id?: string
          user_id?: string
          waiver_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'registration_guardian_reviews_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registration_guardian_reviews_waiver_id_fkey'
            columns: ['waiver_id']
            isOneToOne: false
            referencedRelation: 'registration_waivers'
            referencedColumns: ['id']
          },
        ]
      }
      registration_notifications: {
        Row: {
          attempts: number
          created_at: string
          dedupe_key: string
          error_code: string | null
          event_id: string | null
          id: string
          kind: string
          lease_token: string | null
          leased_until: string | null
          next_attempt_at: string
          provider_id: string | null
          status: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          dedupe_key: string
          error_code?: string | null
          event_id?: string | null
          id?: string
          kind: string
          lease_token?: string | null
          leased_until?: string | null
          next_attempt_at?: string
          provider_id?: string | null
          status?: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          dedupe_key?: string
          error_code?: string | null
          event_id?: string | null
          id?: string
          kind?: string
          lease_token?: string | null
          leased_until?: string | null
          next_attempt_at?: string
          provider_id?: string | null
          status?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_notifications_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'registration_events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registration_notifications_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      registration_offers: {
        Row: {
          expires_at: string
          id: string
          issued_at: string
          issued_by: string
          resolved_at: string | null
          status: string
          trip_id: string
          user_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          issued_at?: string
          issued_by: string
          resolved_at?: string | null
          status?: string
          trip_id: string
          user_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          issued_at?: string
          issued_by?: string
          resolved_at?: string | null
          status?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_offers_trip_id_user_id_fkey'
            columns: ['trip_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'trip_rsvps'
            referencedColumns: ['trip_id', 'user_id']
          },
        ]
      }
      registration_requests: {
        Row: {
          actor_id: string
          created_at: string
          payload: Json
          request_id: string
          trip_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          payload: Json
          request_id: string
          trip_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          payload?: Json
          request_id?: string
          trip_id?: string
        }
        Relationships: []
      }
      registration_responses: {
        Row: {
          answers: Json
          emergency_contact: Json
          form_version: number
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          emergency_contact?: Json
          form_version: number
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          emergency_contact?: Json
          form_version?: number
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_responses_trip_id_user_id_fkey'
            columns: ['trip_id', 'user_id']
            isOneToOne: true
            referencedRelation: 'trip_rsvps'
            referencedColumns: ['trip_id', 'user_id']
          },
        ]
      }
      registration_signatures: {
        Row: {
          id: string
          original_signer_id: string
          signature_name: string
          signed_at: string
          trip_id: string
          user_id: string
          waiver_id: string
        }
        Insert: {
          id?: string
          original_signer_id: string
          signature_name: string
          signed_at?: string
          trip_id: string
          user_id: string
          waiver_id: string
        }
        Update: {
          id?: string
          original_signer_id?: string
          signature_name?: string
          signed_at?: string
          trip_id?: string
          user_id?: string
          waiver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_signatures_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registration_signatures_waiver_id_fkey'
            columns: ['waiver_id']
            isOneToOne: false
            referencedRelation: 'registration_waivers'
            referencedColumns: ['id']
          },
        ]
      }
      registration_waivers: {
        Row: {
          body: string
          created_at: string
          id: string
          title: string
          trip_id: string
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          title: string
          trip_id: string
          version: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          title?: string
          trip_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: 'registration_waivers_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      registration_worker_health: {
        Row: {
          id: boolean
          last_error: string | null
          last_run_at: string | null
          last_success_at: string | null
        }
        Insert: {
          id?: boolean
          last_error?: string | null
          last_run_at?: string | null
          last_success_at?: string | null
        }
        Update: {
          id?: boolean
          last_error?: string | null
          last_run_at?: string | null
          last_success_at?: string | null
        }
        Relationships: []
      }
      trip_registration_settings: {
        Row: {
          eligibility: string
          emergency_required: boolean
          enabled: boolean
          form_version: number
          locked_at: string | null
          offer_hours: number
          questions: Json
          revision: number
          trip_id: string
          waiver_id: string | null
          waiver_required: boolean
        }
        Insert: {
          eligibility?: string
          emergency_required?: boolean
          enabled?: boolean
          form_version?: number
          locked_at?: string | null
          offer_hours?: number
          questions?: Json
          revision?: number
          trip_id: string
          waiver_id?: string | null
          waiver_required?: boolean
        }
        Update: {
          eligibility?: string
          emergency_required?: boolean
          enabled?: boolean
          form_version?: number
          locked_at?: string | null
          offer_hours?: number
          questions?: Json
          revision?: number
          trip_id?: string
          waiver_id?: string | null
          waiver_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'trip_registration_settings_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: true
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trip_registration_settings_waiver_id_fkey'
            columns: ['waiver_id']
            isOneToOne: false
            referencedRelation: 'registration_waivers'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      registration_maintenance: { Args: never; Returns: undefined }
      registration_operations: { Args: never; Returns: Json }
      get_my_registrations: { Args: never; Returns: Json }
      get_my_registration_signatures: { Args: never; Returns: Json }
      get_trip_guardian_requests: { Args: never; Returns: Json }

      merge_trip_registrations: {
        Args: { p_primary: string; p_secondary: string }
        Returns: undefined
      }

      declare_my_age_18_or_older: { Args: never; Returns: undefined }
      activate_confirmed_zelle_membership: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      admin_list_accounts: {
        Args: {
          p_actor_user_id: string
          p_mailing?: string | null
          p_membership_state?: string | null
          p_needs_attention?: boolean
          p_page?: number
          p_page_size?: number
          p_restriction?: string | null
          p_role_name?: string | null
          p_search?: string | null
        }
        Returns: {
          deletion_error: string | null
          deletion_status: string | null
          display_name: string | null
          email: string | null
          leadership_roles: string[]
          mailing_subscribed: boolean
          membership_role: string | null
          membership_state: string
          restriction: string
          total_count: number
          user_id: string
        }[]
      }
      admin_capability_scope: {
        Args: { p_capability_key: string; p_uid: string }
        Returns: Database['public']['Enums']['admin_permission_scope'] | null
      }
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
      claim_zelle_membership_payment: { Args: never; Returns: string }
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
      grant_complimentary_membership_access: {
        Args: {
          p_actor_user_id: string
          p_days: number
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      has_membership_access: { Args: { p_uid: string }; Returns: boolean }
      has_admin_capability: {
        Args: { p_capability_key: string; p_uid: string }
        Returns: boolean
      }
      has_trip_admin_capability: {
        Args: { p_capability_key: string; p_trip_id: string; p_uid: string }
        Returns: boolean
      }
      has_provisional_membership_access: { Args: never; Returns: boolean }
      is_active_member: { Args: { p_uid: string }; Returns: boolean }
      is_banned: { Args: { p_uid: string }; Returns: boolean }
      is_staff_or_admin: { Args: { p_uid: string }; Returns: boolean }
      is_super_admin: { Args: { p_uid: string }; Returns: boolean }
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
      record_admin_activity: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_after_data?: Json | null
          p_before_data?: Json | null
          p_resource_id: string | null
          p_resource_type: string
          p_result?: string
          p_subject_user_id: string | null
          p_summary: string
        }
        Returns: string
      }
      review_zelle_membership_payment: {
        Args: {
          p_decision: string
          p_note?: string | null
          p_payment_id: string
          p_reviewer_id: string
        }
        Returns: boolean
      }
      reverse_zelle_membership_payment: {
        Args: {
          p_payment_id: string
          p_reason: string
          p_reviewer_id: string
        }
        Returns: boolean
      }
      set_mailing_list_subscription: {
        Args: { p_email: string; p_source?: string; p_subscribed: boolean }
        Returns: undefined
      }
      set_admin_account_restriction: {
        Args: {
          p_actor_user_id: string
          p_reason?: string | null
          p_restriction: Database['public']['Enums']['membership_restriction']
          p_user_id: string
        }
        Returns: undefined
      }
      set_zelle_membership_payment_status: {
        Args: {
          p_desired_status: string
          p_note?: string | null
          p_reviewer_id: string
          p_user_id: string
        }
        Returns: string
      }
      grant_application_complimentary_membership: {
        Args: {
          p_actor_user_id: string
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      set_super_admin_assignment: {
        Args: {
          p_actor_user_id: string
          p_assign: boolean
          p_target_user_id: string
        }
        Returns: undefined
      }
      try_uuid: { Args: { p: string }; Returns: string }
      claim_registration_notifications: {
        Args: { p_limit?: number }
        Returns: Json
      }
      declare_registration_age: {
        Args: { p_adult: boolean }
        Returns: undefined
      }
      finish_registration_notification: {
        Args: {
          p_error: string
          p_id: string
          p_lease: string
          p_provider_id: string
          p_retry: boolean
        }
        Returns: undefined
      }
      get_registration_summaries: {
        Args: { p_trip_ids: string[] }
        Returns: Json
      }
      prepare_registration_notification: {
        Args: { p_id: string; p_lease: string }
        Returns: Json
      }
      registration_command: {
        Args: {
          p_command: string
          p_data?: Json
          p_expected_revision: number
          p_request_id: string
          p_trip_id: string
          p_user_id?: string
        }
        Returns: Json
      }
      registration_delivery: {
        Args: { p_event_id: string; p_provider_id: string; p_status: string }
        Returns: undefined
      }
      registration_worker_result: {
        Args: { p_error?: string }
        Returns: undefined
      }
      save_registration_settings: {
        Args: { p_data: Json; p_revision: number; p_trip_id: string }
        Returns: Json
      }
      set_registration_enabled: {
        Args: { p_enabled: boolean }
        Returns: undefined
      }
    }
    Enums: {
      admin_permission_scope: 'assigned' | 'all'
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
      trip_lifecycle_status: 'published' | 'canceled' | 'archived'
      trip_rsvp_status:
        | 'going'
        | 'maybe'
        | 'not_going'
        | 'invited'
        | 'removed'
        | 'waitlisted'
      trip_visibility: 'public' | 'members' | 'minimal'
      webhook_processing_status: 'processing' | 'succeeded' | 'failed'
      zelle_payment_status: 'claimed' | 'confirmed' | 'rejected' | 'reversed'
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
      admin_permission_scope: ['assigned', 'all'],
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
      trip_lifecycle_status: ['published', 'canceled', 'archived'],
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
      zelle_payment_status: ['claimed', 'confirmed', 'rejected', 'reversed'],
    },
  },
} as const
