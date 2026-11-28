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
      account_merge_jobs: {
        Row: {
          actor_user_id: string
          completed_at: string | null
          counts: Json
          created_at: string
          primary_user_id: string
          secondary_snapshot: Json
          secondary_user_id: string
          status: string
        }
        Insert: {
          actor_user_id: string
          completed_at?: string | null
          counts: Json
          created_at?: string
          primary_user_id: string
          secondary_snapshot: Json
          secondary_user_id: string
          status?: string
        }
        Update: {
          actor_user_id?: string
          completed_at?: string | null
          counts?: Json
          created_at?: string
          primary_user_id?: string
          secondary_snapshot?: Json
          secondary_user_id?: string
          status?: string
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
        Relationships: [
          {
            foreignKeyName: 'admin_role_grants_capability_key_fkey'
            columns: ['capability_key']
            isOneToOne: false
            referencedRelation: 'admin_capabilities'
            referencedColumns: ['key']
          },
          {
            foreignKeyName: 'admin_role_grants_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'admin_roles'
            referencedColumns: ['id']
          },
        ]
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
      announcements: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          created_by: string | null
          description: string
          ends_at: string
          id: string
          slug: string
          starts_at: string
          status: string
          subtitle: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_name?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at: string
          id?: string
          slug: string
          starts_at: string
          status?: string
          subtitle?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string
          id?: string
          slug?: string
          starts_at?: string
          status?: string
          subtitle?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
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
      club_hosts: {
        Row: {
          club_title: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          linked_user_id: string | null
          public_name: string
          role_key: string | null
          updated_at: string
        }
        Insert: {
          club_title: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          linked_user_id?: string | null
          public_name: string
          role_key?: string | null
          updated_at?: string
        }
        Update: {
          club_title?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          linked_user_id?: string | null
          public_name?: string
          role_key?: string | null
          updated_at?: string
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
      guardian_consents: {
        Row: {
          contact_id: string
          document_body: string
          document_version: number
          evidence: Json
          id: string
          kind: string
          participant_id: string
          request_id: string
          signature_name: string
          signed_at: string
        }
        Insert: {
          contact_id: string
          document_body: string
          document_version: number
          evidence: Json
          id?: string
          kind: string
          participant_id: string
          request_id: string
          signature_name: string
          signed_at?: string
        }
        Update: {
          contact_id?: string
          document_body?: string
          document_version?: number
          evidence?: Json
          id?: string
          kind?: string
          participant_id?: string
          request_id?: string
          signature_name?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'guardian_consents_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'guardian_contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'guardian_consents_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'guardian_requests'
            referencedColumns: ['id']
          },
        ]
      }
      guardian_contacts: {
        Row: {
          created_at: string
          created_by: string
          email: string
          email_verified_at: string | null
          full_name: string
          id: string
          officer_verified_at: string | null
          officer_verified_by: string | null
          participant_id: string
          phone: string | null
          relationship: string
          superseded_at: string | null
          superseded_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          email_verified_at?: string | null
          full_name: string
          id?: string
          officer_verified_at?: string | null
          officer_verified_by?: string | null
          participant_id: string
          phone?: string | null
          relationship: string
          superseded_at?: string | null
          superseded_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          email_verified_at?: string | null
          full_name?: string
          id?: string
          officer_verified_at?: string | null
          officer_verified_by?: string | null
          participant_id?: string
          phone?: string | null
          relationship?: string
          superseded_at?: string | null
          superseded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'guardian_contacts_superseded_by_fkey'
            columns: ['superseded_by']
            isOneToOne: false
            referencedRelation: 'guardian_contacts'
            referencedColumns: ['id']
          },
        ]
      }
      guardian_email_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          request_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          request_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          request_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'guardian_email_codes_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'guardian_requests'
            referencedColumns: ['id']
          },
        ]
      }
      guardian_request_tokens: {
        Row: {
          created_at: string
          delivery: string
          expires_at: string
          invited_contact_id: string | null
          request_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          delivery: string
          expires_at: string
          invited_contact_id?: string | null
          request_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          delivery?: string
          expires_at?: string
          invited_contact_id?: string | null
          request_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: 'guardian_request_tokens_invited_contact_id_fkey'
            columns: ['invited_contact_id']
            isOneToOne: false
            referencedRelation: 'guardian_contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'guardian_request_tokens_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'guardian_requests'
            referencedColumns: ['id']
          },
        ]
      }
      guardian_requests: {
        Row: {
          completed_at: string | null
          consent_id: string | null
          contact_id: string | null
          created_at: string
          decline_reason: string | null
          id: string
          invite_count: number
          invite_sent_at: string | null
          needs_membership: boolean
          participant_id: string
          signature_id: string | null
          signed_contact_id: string | null
          special_arrangement: boolean
          status: string
          trip_id: string | null
          waiver_id: string | null
        }
        Insert: {
          completed_at?: string | null
          consent_id?: string | null
          contact_id?: string | null
          created_at?: string
          decline_reason?: string | null
          id?: string
          invite_count?: number
          invite_sent_at?: string | null
          needs_membership: boolean
          participant_id: string
          signature_id?: string | null
          signed_contact_id?: string | null
          special_arrangement?: boolean
          status?: string
          trip_id?: string | null
          waiver_id?: string | null
        }
        Update: {
          completed_at?: string | null
          consent_id?: string | null
          contact_id?: string | null
          created_at?: string
          decline_reason?: string | null
          id?: string
          invite_count?: number
          invite_sent_at?: string | null
          needs_membership?: boolean
          participant_id?: string
          signature_id?: string | null
          signed_contact_id?: string | null
          special_arrangement?: boolean
          status?: string
          trip_id?: string | null
          waiver_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'guardian_request_consent'
            columns: ['consent_id']
            isOneToOne: false
            referencedRelation: 'guardian_consents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'guardian_requests_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'guardian_contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'guardian_requests_signature_id_fkey'
            columns: ['signature_id']
            isOneToOne: false
            referencedRelation: 'registration_signatures'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'guardian_requests_signed_contact_id_fkey'
            columns: ['signed_contact_id']
            isOneToOne: false
            referencedRelation: 'guardian_contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'guardian_requests_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'guardian_requests_waiver_id_fkey'
            columns: ['waiver_id']
            isOneToOne: false
            referencedRelation: 'registration_waivers'
            referencedColumns: ['id']
          },
        ]
      }
      guardian_reviews: {
        Row: {
          basis: string
          created_at: string
          decision: string
          id: string
          identity_checked: boolean
          reason: string | null
          request_id: string
          reviewer_id: string | null
        }
        Insert: {
          basis: string
          created_at?: string
          decision: string
          id?: string
          identity_checked?: boolean
          reason?: string | null
          request_id: string
          reviewer_id?: string | null
        }
        Update: {
          basis?: string
          created_at?: string
          decision?: string
          id?: string
          identity_checked?: boolean
          reason?: string | null
          request_id?: string
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'guardian_reviews_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'guardian_requests'
            referencedColumns: ['id']
          },
        ]
      }
      guardian_sessions: {
        Row: {
          code_id: string
          created_at: string
          email: string
          expires_at: string
          request_id: string
          session_hash: string
        }
        Insert: {
          code_id: string
          created_at?: string
          email: string
          expires_at: string
          request_id: string
          session_hash: string
        }
        Update: {
          code_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          request_id?: string
          session_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: 'guardian_sessions_code_id_fkey'
            columns: ['code_id']
            isOneToOne: false
            referencedRelation: 'guardian_email_codes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'guardian_sessions_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'guardian_requests'
            referencedColumns: ['id']
          },
        ]
      }
      guardian_withdrawals: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          contact_id: string
          created_at: string
          id: string
          note: string | null
          participant_id: string
          request_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          contact_id: string
          created_at?: string
          id?: string
          note?: string | null
          participant_id: string
          request_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          note?: string | null
          participant_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'guardian_withdrawals_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'guardian_contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'guardian_withdrawals_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'guardian_requests'
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
          signup_completed_at: string | null
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
          signup_completed_at?: string | null
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
          signup_completed_at?: string | null
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
          {
            foreignKeyName: 'membership_entitlements_zelle_payment_id_fkey'
            columns: ['zelle_payment_id']
            isOneToOne: true
            referencedRelation: 'membership_zelle_payments'
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
      profile_email_consent_events: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
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
      registration_annual_guardian_requests: {
        Row: {
          requested_at: string
          user_id: string
          waiver_id: string
        }
        Insert: {
          requested_at?: string
          user_id: string
          waiver_id: string
        }
        Update: {
          requested_at?: string
          user_id?: string
          waiver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_annual_guardian_requests_waiver_id_fkey'
            columns: ['waiver_id']
            isOneToOne: false
            referencedRelation: 'registration_waivers'
            referencedColumns: ['id']
          },
        ]
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
      registration_guardian_evidence: {
        Row: {
          document_details: Json
          evidence: string
          id: string
          reviewed_at: string
          reviewer_id: string
          trip_id: string
          user_id: string
          waiver_id: string | null
        }
        Insert: {
          document_details: Json
          evidence: string
          id?: string
          reviewed_at?: string
          reviewer_id: string
          trip_id: string
          user_id: string
          waiver_id?: string | null
        }
        Update: {
          document_details?: Json
          evidence?: string
          id?: string
          reviewed_at?: string
          reviewer_id?: string
          trip_id?: string
          user_id?: string
          waiver_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'registration_guardian_evidence_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registration_guardian_evidence_waiver_id_fkey'
            columns: ['waiver_id']
            isOneToOne: false
            referencedRelation: 'registration_waivers'
            referencedColumns: ['id']
          },
        ]
      }
      registration_guardian_reviews: {
        Row: {
          document_details: Json
          evidence: string
          reviewed_at: string
          reviewer_id: string
          trip_id: string
          user_id: string
          waiver_id: string | null
        }
        Insert: {
          document_details?: Json
          evidence: string
          reviewed_at?: string
          reviewer_id: string
          trip_id: string
          user_id: string
          waiver_id?: string | null
        }
        Update: {
          document_details?: Json
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
          show_in_attendee_list: boolean
          transportation: Json | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          emergency_contact?: Json
          form_version: number
          show_in_attendee_list?: boolean
          transportation?: Json | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          emergency_contact?: Json
          form_version?: number
          show_in_attendee_list?: boolean
          transportation?: Json | null
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
      registration_risk_acknowledgements: {
        Row: {
          acknowledged_at: string
          disclosure_id: string
          id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          disclosure_id: string
          id?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          disclosure_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_risk_acknowledgements_disclosure_id_fkey'
            columns: ['disclosure_id']
            isOneToOne: false
            referencedRelation: 'registration_risk_disclosures'
            referencedColumns: ['id']
          },
        ]
      }
      registration_risk_disclosures: {
        Row: {
          activity_scope: string[]
          created_at: string
          created_by: string
          id: string
          revision: number
          statements: string[]
          trip_id: string
        }
        Insert: {
          activity_scope: string[]
          created_at?: string
          created_by: string
          id?: string
          revision: number
          statements: string[]
          trip_id: string
        }
        Update: {
          activity_scope?: string[]
          created_at?: string
          created_by?: string
          id?: string
          revision?: number
          statements?: string[]
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_risk_disclosures_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      registration_signatures: {
        Row: {
          id: string
          original_signer_id: string
          signature_name: string
          signed_at: string
          signer_details: Json
          signer_kind: string
          trip_id: string | null
          user_id: string
          valid_from: string | null
          valid_until: string | null
          waiver_id: string
        }
        Insert: {
          id?: string
          original_signer_id: string
          signature_name: string
          signed_at?: string
          signer_details?: Json
          signer_kind?: string
          trip_id?: string | null
          user_id: string
          valid_from?: string | null
          valid_until?: string | null
          waiver_id: string
        }
        Update: {
          id?: string
          original_signer_id?: string
          signature_name?: string
          signed_at?: string
          signer_details?: Json
          signer_kind?: string
          trip_id?: string | null
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
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
      registration_waiver_publications: {
        Row: {
          published_at: string
          published_by: string
          review_reference: string
          waiver_id: string
        }
        Insert: {
          published_at?: string
          published_by: string
          review_reference: string
          waiver_id: string
        }
        Update: {
          published_at?: string
          published_by?: string
          review_reference?: string
          waiver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_waiver_publications_waiver_id_fkey'
            columns: ['waiver_id']
            isOneToOne: true
            referencedRelation: 'registration_waivers'
            referencedColumns: ['id']
          },
        ]
      }
      registration_waiver_requests: {
        Row: {
          actor_id: string
          payload: Json
          request_id: string
          signature_id: string | null
        }
        Insert: {
          actor_id: string
          payload: Json
          request_id: string
          signature_id?: string | null
        }
        Update: {
          actor_id?: string
          payload?: Json
          request_id?: string
          signature_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'registration_waiver_requests_signature_id_fkey'
            columns: ['signature_id']
            isOneToOne: false
            referencedRelation: 'registration_signatures'
            referencedColumns: ['id']
          },
        ]
      }
      registration_waiver_withdrawals: {
        Row: {
          signature_id: string
          withdrawn_at: string
          withdrawn_by: string
        }
        Insert: {
          signature_id: string
          withdrawn_at?: string
          withdrawn_by: string
        }
        Update: {
          signature_id?: string
          withdrawn_at?: string
          withdrawn_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_waiver_withdrawals_signature_id_fkey'
            columns: ['signature_id']
            isOneToOne: true
            referencedRelation: 'registration_signatures'
            referencedColumns: ['id']
          },
        ]
      }
      registration_waivers: {
        Row: {
          activity_scope: string[] | null
          body: string
          created_at: string
          effective_from: string | null
          effective_until: string | null
          filled_values: Json | null
          id: string
          source_url: string | null
          title: string
          trip_id: string | null
          version: number
        }
        Insert: {
          activity_scope?: string[] | null
          body: string
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          filled_values?: Json | null
          id?: string
          source_url?: string | null
          title: string
          trip_id?: string | null
          version: number
        }
        Update: {
          activity_scope?: string[] | null
          body?: string
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          filled_values?: Json | null
          id?: string
          source_url?: string | null
          title?: string
          trip_id?: string | null
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
          collect_transportation: boolean
          created_at: string
          created_by: string
          difficulty: Database['public']['Enums']['trip_difficulty'] | null
          elevation_ft: number | null
          ends_at: string | null
          event_kind: string
          id: string
          informed_risks: string
          is_official: boolean
          leader_user_ids: string[]
          location_notes: string | null
          max_participants: number | null
          meeting_location_name: string | null
          no_end_time: boolean
          overview_carpool_need_gear: string | null
          overview_equipment: string | null
          overview_weather: string | null
          overview_what: string | null
          overview_where: string | null
          primary_location_name: string | null
          public_host_ids: string[]
          registration_enabled: boolean
          registration_opens_at: string | null
          rsvp_deadline: string | null
          short_summary: string | null
          starts_at: string | null
          time_zone: string | null
          title: string | null
          updated_at: string
          visibility: Database['public']['Enums']['trip_visibility']
          waitlist_enabled: boolean
          waiver_activities: string[]
        }
        Insert: {
          activity_tags?: string[]
          collect_transportation?: boolean
          created_at?: string
          created_by: string
          difficulty?: Database['public']['Enums']['trip_difficulty'] | null
          elevation_ft?: number | null
          ends_at?: string | null
          event_kind?: string
          id?: string
          informed_risks?: string
          is_official?: boolean
          leader_user_ids?: string[]
          location_notes?: string | null
          max_participants?: number | null
          meeting_location_name?: string | null
          no_end_time?: boolean
          overview_carpool_need_gear?: string | null
          overview_equipment?: string | null
          overview_weather?: string | null
          overview_what?: string | null
          overview_where?: string | null
          primary_location_name?: string | null
          public_host_ids?: string[]
          registration_enabled?: boolean
          registration_opens_at?: string | null
          rsvp_deadline?: string | null
          short_summary?: string | null
          starts_at?: string | null
          time_zone?: string | null
          title?: string | null
          updated_at?: string
          visibility?: Database['public']['Enums']['trip_visibility']
          waitlist_enabled?: boolean
          waiver_activities?: string[]
        }
        Update: {
          activity_tags?: string[]
          collect_transportation?: boolean
          created_at?: string
          created_by?: string
          difficulty?: Database['public']['Enums']['trip_difficulty'] | null
          elevation_ft?: number | null
          ends_at?: string | null
          event_kind?: string
          id?: string
          informed_risks?: string
          is_official?: boolean
          leader_user_ids?: string[]
          location_notes?: string | null
          max_participants?: number | null
          meeting_location_name?: string | null
          no_end_time?: boolean
          overview_carpool_need_gear?: string | null
          overview_equipment?: string | null
          overview_weather?: string | null
          overview_what?: string | null
          overview_where?: string | null
          primary_location_name?: string | null
          public_host_ids?: string[]
          registration_enabled?: boolean
          registration_opens_at?: string | null
          rsvp_deadline?: string | null
          short_summary?: string | null
          starts_at?: string | null
          time_zone?: string | null
          title?: string | null
          updated_at?: string
          visibility?: Database['public']['Enums']['trip_visibility']
          waitlist_enabled?: boolean
          waiver_activities?: string[]
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
      trip_registration_settings: {
        Row: {
          annual_waiver: boolean
          collect_transportation: boolean
          eligibility: string
          emergency_required: boolean
          enabled: boolean
          form_version: number
          locked_at: string | null
          offer_hours: number
          questions: Json
          revision: number
          risk_disclosure_id: string | null
          trip_id: string
          waiver_id: string | null
          waiver_required: boolean
        }
        Insert: {
          annual_waiver?: boolean
          collect_transportation?: boolean
          eligibility?: string
          emergency_required?: boolean
          enabled?: boolean
          form_version?: number
          locked_at?: string | null
          offer_hours?: number
          questions?: Json
          revision?: number
          risk_disclosure_id?: string | null
          trip_id: string
          waiver_id?: string | null
          waiver_required?: boolean
        }
        Update: {
          annual_waiver?: boolean
          collect_transportation?: boolean
          eligibility?: string
          emergency_required?: boolean
          enabled?: boolean
          form_version?: number
          locked_at?: string | null
          offer_hours?: number
          questions?: Json
          revision?: number
          risk_disclosure_id?: string | null
          trip_id?: string
          waiver_id?: string | null
          waiver_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'trip_registration_settings_risk_disclosure_id_fkey'
            columns: ['risk_disclosure_id']
            isOneToOne: false
            referencedRelation: 'registration_risk_disclosures'
            referencedColumns: ['id']
          },
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
      trip_update_followers: {
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
            foreignKeyName: 'trip_update_followers_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
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
          canceled_at: string | null
          canceled_by: string | null
          cancellation_reason: string | null
          capacity: number | null
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          description_public: string | null
          difficulty: Database['public']['Enums']['trip_difficulty'] | null
          elevation_ft: number | null
          ends_at: string | null
          event_kind: string
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
          registration_open_announced_at: string | null
          registration_opens_at: string | null
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
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          capacity?: number | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description_public?: string | null
          difficulty?: Database['public']['Enums']['trip_difficulty'] | null
          elevation_ft?: number | null
          ends_at?: string | null
          event_kind?: string
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
          registration_open_announced_at?: string | null
          registration_opens_at?: string | null
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
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          capacity?: number | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description_public?: string | null
          difficulty?: Database['public']['Enums']['trip_difficulty'] | null
          elevation_ft?: number | null
          ends_at?: string | null
          event_kind?: string
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
          registration_open_announced_at?: string | null
          registration_opens_at?: string | null
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
          show_in_attendee_lists: boolean
          trip_email_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          show_in_attendee_lists?: boolean
          trip_email_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          show_in_attendee_lists?: boolean
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
      acknowledge_guardian_withdrawal: {
        Args: { p_withdrawal: string }
        Returns: undefined
      }
      activate_confirmed_zelle_membership: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      admin_capability_scope: {
        Args: { p_capability_key: string; p_uid: string }
        Returns: Database['public']['Enums']['admin_permission_scope']
      }
      admin_list_accounts: {
        Args: {
          p_actor_user_id: string
          p_mailing?: string
          p_membership_state?: string
          p_needs_attention?: boolean
          p_page?: number
          p_page_size?: number
          p_restriction?: string
          p_role_name?: string
          p_search?: string
        }
        Returns: {
          deletion_error: string
          deletion_status: string
          display_name: string
          email: string
          leadership_roles: string[]
          mailing_subscribed: boolean
          membership_role: string
          membership_state: string
          restriction: string
          total_count: number
          user_id: string
        }[]
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
      can_view_trip_readonly: { Args: { p_trip_id: string }; Returns: boolean }
      claim_guardian_notifications: { Args: never; Returns: Json }
      claim_registration_notifications: {
        Args: { p_limit?: number }
        Returns: Json
      }
      claim_zelle_membership_payment: { Args: never; Returns: string }
      complete_account_merge: {
        Args: { p_actor: string; p_primary: string; p_secondary: string }
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
      create_annual_waiver: { Args: { p_fields: Json }; Returns: string }
      declare_my_age_18_or_older: { Args: never; Returns: undefined }
      declare_registration_age: {
        Args: { p_adult: boolean }
        Returns: undefined
      }
      export_club_email_recipients: {
        Args: { p_topic?: string }
        Returns: Json
      }
      finish_guardian_notification: {
        Args: {
          p_error: string
          p_id: string
          p_lease: string
          p_provider_id: string
          p_retry: boolean
        }
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
      get_active_announcement: {
        Args: never
        Returns: {
          author_name: string | null
          content: string
          created_at: string
          created_by: string | null
          description: string
          ends_at: string
          id: string
          slug: string
          starts_at: string
          status: string
          subtitle: string
          title: string
          updated_at: string
          updated_by: string | null
        }[]
        SetofOptions: {
          from: '*'
          to: 'announcements'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_admin_analytics_totals: {
        Args: { p_range_start?: string }
        Returns: Json
      }
      get_admin_membership_queue: {
        Args: { p_page?: number; p_tab: string }
        Returns: Json
      }
      get_admin_overview_totals: { Args: never; Returns: Json }
      get_annual_guardian_requests: { Args: never; Returns: Json }
      get_annual_waiver_configuration: { Args: never; Returns: Json }
      get_annual_waivers: { Args: never; Returns: Json }
      get_guardian_review_queue: { Args: never; Returns: Json }
      get_my_admin_capability_scopes: { Args: never; Returns: Json }
      get_my_email_preferences: { Args: never; Returns: Json }
      get_my_guardian_status: { Args: { p_trip?: string }; Returns: Json }
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
      get_my_registration_signatures: { Args: never; Returns: Json }
      get_my_registrations: { Args: never; Returns: Json }
      get_published_trip_for_draft: {
        Args: { p_draft_id: string }
        Returns: string
      }
      get_registration_roster: { Args: { p_trip_id: string }; Returns: Json }
      get_registration_summaries: {
        Args: { p_trip_ids: string[] }
        Returns: Json
      }
      get_trip_guardian_requests: { Args: never; Returns: Json }
      get_trip_registration: { Args: { p_trip_id: string }; Returns: Json }
      grant_application_complimentary_membership: {
        Args: { p_actor_user_id: string; p_reason: string; p_user_id: string }
        Returns: string
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
      guardian_cancel_request: { Args: never; Returns: undefined }
      guardian_decline: {
        Args: { p_reason: string; p_token_hash: string }
        Returns: Json
      }
      guardian_designate: { Args: { p_guardian: Json }; Returns: undefined }
      guardian_get_request: {
        Args: { p_session_hash?: string; p_token_hash: string }
        Returns: Json
      }
      guardian_open_request: {
        Args: { p_delivery: string; p_token_hash: string; p_trip?: string }
        Returns: Json
      }
      guardian_prepare_invite: {
        Args: { p_guardian: Json; p_token_hash: string; p_trip?: string }
        Returns: Json
      }
      guardian_queue_record_copy: { Args: never; Returns: boolean }
      guardian_sign: {
        Args: {
          p_data: Json
          p_record_token_hash: string
          p_session_hash: string
          p_token_hash: string
        }
        Returns: Json
      }
      guardian_signed_copy: {
        Args: { p_session_hash: string; p_token_hash: string }
        Returns: Json
      }
      guardian_start_verification: {
        Args: { p_code_hash: string; p_email: string; p_token_hash: string }
        Returns: Json
      }
      guardian_update_contact_phone: {
        Args: { p_phone: string }
        Returns: undefined
      }
      guardian_verify_code: {
        Args: {
          p_code_hash: string
          p_session_hash: string
          p_token_hash: string
        }
        Returns: Json
      }
      guardian_withdraw: {
        Args: { p_note: string; p_session_hash: string; p_token_hash: string }
        Returns: Json
      }
      handoff_schema_ready: { Args: never; Returns: boolean }
      has_admin_capability: {
        Args: { p_capability_key: string; p_uid: string }
        Returns: boolean
      }
      has_membership_access: { Args: { p_uid: string }; Returns: boolean }
      has_provisional_membership_access: { Args: never; Returns: boolean }
      has_trip_admin_capability: {
        Args: { p_capability_key: string; p_trip_id: string; p_uid: string }
        Returns: boolean
      }
      is_active_member: { Args: { p_uid: string }; Returns: boolean }
      is_banned: { Args: { p_uid: string }; Returns: boolean }
      is_super_admin: { Args: { p_uid: string }; Returns: boolean }
      membership_activation_ineligibility: {
        Args: { p_user_id: string }
        Returns: string
      }
      merge_accounts: {
        Args: {
          p_actor: string
          p_dry_run?: boolean
          p_primary: string
          p_secondary: string
        }
        Returns: Json
      }
      merge_trip_registrations: {
        Args: { p_primary: string; p_secondary: string }
        Returns: undefined
      }
      prepare_guardian_notification: {
        Args: { p_id: string; p_lease: string; p_record_hash: string }
        Returns: Json
      }
      prepare_registration_notification: {
        Args: { p_id: string; p_lease: string }
        Returns: Json
      }
      process_membership_checkout_event: {
        Args: {
          p_amount_cents: number
          p_attempt_id: string
          p_checkout_session_id: string
          p_currency: string
          p_customer_id: string
          p_event_id: string
          p_event_type: string
          p_paid_at: string
          p_payment_intent_id: string
          p_receipt_url: string
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
      publish_annual_waiver: {
        Args: { p_review_reference: string; p_waiver: string }
        Returns: undefined
      }
      publish_trip_draft: {
        Args: {
          p_collect_transportation: boolean
          p_data: Json
          p_draft_id: string
          p_leader_user_ids: string[]
          p_meetup_point: string
          p_public_host_ids: string[]
          p_registration_enabled: boolean
          p_risk_statements: string[]
          p_waiver_activities: string[]
        }
        Returns: string
      }
      record_admin_activity: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_after_data?: Json
          p_before_data?: Json
          p_resource_id: string
          p_resource_type: string
          p_result?: string
          p_subject_user_id: string
          p_summary: string
        }
        Returns: string
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
      registration_maintenance: { Args: never; Returns: undefined }
      registration_operations: { Args: never; Returns: Json }
      registration_worker_result: {
        Args: { p_error?: string }
        Returns: undefined
      }
      request_annual_guardian_review: {
        Args: { p_waiver: string }
        Returns: undefined
      }
      reverse_zelle_membership_payment: {
        Args: { p_payment_id: string; p_reason: string; p_reviewer_id: string }
        Returns: boolean
      }
      review_guardian_request: {
        Args: {
          p_decision: string
          p_identity_checked: boolean
          p_reason: string
          p_request: string
        }
        Returns: Json
      }
      review_zelle_membership_payment: {
        Args: {
          p_decision: string
          p_note?: string
          p_payment_id: string
          p_reviewer_id: string
        }
        Returns: boolean
      }
      save_privacy_email_preferences: {
        Args: { p_expected: Json; p_preferences: Json; p_privacy: Json }
        Returns: Json
      }
      save_registration_settings: {
        Args: { p_data: Json; p_revision: number; p_trip_id: string }
        Returns: Json
      }
      save_trip_detail_edits: {
        Args: {
          p_data: Json
          p_leader_user_ids?: string[]
          p_meetup_point: string
          p_public_host_ids?: string[]
          p_trip_id: string
        }
        Returns: string
      }
      save_trip_informed_risks: {
        Args: {
          p_activities: string[]
          p_revision: number
          p_statements: string[]
          p_trip: string
        }
        Returns: string
      }
      set_admin_account_restriction: {
        Args: {
          p_actor_user_id: string
          p_reason?: string
          p_restriction: Database['public']['Enums']['membership_restriction']
          p_user_id: string
        }
        Returns: undefined
      }
      set_mailing_list_subscription: {
        Args: { p_email: string; p_source?: string; p_subscribed: boolean }
        Returns: undefined
      }
      set_registration_enabled: {
        Args: { p_enabled: boolean }
        Returns: undefined
      }
      set_super_admin_assignment: {
        Args: {
          p_actor_user_id: string
          p_assign: boolean
          p_target_user_id: string
        }
        Returns: undefined
      }
      set_trip_transportation_collection: {
        Args: { p_enabled: boolean; p_trip_id: string }
        Returns: undefined
      }
      set_trip_update_following: {
        Args: { p_following: boolean; p_trip_id: string }
        Returns: boolean
      }
      set_zelle_membership_payment_status: {
        Args: {
          p_desired_status: string
          p_note?: string
          p_reviewer_id: string
          p_user_id: string
        }
        Returns: string
      }
      sign_annual_waiver: {
        Args: { p_data: Json; p_request: string; p_waiver: string }
        Returns: string
      }
      submit_membership_signup: {
        Args: {
          p_age_status: Database['public']['Enums']['membership_age_status']
          p_contact_email: string
          p_dues_payment_claimed: boolean
          p_experience_notes: string
          p_full_name: string
          p_mailing_list_opt_in: boolean
          p_primary_interest: string
          p_user_id: string
        }
        Returns: string
      }
      try_uuid: { Args: { p: string }; Returns: string }
      verify_annual_guardian: {
        Args: { p_data: Json; p_user: string; p_waiver: string }
        Returns: string
      }
      withdraw_annual_waiver: {
        Args: { p_signature: string }
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
      trip_visibility: 'public' | 'members' | 'minimal' | 'leaders'
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
      trip_visibility: ['public', 'members', 'minimal', 'leaders'],
      webhook_processing_status: ['processing', 'succeeded', 'failed'],
      zelle_payment_status: ['claimed', 'confirmed', 'rejected', 'reversed'],
    },
  },
} as const
