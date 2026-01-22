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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          club_id: string | null
          id: string
          name: string
        }
        Insert: {
          club_id?: string | null
          id?: string
          name: string
        }
        Update: {
          club_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          created_at: string
          display_name: string | null
          email: string | null
          email_verified_at: string | null
          emergency_contact: Json | null
          first_name: string | null
          gear_profile: Json | null
          id: string
          interests_preferences: Json | null
          last_name: string | null
          notification_settings: Json | null
          phone: string | null
          phone_verified_at: string | null
          privacy_settings: Json | null
          pronouns: string | null
          skills_certs: Json | null
          timezone: string | null
          travel_profile: Json | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          emergency_contact?: Json | null
          first_name?: string | null
          gear_profile?: Json | null
          id?: string
          interests_preferences?: Json | null
          last_name?: string | null
          notification_settings?: Json | null
          phone?: string | null
          phone_verified_at?: string | null
          privacy_settings?: Json | null
          pronouns?: string | null
          skills_certs?: Json | null
          timezone?: string | null
          travel_profile?: Json | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          emergency_contact?: Json | null
          first_name?: string | null
          gear_profile?: Json | null
          id?: string
          interests_preferences?: Json | null
          last_name?: string | null
          notification_settings?: Json | null
          phone?: string | null
          phone_verified_at?: string | null
          privacy_settings?: Json | null
          pronouns?: string | null
          skills_certs?: Json | null
          timezone?: string | null
          travel_profile?: Json | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_membership_id: string | null
          club_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_membership_id?: string | null
          club_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_membership_id?: string | null
          club_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_membership_id_fkey"
            columns: ["actor_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_actor_membership_id_fkey"
            columns: ["actor_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "audit_log_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          club_id: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          club_id?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          club_id?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          created_at: string
          id: string
          membership_id: string
          processor: string
          processor_customer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          membership_id: string
          processor: string
          processor_customer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          membership_id?: string
          processor?: string
          processor_customer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_customers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      billing_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          customer_id: string | null
          disputed_at: string | null
          failure_reason: string | null
          id: string
          membership_id: string
          metadata: Json
          paid_at: string | null
          processor: string
          processor_payment_id: string | null
          product_id: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          disputed_at?: string | null
          failure_reason?: string | null
          id?: string
          membership_id: string
          metadata?: Json
          paid_at?: string | null
          processor: string
          processor_payment_id?: string | null
          product_id?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          disputed_at?: string | null
          failure_reason?: string | null
          id?: string
          membership_id?: string
          metadata?: Json
          paid_at?: string | null
          processor?: string
          processor_payment_id?: string | null
          product_id?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "billing_payments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_products: {
        Row: {
          amount_cents: number
          club_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          interval: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          club_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          club_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_products_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          customer_id: string | null
          id: string
          membership_id: string
          processor: string
          processor_subscription_id: string | null
          product_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          id?: string
          membership_id: string
          processor: string
          processor_subscription_id?: string | null
          product_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          id?: string
          membership_id?: string
          processor?: string
          processor_subscription_id?: string | null
          product_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscriptions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscriptions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "billing_subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          club_id: string | null
          description: string | null
          id: string
          issuer: string | null
          name: string
        }
        Insert: {
          club_id?: string | null
          description?: string | null
          id?: string
          issuer?: string | null
          name: string
        }
        Update: {
          club_id?: string | null
          description?: string | null
          id?: string
          issuer?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_items: {
        Row: {
          created_at: string
          id: string
          label: string
          required: boolean
          sort_order: number
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          required?: boolean
          sort_order?: number
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          required?: boolean
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          club_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          admin_comments: string | null
          auto_renew: boolean
          banned_at: string | null
          club_id: string
          created_at: string
          id: string
          is_member: boolean
          joined_on: string | null
          last_active_at: string | null
          last_login_at: string | null
          membership_end: string | null
          membership_start: string | null
          role: Database["public"]["Enums"]["member_role"]
          state: Database["public"]["Enums"]["membership_state"]
          suspended_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_comments?: string | null
          auto_renew?: boolean
          banned_at?: string | null
          club_id: string
          created_at?: string
          id?: string
          is_member?: boolean
          joined_on?: string | null
          last_active_at?: string | null
          last_login_at?: string | null
          membership_end?: string | null
          membership_start?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          state?: Database["public"]["Enums"]["membership_state"]
          suspended_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_comments?: string | null
          auto_renew?: boolean
          banned_at?: string | null
          club_id?: string
          created_at?: string
          id?: string
          is_member?: boolean
          joined_on?: string | null
          last_active_at?: string | null
          last_login_at?: string | null
          membership_end?: string | null
          membership_start?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          state?: Database["public"]["Enums"]["membership_state"]
          suspended_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      endorsement_tags: {
        Row: {
          club_id: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          club_id?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          club_id?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "endorsement_tags_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      gear_categories: {
        Row: {
          club_id: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          club_id?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          club_id?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gear_categories_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      gear_items: {
        Row: {
          brand: string | null
          category_id: string | null
          condition: Database["public"]["Enums"]["gear_condition"]
          created_at: string
          id: string
          is_retired: boolean
          membership_id: string
          model: string | null
          name: string
          photos: Json
          quantity: number
          share_notes: string | null
          shareable: boolean
          size: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          condition?: Database["public"]["Enums"]["gear_condition"]
          created_at?: string
          id?: string
          is_retired?: boolean
          membership_id: string
          model?: string | null
          name: string
          photos?: Json
          quantity?: number
          share_notes?: string | null
          shareable?: boolean
          size?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          condition?: Database["public"]["Enums"]["gear_condition"]
          created_at?: string
          id?: string
          is_retired?: boolean
          membership_id?: string
          model?: string | null
          name?: string
          photos?: Json
          quantity?: number
          share_notes?: string | null
          shareable?: boolean
          size?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gear_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gear_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gear_items_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gear_items_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      gear_wishlist_items: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          membership_id: string
          name: string
          notes: string | null
          priority: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          membership_id: string
          name: string
          notes?: string | null
          priority?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          membership_id?: string
          name?: string
          notes?: string | null
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "gear_wishlist_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gear_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gear_wishlist_items_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gear_wishlist_items_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      interests: {
        Row: {
          club_id: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          club_id?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          club_id?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "interests_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          club_id: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          lat: number | null
          lon: number | null
          name: string
          postal_code: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          club_id?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          name: string
          postal_code?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          club_id?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          name?: string
          postal_code?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          byte_size: number | null
          checksum: string | null
          club_id: string | null
          created_at: string
          created_by_membership_id: string | null
          duration_seconds: number | null
          height: number | null
          id: string
          metadata: Json
          mime_type: string | null
          public_url: string | null
          storage_bucket: string | null
          storage_path: string
          storage_provider: string
          width: number | null
        }
        Insert: {
          byte_size?: number | null
          checksum?: string | null
          club_id?: string | null
          created_at?: string
          created_by_membership_id?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          public_url?: string | null
          storage_bucket?: string | null
          storage_path: string
          storage_provider?: string
          width?: number | null
        }
        Update: {
          byte_size?: number | null
          checksum?: string | null
          club_id?: string | null
          created_at?: string
          created_by_membership_id?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          public_url?: string | null
          storage_bucket?: string | null
          storage_path?: string
          storage_provider?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_activity_levels: {
        Row: {
          activity_id: string
          created_at: string
          level: number
          membership_id: string
          notes: string | null
        }
        Insert: {
          activity_id: string
          created_at?: string
          level?: number
          membership_id: string
          notes?: string | null
        }
        Update: {
          activity_id?: string
          created_at?: string
          level?: number
          membership_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_activity_levels_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_activity_levels_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_activity_levels_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_badges: {
        Row: {
          badge_id: string
          granted_at: string
          granted_by_membership_id: string | null
          membership_id: string
          note: string | null
        }
        Insert: {
          badge_id: string
          granted_at?: string
          granted_by_membership_id?: string | null
          membership_id: string
          note?: string | null
        }
        Update: {
          badge_id?: string
          granted_at?: string
          granted_by_membership_id?: string | null
          membership_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_granted_by_membership_id_fkey"
            columns: ["granted_by_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_granted_by_membership_id_fkey"
            columns: ["granted_by_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "member_badges_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_blocks: {
        Row: {
          blocked_membership_id: string
          blocker_membership_id: string
          club_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_membership_id: string
          blocker_membership_id: string
          club_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_membership_id?: string
          blocker_membership_id?: string
          club_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_blocks_blocked_membership_id_fkey"
            columns: ["blocked_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_blocks_blocked_membership_id_fkey"
            columns: ["blocked_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "member_blocks_blocker_membership_id_fkey"
            columns: ["blocker_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_blocks_blocker_membership_id_fkey"
            columns: ["blocker_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "member_blocks_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      member_certifications: {
        Row: {
          certification_id: string
          created_at: string
          date_earned: string | null
          expires_on: string | null
          id: string
          membership_id: string
          notes: string | null
          proof_media_asset_id: string | null
        }
        Insert: {
          certification_id: string
          created_at?: string
          date_earned?: string | null
          expires_on?: string | null
          id?: string
          membership_id: string
          notes?: string | null
          proof_media_asset_id?: string | null
        }
        Update: {
          certification_id?: string
          created_at?: string
          date_earned?: string | null
          expires_on?: string | null
          id?: string
          membership_id?: string
          notes?: string | null
          proof_media_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_certifications_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_certifications_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "member_certifications_proof_media_fk"
            columns: ["proof_media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_certifications_proof_media_fk"
            columns: ["proof_media_asset_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["media_asset_id"]
          },
        ]
      }
      member_emergency_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          membership_id: string
          name: string
          notes: string | null
          phone: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          membership_id: string
          name: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          membership_id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_emergency_contacts_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_emergency_contacts_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_endorsements: {
        Row: {
          club_id: string
          created_at: string
          endorsement_tag_id: string | null
          from_membership_id: string | null
          id: string
          note: string | null
          to_membership_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          endorsement_tag_id?: string | null
          from_membership_id?: string | null
          id?: string
          note?: string | null
          to_membership_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          endorsement_tag_id?: string | null
          from_membership_id?: string | null
          id?: string
          note?: string | null
          to_membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_endorsements_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_endorsements_endorsement_tag_id_fkey"
            columns: ["endorsement_tag_id"]
            isOneToOne: false
            referencedRelation: "endorsement_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_endorsements_from_membership_id_fkey"
            columns: ["from_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_endorsements_from_membership_id_fkey"
            columns: ["from_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "member_endorsements_to_membership_id_fkey"
            columns: ["to_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_endorsements_to_membership_id_fkey"
            columns: ["to_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_interests: {
        Row: {
          created_at: string
          intensity: number
          interest_id: string
          membership_id: string
        }
        Insert: {
          created_at?: string
          intensity?: number
          interest_id: string
          membership_id: string
        }
        Update: {
          created_at?: string
          intensity?: number
          interest_id?: string
          membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_interests_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_interests_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_asset_id: string
          membership_id: string
          visibility: Database["public"]["Enums"]["privacy_visibility"]
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_asset_id: string
          membership_id: string
          visibility?: Database["public"]["Enums"]["privacy_visibility"]
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_asset_id?: string
          membership_id?: string
          visibility?: Database["public"]["Enums"]["privacy_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "member_media_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_media_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["media_asset_id"]
          },
          {
            foreignKeyName: "member_media_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_media_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_mutes: {
        Row: {
          club_id: string
          created_at: string
          expires_at: string | null
          id: string
          muted_membership_id: string
          muter_membership_id: string
          thread_id: string | null
        }
        Insert: {
          club_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_membership_id: string
          muter_membership_id: string
          thread_id?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_membership_id?: string
          muter_membership_id?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_mutes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_mutes_muted_membership_id_fkey"
            columns: ["muted_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_mutes_muted_membership_id_fkey"
            columns: ["muted_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "member_mutes_muter_membership_id_fkey"
            columns: ["muter_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_mutes_muter_membership_id_fkey"
            columns: ["muter_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "member_mutes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      member_preferences: {
        Row: {
          created_at: string
          exposure_tolerance: string | null
          goals: string | null
          group_style: string | null
          max_trip_length_hours: number | null
          membership_id: string
          pace_preference: string | null
          typical_start_time: string | null
          updated_at: string
          weekday_availability: boolean | null
          weekend_availability: boolean | null
        }
        Insert: {
          created_at?: string
          exposure_tolerance?: string | null
          goals?: string | null
          group_style?: string | null
          max_trip_length_hours?: number | null
          membership_id: string
          pace_preference?: string | null
          typical_start_time?: string | null
          updated_at?: string
          weekday_availability?: boolean | null
          weekend_availability?: boolean | null
        }
        Update: {
          created_at?: string
          exposure_tolerance?: string | null
          goals?: string | null
          group_style?: string | null
          max_trip_length_hours?: number | null
          membership_id?: string
          pace_preference?: string | null
          typical_start_time?: string | null
          updated_at?: string
          weekday_availability?: boolean | null
          weekend_availability?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "member_preferences_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_preferences_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_privacy_settings: {
        Row: {
          allow_photos_on_public_pages: boolean
          allow_tagging_in_photos: boolean
          created_at: string
          home_area_precision: string
          membership_id: string
          show_discord: Database["public"]["Enums"]["privacy_visibility"]
          show_email: Database["public"]["Enums"]["privacy_visibility"]
          show_gear_list: Database["public"]["Enums"]["privacy_visibility"]
          show_home_area: Database["public"]["Enums"]["privacy_visibility"]
          show_phone: Database["public"]["Enums"]["privacy_visibility"]
          show_trip_history: Database["public"]["Enums"]["privacy_visibility"]
          updated_at: string
        }
        Insert: {
          allow_photos_on_public_pages?: boolean
          allow_tagging_in_photos?: boolean
          created_at?: string
          home_area_precision?: string
          membership_id: string
          show_discord?: Database["public"]["Enums"]["privacy_visibility"]
          show_email?: Database["public"]["Enums"]["privacy_visibility"]
          show_gear_list?: Database["public"]["Enums"]["privacy_visibility"]
          show_home_area?: Database["public"]["Enums"]["privacy_visibility"]
          show_phone?: Database["public"]["Enums"]["privacy_visibility"]
          show_trip_history?: Database["public"]["Enums"]["privacy_visibility"]
          updated_at?: string
        }
        Update: {
          allow_photos_on_public_pages?: boolean
          allow_tagging_in_photos?: boolean
          created_at?: string
          home_area_precision?: string
          membership_id?: string
          show_discord?: Database["public"]["Enums"]["privacy_visibility"]
          show_email?: Database["public"]["Enums"]["privacy_visibility"]
          show_gear_list?: Database["public"]["Enums"]["privacy_visibility"]
          show_home_area?: Database["public"]["Enums"]["privacy_visibility"]
          show_phone?: Database["public"]["Enums"]["privacy_visibility"]
          show_trip_history?: Database["public"]["Enums"]["privacy_visibility"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_privacy_settings_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_privacy_settings_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_saved_locations: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          location_id: string
          membership_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          location_id: string
          membership_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          location_id?: string
          membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_saved_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_saved_locations_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_saved_locations_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_skills: {
        Row: {
          can_teach: boolean
          created_at: string
          membership_id: string
          notes: string | null
          proficiency: number
          skill_id: string
        }
        Insert: {
          can_teach?: boolean
          created_at?: string
          membership_id: string
          notes?: string | null
          proficiency?: number
          skill_id: string
        }
        Update: {
          can_teach?: boolean
          created_at?: string
          membership_id?: string
          notes?: string | null
          proficiency?: number
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_skills_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_skills_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "member_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      member_stats: {
        Row: {
          attendance_rate: number | null
          last_trip_at: string | null
          membership_id: string
          trips_attended_count: number
          trips_canceled_count: number
          trips_led_count: number
          trips_no_show_count: number
          updated_at: string
        }
        Insert: {
          attendance_rate?: number | null
          last_trip_at?: string | null
          membership_id: string
          trips_attended_count?: number
          trips_canceled_count?: number
          trips_led_count?: number
          trips_no_show_count?: number
          updated_at?: string
        }
        Update: {
          attendance_rate?: number | null
          last_trip_at?: string | null
          membership_id?: string
          trips_attended_count?: number
          trips_canceled_count?: number
          trips_led_count?: number
          trips_no_show_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_stats_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_stats_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_travel_profiles: {
        Row: {
          area_of_town: string | null
          can_bike: boolean
          can_meet_designated_spot_without_ride: boolean
          created_at: string
          max_distance_to_meetup_miles: number | null
          max_drive_time_to_meetup_minutes: number | null
          membership_id: string
          need_a_ride: boolean
          notes: string | null
          updated_at: string
          willing_to_bus: boolean
          willing_to_carpool: boolean
        }
        Insert: {
          area_of_town?: string | null
          can_bike?: boolean
          can_meet_designated_spot_without_ride?: boolean
          created_at?: string
          max_distance_to_meetup_miles?: number | null
          max_drive_time_to_meetup_minutes?: number | null
          membership_id: string
          need_a_ride?: boolean
          notes?: string | null
          updated_at?: string
          willing_to_bus?: boolean
          willing_to_carpool?: boolean
        }
        Update: {
          area_of_town?: string | null
          can_bike?: boolean
          can_meet_designated_spot_without_ride?: boolean
          created_at?: string
          max_distance_to_meetup_miles?: number | null
          max_drive_time_to_meetup_minutes?: number | null
          membership_id?: string
          need_a_ride?: boolean
          notes?: string | null
          updated_at?: string
          willing_to_bus?: boolean
          willing_to_carpool?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "member_travel_profiles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_travel_profiles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_vehicles: {
        Row: {
          cargo_notes: string | null
          comfortable_with_dirt_roads: boolean
          comfortable_with_snow_driving: boolean
          cost_split_method: string | null
          created_at: string
          has_hitch_rack: boolean
          has_roof_rack: boolean
          id: string
          is_primary: boolean
          membership_id: string
          nickname: string | null
          prefers_day_trips_only: boolean
          seats_available: number | null
          seats_total: number | null
          snow_chains_compatible: boolean
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          wants_gas_money: boolean
        }
        Insert: {
          cargo_notes?: string | null
          comfortable_with_dirt_roads?: boolean
          comfortable_with_snow_driving?: boolean
          cost_split_method?: string | null
          created_at?: string
          has_hitch_rack?: boolean
          has_roof_rack?: boolean
          id?: string
          is_primary?: boolean
          membership_id: string
          nickname?: string | null
          prefers_day_trips_only?: boolean
          seats_available?: number | null
          seats_total?: number | null
          snow_chains_compatible?: boolean
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          wants_gas_money?: boolean
        }
        Update: {
          cargo_notes?: string | null
          comfortable_with_dirt_roads?: boolean
          comfortable_with_snow_driving?: boolean
          cost_split_method?: string | null
          created_at?: string
          has_hitch_rack?: boolean
          has_roof_rack?: boolean
          id?: string
          is_primary?: boolean
          membership_id?: string
          nickname?: string | null
          prefers_day_trips_only?: boolean
          seats_available?: number | null
          seats_total?: number | null
          snow_chains_compatible?: boolean
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          wants_gas_money?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "member_vehicles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_vehicles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      member_waiver_signatures: {
        Row: {
          created_at: string
          id: string
          membership_id: string
          signature_ip: unknown
          signature_name: string | null
          signature_user_agent: string | null
          signed_at: string
          waiver_version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          membership_id: string
          signature_ip?: unknown
          signature_name?: string | null
          signature_user_agent?: string | null
          signed_at?: string
          waiver_version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          membership_id?: string
          signature_ip?: unknown
          signature_name?: string | null
          signature_user_agent?: string | null
          signed_at?: string
          waiver_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_waiver_signatures_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_waiver_signatures_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "member_waiver_signatures_waiver_version_id_fkey"
            columns: ["waiver_version_id"]
            isOneToOne: false
            referencedRelation: "waiver_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      message_thread_members: {
        Row: {
          last_read_at: string | null
          membership_id: string
          muted: boolean
          thread_id: string
        }
        Insert: {
          last_read_at?: string | null
          membership_id: string
          muted?: boolean
          thread_id: string
        }
        Update: {
          last_read_at?: string | null
          membership_id?: string
          muted?: boolean
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_thread_members_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_thread_members_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "message_thread_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          club_id: string
          created_at: string
          created_by_membership_id: string | null
          id: string
          title: string | null
          trip_id: string | null
          type: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by_membership_id?: string | null
          id?: string
          title?: string | null
          trip_id?: string | null
          type: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by_membership_id?: string | null
          id?: string
          title?: string | null
          trip_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "message_threads_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "message_threads_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_membership_id: string | null
          body: string
          body_format: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          media_asset_id: string | null
          thread_id: string
        }
        Insert: {
          author_membership_id?: string | null
          body: string
          body_format?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          media_asset_id?: string | null
          thread_id: string
        }
        Update: {
          author_membership_id?: string | null
          body?: string
          body_format?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          media_asset_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_membership_id_fkey"
            columns: ["author_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_author_membership_id_fkey"
            columns: ["author_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "messages_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["media_asset_id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["moderation_action_type"]
          club_id: string
          created_at: string
          ends_at: string | null
          id: string
          notes: string | null
          performed_by_membership_id: string | null
          reason: string | null
          report_id: string | null
          starts_at: string
          target_membership_id: string | null
          target_message_id: string | null
          target_trip_id: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["moderation_action_type"]
          club_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          notes?: string | null
          performed_by_membership_id?: string | null
          reason?: string | null
          report_id?: string | null
          starts_at?: string
          target_membership_id?: string | null
          target_message_id?: string | null
          target_trip_id?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["moderation_action_type"]
          club_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          notes?: string | null
          performed_by_membership_id?: string | null
          reason?: string | null
          report_id?: string | null
          starts_at?: string
          target_membership_id?: string | null
          target_message_id?: string | null
          target_trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_performed_by_membership_id_fkey"
            columns: ["performed_by_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_performed_by_membership_id_fkey"
            columns: ["performed_by_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "moderation_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_membership_id_fkey"
            columns: ["target_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_membership_id_fkey"
            columns: ["target_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "moderation_actions_target_message_id_fkey"
            columns: ["target_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_trip_id_fkey"
            columns: ["target_trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_trip_id_fkey"
            columns: ["target_trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "moderation_actions_target_trip_id_fkey"
            columns: ["target_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_reports: {
        Row: {
          assigned_to_membership_id: string | null
          club_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_media_id: string | null
          reported_membership_id: string | null
          reported_message_id: string | null
          reported_trip_id: string | null
          reporter_membership_id: string | null
          status: Database["public"]["Enums"]["moderation_report_status"]
          updated_at: string
        }
        Insert: {
          assigned_to_membership_id?: string | null
          club_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_media_id?: string | null
          reported_membership_id?: string | null
          reported_message_id?: string | null
          reported_trip_id?: string | null
          reporter_membership_id?: string | null
          status?: Database["public"]["Enums"]["moderation_report_status"]
          updated_at?: string
        }
        Update: {
          assigned_to_membership_id?: string | null
          club_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_media_id?: string | null
          reported_membership_id?: string | null
          reported_message_id?: string | null
          reported_trip_id?: string | null
          reporter_membership_id?: string | null
          status?: Database["public"]["Enums"]["moderation_report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_reports_assigned_to_membership_id_fkey"
            columns: ["assigned_to_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_assigned_to_membership_id_fkey"
            columns: ["assigned_to_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "moderation_reports_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_media_id_fkey"
            columns: ["reported_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_media_id_fkey"
            columns: ["reported_media_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["media_asset_id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_membership_id_fkey"
            columns: ["reported_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_membership_id_fkey"
            columns: ["reported_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_message_id_fkey"
            columns: ["reported_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_trip_id_fkey"
            columns: ["reported_trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_trip_id_fkey"
            columns: ["reported_trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_trip_id_fkey"
            columns: ["reported_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reporter_membership_id_fkey"
            columns: ["reporter_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reporter_membership_id_fkey"
            columns: ["reporter_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      notification_devices: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          is_active: boolean
          membership_id: string
          token: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          is_active?: boolean
          membership_id: string
          token: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          is_active?: boolean
          membership_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_devices_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_devices_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          carpool_messages: boolean
          digest_frequency: string
          discord_enabled: boolean
          email_enabled: boolean
          last_minute_changes: boolean
          membership_id: string
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          rsvp_reminders: boolean
          sms_enabled: boolean
          trip_announcements: boolean
          updated_at: string
        }
        Insert: {
          carpool_messages?: boolean
          digest_frequency?: string
          discord_enabled?: boolean
          email_enabled?: boolean
          last_minute_changes?: boolean
          membership_id: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rsvp_reminders?: boolean
          sms_enabled?: boolean
          trip_announcements?: boolean
          updated_at?: string
        }
        Update: {
          carpool_messages?: boolean
          digest_frequency?: string
          discord_enabled?: boolean
          email_enabled?: boolean
          last_minute_changes?: boolean
          membership_id?: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rsvp_reminders?: boolean
          sms_enabled?: boolean
          trip_announcements?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          club_id: string
          created_at: string
          data: Json
          id: string
          membership_id: string
          read_at: string | null
          sent_at: string | null
          title: string | null
        }
        Insert: {
          body?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          club_id: string
          created_at?: string
          data?: Json
          id?: string
          membership_id: string
          read_at?: string | null
          sent_at?: string | null
          title?: string | null
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          club_id?: string
          created_at?: string
          data?: Json
          id?: string
          membership_id?: string
          read_at?: string | null
          sent_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      skills: {
        Row: {
          club_id: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          club_id?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          club_id?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      taggings: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          media_asset_id: string | null
          membership_id: string | null
          tag_id: string
          trip_id: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          media_asset_id?: string | null
          membership_id?: string | null
          tag_id: string
          trip_id?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          media_asset_id?: string | null
          membership_id?: string | null
          tag_id?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taggings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taggings_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taggings_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["media_asset_id"]
          },
          {
            foreignKeyName: "taggings_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taggings_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "taggings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taggings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taggings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "taggings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          club_id: string | null
          id: string
          name: string
        }
        Insert: {
          club_id?: string | null
          id?: string
          name: string
        }
        Update: {
          club_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_carpool_group_members: {
        Row: {
          carpool_group_id: string
          created_at: string
          membership_id: string
          role: string
        }
        Insert: {
          carpool_group_id: string
          created_at?: string
          membership_id: string
          role?: string
        }
        Update: {
          carpool_group_id?: string
          created_at?: string
          membership_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_carpool_group_members_carpool_group_id_fkey"
            columns: ["carpool_group_id"]
            isOneToOne: false
            referencedRelation: "trip_carpool_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_carpool_group_members_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_carpool_group_members_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      trip_carpool_groups: {
        Row: {
          created_at: string
          driver_membership_id: string | null
          id: string
          notes: string | null
          pickup_location_id: string | null
          seats_available: number | null
          trip_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          driver_membership_id?: string | null
          id?: string
          notes?: string | null
          pickup_location_id?: string | null
          seats_available?: number | null
          trip_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          driver_membership_id?: string | null
          id?: string
          notes?: string | null
          pickup_location_id?: string | null
          seats_available?: number | null
          trip_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_carpool_groups_driver_membership_id_fkey"
            columns: ["driver_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_carpool_groups_driver_membership_id_fkey"
            columns: ["driver_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_carpool_groups_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_carpool_groups_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_carpool_groups_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_carpool_groups_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_carpool_groups_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "member_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklist_item_completions: {
        Row: {
          completed: boolean
          completed_at: string | null
          membership_id: string
          note: string | null
          trip_checklist_item_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          membership_id: string
          note?: string | null
          trip_checklist_item_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          membership_id?: string
          note?: string | null
          trip_checklist_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checklist_item_completions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_checklist_item_completions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_checklist_item_completions_trip_checklist_item_id_fkey"
            columns: ["trip_checklist_item_id"]
            isOneToOne: false
            referencedRelation: "trip_checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklist_items: {
        Row: {
          created_at: string
          id: string
          label: string
          required: boolean
          sort_order: number
          trip_checklist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          required?: boolean
          sort_order?: number
          trip_checklist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          required?: boolean
          sort_order?: number
          trip_checklist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checklist_items_trip_checklist_id_fkey"
            columns: ["trip_checklist_id"]
            isOneToOne: false
            referencedRelation: "trip_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklists: {
        Row: {
          created_at: string
          id: string
          name: string
          template_id: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          template_id?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          template_id?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_checklists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_checklists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_checklists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_custom_answers: {
        Row: {
          answer: Json
          created_at: string
          membership_id: string
          question_id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          answer?: Json
          created_at?: string
          membership_id: string
          question_id: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          answer?: Json
          created_at?: string
          membership_id?: string
          question_id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_custom_answers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_custom_answers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_custom_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "trip_custom_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_custom_answers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_custom_answers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_custom_answers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_custom_question_options: {
        Row: {
          created_at: string
          id: string
          label: string
          metadata: Json
          question_id: string
          sort_order: number
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          metadata?: Json
          question_id: string
          sort_order?: number
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          metadata?: Json
          question_id?: string
          sort_order?: number
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_custom_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "trip_custom_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_custom_questions: {
        Row: {
          config: Json
          created_at: string
          created_by_membership_id: string | null
          description: string | null
          id: string
          prompt: string
          question_type: Database["public"]["Enums"]["custom_question_type"]
          required: boolean
          sort_order: number
          trip_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by_membership_id?: string | null
          description?: string | null
          id?: string
          prompt: string
          question_type: Database["public"]["Enums"]["custom_question_type"]
          required?: boolean
          sort_order?: number
          trip_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by_membership_id?: string | null
          description?: string | null
          id?: string
          prompt?: string
          question_type?: Database["public"]["Enums"]["custom_question_type"]
          required?: boolean
          sort_order?: number
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_custom_questions_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_custom_questions_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_custom_questions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_custom_questions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_custom_questions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_itinerary_segments: {
        Row: {
          created_at: string
          details: string | null
          ends_at: string | null
          id: string
          kind: Database["public"]["Enums"]["itinerary_segment_kind"]
          label: string
          lat: number | null
          location_id: string | null
          lon: number | null
          sort_order: number
          starts_at: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          ends_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["itinerary_segment_kind"]
          label: string
          lat?: number | null
          location_id?: string | null
          lon?: number | null
          sort_order?: number
          starts_at?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          ends_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["itinerary_segment_kind"]
          label?: string
          lat?: number | null
          location_id?: string | null
          lon?: number | null
          sort_order?: number
          starts_at?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_itinerary_segments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_itinerary_segments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_itinerary_segments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_itinerary_segments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_asset_id: string
          trip_id: string
          uploaded_by_membership_id: string | null
          visibility: Database["public"]["Enums"]["privacy_visibility"]
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_asset_id: string
          trip_id: string
          uploaded_by_membership_id?: string | null
          visibility?: Database["public"]["Enums"]["privacy_visibility"]
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_asset_id?: string
          trip_id?: string
          uploaded_by_membership_id?: string | null
          visibility?: Database["public"]["Enums"]["privacy_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "trip_media_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_media_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["media_asset_id"]
          },
          {
            foreignKeyName: "trip_media_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_media_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_media_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_media_uploaded_by_membership_id_fkey"
            columns: ["uploaded_by_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_media_uploaded_by_membership_id_fkey"
            columns: ["uploaded_by_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      trip_member_private_notes: {
        Row: {
          body_markdown: string
          created_at: string
          membership_id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          body_markdown: string
          created_at?: string
          membership_id: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          created_at?: string
          membership_id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_member_private_notes_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_member_private_notes_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_member_private_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_member_private_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_member_private_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_participants: {
        Row: {
          attendance: Database["public"]["Enums"]["attendance_status"]
          can_drive: boolean
          joined_at: string
          membership_id: string
          needs_ride: boolean
          participant_notes: string | null
          private_notes: string | null
          removed_reason: string | null
          role: Database["public"]["Enums"]["trip_participant_role"]
          rsvp_status: Database["public"]["Enums"]["trip_rsvp_status"]
          rsvp_updated_at: string | null
          seats_offered: number | null
          seats_requested: number | null
          selected_meeting_location_id: string | null
          trip_id: string
        }
        Insert: {
          attendance?: Database["public"]["Enums"]["attendance_status"]
          can_drive?: boolean
          joined_at?: string
          membership_id: string
          needs_ride?: boolean
          participant_notes?: string | null
          private_notes?: string | null
          removed_reason?: string | null
          role?: Database["public"]["Enums"]["trip_participant_role"]
          rsvp_status?: Database["public"]["Enums"]["trip_rsvp_status"]
          rsvp_updated_at?: string | null
          seats_offered?: number | null
          seats_requested?: number | null
          selected_meeting_location_id?: string | null
          trip_id: string
        }
        Update: {
          attendance?: Database["public"]["Enums"]["attendance_status"]
          can_drive?: boolean
          joined_at?: string
          membership_id?: string
          needs_ride?: boolean
          participant_notes?: string | null
          private_notes?: string | null
          removed_reason?: string | null
          role?: Database["public"]["Enums"]["trip_participant_role"]
          rsvp_status?: Database["public"]["Enums"]["trip_rsvp_status"]
          rsvp_updated_at?: string | null
          seats_offered?: number | null
          seats_requested?: number | null
          selected_meeting_location_id?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_participants_selected_meeting_location_id_fkey"
            columns: ["selected_meeting_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_poll_options: {
        Row: {
          created_at: string
          data: Json
          id: string
          label: string
          poll_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          label: string
          poll_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          label?: string
          poll_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "trip_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "trip_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_poll_votes: {
        Row: {
          created_at: string
          membership_id: string
          option_id: string
          poll_id: string
          rank: number | null
        }
        Insert: {
          created_at?: string
          membership_id: string
          option_id: string
          poll_id: string
          rank?: number | null
        }
        Update: {
          created_at?: string
          membership_id?: string
          option_id?: string
          poll_id?: string
          rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_poll_votes_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_poll_votes_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "trip_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "trip_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_polls: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by_membership_id: string | null
          description: string | null
          id: string
          is_open: boolean
          opens_at: string | null
          poll_type: Database["public"]["Enums"]["poll_type"]
          title: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by_membership_id?: string | null
          description?: string | null
          id?: string
          is_open?: boolean
          opens_at?: string | null
          poll_type?: Database["public"]["Enums"]["poll_type"]
          title: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by_membership_id?: string | null
          description?: string | null
          id?: string
          is_open?: boolean
          opens_at?: string | null
          poll_type?: Database["public"]["Enums"]["poll_type"]
          title?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_polls_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_polls_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_polls_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_polls_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_polls_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_proposal_options: {
        Row: {
          created_at: string
          data: Json
          id: string
          kind: Database["public"]["Enums"]["proposal_option_kind"]
          label: string
          proposal_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          kind: Database["public"]["Enums"]["proposal_option_kind"]
          label: string
          proposal_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          kind?: Database["public"]["Enums"]["proposal_option_kind"]
          label?: string
          proposal_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "trip_proposal_options_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "trip_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_proposal_votes: {
        Row: {
          created_at: string
          membership_id: string
          option_id: string
          proposal_id: string
          rank: number | null
        }
        Insert: {
          created_at?: string
          membership_id: string
          option_id: string
          proposal_id: string
          rank?: number | null
        }
        Update: {
          created_at?: string
          membership_id?: string
          option_id?: string
          proposal_id?: string
          rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_proposal_votes_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_proposal_votes_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_proposal_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "trip_proposal_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_proposal_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "trip_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_proposals: {
        Row: {
          club_id: string
          created_at: string
          created_by_membership_id: string | null
          description: string | null
          earliest_start_at: string | null
          id: string
          latest_end_at: string | null
          spawned_trip_id: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          target_visibility: Database["public"]["Enums"]["trip_visibility"]
          timezone: string | null
          title: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by_membership_id?: string | null
          description?: string | null
          earliest_start_at?: string | null
          id?: string
          latest_end_at?: string | null
          spawned_trip_id?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          target_visibility?: Database["public"]["Enums"]["trip_visibility"]
          timezone?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by_membership_id?: string | null
          description?: string | null
          earliest_start_at?: string | null
          id?: string
          latest_end_at?: string | null
          spawned_trip_id?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          target_visibility?: Database["public"]["Enums"]["trip_visibility"]
          timezone?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_proposals_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_proposals_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_proposals_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_proposals_spawned_trip_id_fkey"
            columns: ["spawned_trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_proposals_spawned_trip_id_fkey"
            columns: ["spawned_trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_proposals_spawned_trip_id_fkey"
            columns: ["spawned_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_reports: {
        Row: {
          author_membership_id: string | null
          body_markdown: string
          created_at: string
          id: string
          title: string | null
          trip_id: string
          updated_at: string
          visibility: Database["public"]["Enums"]["privacy_visibility"]
        }
        Insert: {
          author_membership_id?: string | null
          body_markdown: string
          created_at?: string
          id?: string
          title?: string | null
          trip_id: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["privacy_visibility"]
        }
        Update: {
          author_membership_id?: string | null
          body_markdown?: string
          created_at?: string
          id?: string
          title?: string | null
          trip_id?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["privacy_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "trip_reports_author_membership_id_fkey"
            columns: ["author_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_reports_author_membership_id_fkey"
            columns: ["author_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_reports_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_reports_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_reports_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_route_files: {
        Row: {
          created_at: string
          id: string
          label: string | null
          media_asset_id: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          media_asset_id: string
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          media_asset_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_route_files_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_route_files_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["media_asset_id"]
          },
          {
            foreignKeyName: "trip_route_files_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_route_files_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_route_files_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_shared_notes: {
        Row: {
          author_membership_id: string | null
          body_markdown: string
          created_at: string
          id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          author_membership_id?: string | null
          body_markdown: string
          created_at?: string
          id?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          author_membership_id?: string | null
          body_markdown?: string
          created_at?: string
          id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_shared_notes_author_membership_id_fkey"
            columns: ["author_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_shared_notes_author_membership_id_fkey"
            columns: ["author_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trip_shared_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_shared_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_shared_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_waypoints: {
        Row: {
          created_at: string
          elevation_m: number | null
          id: string
          itinerary_segment_id: string | null
          kind: Database["public"]["Enums"]["waypoint_kind"]
          lat: number
          lon: number
          name: string
          notes: string | null
          sort_order: number
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          elevation_m?: number | null
          id?: string
          itinerary_segment_id?: string | null
          kind?: Database["public"]["Enums"]["waypoint_kind"]
          lat: number
          lon: number
          name: string
          notes?: string | null
          sort_order?: number
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          elevation_m?: number | null
          id?: string
          itinerary_segment_id?: string | null
          kind?: Database["public"]["Enums"]["waypoint_kind"]
          lat?: number
          lon?: number
          name?: string
          notes?: string | null
          sort_order?: number
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_waypoints_itinerary_segment_id_fkey"
            columns: ["itinerary_segment_id"]
            isOneToOne: false
            referencedRelation: "trip_itinerary_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_waypoints_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_waypoints_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_archive_media"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_waypoints_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          access_notes: string | null
          activity_types: string[]
          arrive_window_end: string | null
          arrive_window_start: string | null
          capacity: number | null
          carpool_deadline: string | null
          club_id: string
          cost_notes: string | null
          created_at: string
          created_by_membership_id: string | null
          description: string | null
          difficulty: string | null
          difficulty_level: number | null
          end_at: string | null
          external_links: Json | null
          gear_claim_deadline: string | null
          hazard_notes: string | null
          id: string
          is_official: boolean
          kind: Database["public"]["Enums"]["trip_kind"] | null
          last_updated_at: string | null
          lat: number | null
          leave_window_end: string | null
          leave_window_start: string | null
          lon: number | null
          meeting_location_id: string | null
          meeting_location_lat: number | null
          meeting_location_lng: number | null
          meeting_location_name: string | null
          meetup_time: string | null
          primary_location_id: string | null
          primary_location_lat: number | null
          primary_location_lng: number | null
          primary_location_name: string | null
          recommended_gear: Json
          required_gear: Json
          rsvp_deadline: string | null
          short_summary: string | null
          start_at: string
          status: Database["public"]["Enums"]["trip_status"]
          timezone: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["trip_visibility"]
          waitlist_capacity: number | null
          waitlist_enabled: boolean
          weather_notes: string | null
        }
        Insert: {
          access_notes?: string | null
          activity_types?: string[]
          arrive_window_end?: string | null
          arrive_window_start?: string | null
          capacity?: number | null
          carpool_deadline?: string | null
          club_id: string
          cost_notes?: string | null
          created_at?: string
          created_by_membership_id?: string | null
          description?: string | null
          difficulty?: string | null
          difficulty_level?: number | null
          end_at?: string | null
          external_links?: Json | null
          gear_claim_deadline?: string | null
          hazard_notes?: string | null
          id?: string
          is_official?: boolean
          kind?: Database["public"]["Enums"]["trip_kind"] | null
          last_updated_at?: string | null
          lat?: number | null
          leave_window_end?: string | null
          leave_window_start?: string | null
          lon?: number | null
          meeting_location_id?: string | null
          meeting_location_lat?: number | null
          meeting_location_lng?: number | null
          meeting_location_name?: string | null
          meetup_time?: string | null
          primary_location_id?: string | null
          primary_location_lat?: number | null
          primary_location_lng?: number | null
          primary_location_name?: string | null
          recommended_gear?: Json
          required_gear?: Json
          rsvp_deadline?: string | null
          short_summary?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["trip_status"]
          timezone?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["trip_visibility"]
          waitlist_capacity?: number | null
          waitlist_enabled?: boolean
          weather_notes?: string | null
        }
        Update: {
          access_notes?: string | null
          activity_types?: string[]
          arrive_window_end?: string | null
          arrive_window_start?: string | null
          capacity?: number | null
          carpool_deadline?: string | null
          club_id?: string
          cost_notes?: string | null
          created_at?: string
          created_by_membership_id?: string | null
          description?: string | null
          difficulty?: string | null
          difficulty_level?: number | null
          end_at?: string | null
          external_links?: Json | null
          gear_claim_deadline?: string | null
          hazard_notes?: string | null
          id?: string
          is_official?: boolean
          kind?: Database["public"]["Enums"]["trip_kind"] | null
          last_updated_at?: string | null
          lat?: number | null
          leave_window_end?: string | null
          leave_window_start?: string | null
          lon?: number | null
          meeting_location_id?: string | null
          meeting_location_lat?: number | null
          meeting_location_lng?: number | null
          meeting_location_name?: string | null
          meetup_time?: string | null
          primary_location_id?: string | null
          primary_location_lat?: number | null
          primary_location_lng?: number | null
          primary_location_name?: string | null
          recommended_gear?: Json
          required_gear?: Json
          rsvp_deadline?: string | null
          short_summary?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["trip_status"]
          timezone?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["trip_visibility"]
          waitlist_capacity?: number | null
          waitlist_enabled?: boolean
          weather_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_created_by_membership_id_fkey"
            columns: ["created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "trips_meeting_location_id_fkey"
            columns: ["meeting_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_primary_location_id_fkey"
            columns: ["primary_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      waiver_versions: {
        Row: {
          body_markdown: string
          club_id: string
          created_at: string
          id: string
          published_at: string | null
          retired_at: string | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          body_markdown: string
          club_id: string
          created_at?: string
          id?: string
          published_at?: string | null
          retired_at?: string | null
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          body_markdown?: string
          club_id?: string
          created_at?: string
          id?: string
          published_at?: string | null
          retired_at?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiver_versions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      member_directory: {
        Row: {
          area_of_town: string | null
          avatar_url: string | null
          bio: string | null
          club_id: string | null
          email: string | null
          home_area_precision: string | null
          joined_on: string | null
          membership_created_at: string | null
          membership_id: string | null
          name: string | null
          phone: string | null
          pronouns: string | null
          role: Database["public"]["Enums"]["member_role"] | null
          state: Database["public"]["Enums"]["membership_state"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      my_profile: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          email_verified_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
          phone_verified_at: string | null
          pronouns: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          pronouns?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          pronouns?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_archive: {
        Row: {
          club_id: string | null
          cover_media_asset_id: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          end_at: string | null
          id: string | null
          lat: number | null
          lon: number | null
          meeting_location_id: string | null
          meeting_location_name: string | null
          primary_location_id: string | null
          primary_location_name: string | null
          public_photo_count: number | null
          start_at: string | null
          timezone: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_meeting_location_id_fkey"
            columns: ["meeting_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_primary_location_id_fkey"
            columns: ["primary_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_archive_media: {
        Row: {
          caption: string | null
          height: number | null
          media_asset_id: string | null
          mime_type: string | null
          public_url: string | null
          trip_id: string | null
          trip_media_id: string | null
          uploaded_at: string | null
          width: number | null
        }
        Relationships: []
      }
      user_public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          pronouns: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          pronouns?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          pronouns?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _enum_pick: {
        Args: { enum_type: unknown; preferred: string[] }
        Returns: string
      }
      am_i_active_member: { Args: { _club_id: string }; Returns: boolean }
      can_manage_trip: { Args: { _trip_id: string }; Returns: boolean }
      can_view_trip: { Args: { _trip_id: string }; Returns: boolean }
      can_view_visibility: {
        Args: {
          _club_id: string
          _target_user_id: string
          _visibility: Database["public"]["Enums"]["privacy_visibility"]
        }
        Returns: boolean
      }
      debug_request_context: { Args: never; Returns: Json }
      get_trip_teasers_in_range: {
        Args: { _club_id: string; _end: string; _start: string }
        Returns: {
          day: string
          event_count: number
          official_count: number
        }[]
      }
      is_active_member: { Args: { _club_id: string }; Returns: boolean }
      is_authenticated: { Args: never; Returns: boolean }
      is_club_leader: { Args: { uid: string }; Returns: boolean }
      is_club_member: { Args: { uid: string }; Returns: boolean }
      is_invited_or_participant: {
        Args: { _trip_id: string }
        Returns: boolean
      }
      is_leader: { Args: { _club_id: string }; Returns: boolean }
      my_membership_id: { Args: { _club_id: string }; Returns: string }
      owns_membership: { Args: { _membership_id: string }; Returns: boolean }
      rpc_admin_record_payment: {
        Args: {
          _amount_cents: number
          _currency?: string
          _membership_id: string
          _metadata?: Json
          _paid_at?: string
          _processor: string
          _processor_payment_id: string
          _product_id: string
          _status?: Database["public"]["Enums"]["payment_status"]
        }
        Returns: string
      }
      rpc_broadcast_notification: {
        Args: {
          _body: string
          _channel: Database["public"]["Enums"]["notification_channel"]
          _club_id: string
          _data?: Json
          _title: string
        }
        Returns: number
      }
      rpc_create_moderation_report: {
        Args: {
          _club_id: string
          _details?: string
          _reason: string
          _reported_media_id?: string
          _reported_membership_id?: string
          _reported_message_id?: string
          _reported_trip_id?: string
        }
        Returns: string
      }
      rpc_create_payment_intent: {
        Args: {
          _amount_cents: number
          _currency?: string
          _membership_id: string
          _metadata?: Json
          _processor: string
          _product_id: string
        }
        Returns: string
      }
      rpc_notify_trip_participants: {
        Args: {
          _body: string
          _channel: Database["public"]["Enums"]["notification_channel"]
          _data?: Json
          _title: string
          _trip_id: string
        }
        Returns: number
      }
      rpc_take_moderation_action: {
        Args: {
          _action_type: Database["public"]["Enums"]["moderation_action_type"]
          _club_id: string
          _ends_at?: string
          _notes?: string
          _reason?: string
          _report_id?: string
          _target_membership_id?: string
          _target_message_id?: string
          _target_trip_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      attendance_status:
        | "unknown"
        | "attended"
        | "no_show"
        | "canceled"
        | "left_early"
      custom_question_type:
        | "boolean"
        | "number"
        | "text"
        | "select_one"
        | "select_many"
        | "slider"
      gear_condition: "new" | "good" | "worn" | "needs_repair" | "retired"
      itinerary_segment_kind:
        | "meetup"
        | "drive"
        | "approach"
        | "objective"
        | "break"
        | "camp"
        | "return"
        | "food"
        | "other"
      member_role:
        | "regular"
        | "leader"
        | "admin"
        | "board"
        | "founder"
        | "staff"
      membership_state:
        | "active"
        | "inactive"
        | "pending"
        | "past_due"
        | "canceled"
        | "suspended"
        | "banned"
      moderation_action_type:
        | "warn"
        | "mute"
        | "suspend"
        | "ban"
        | "remove_from_trip"
        | "delete_content"
        | "other"
      moderation_report_status:
        | "open"
        | "under_review"
        | "resolved"
        | "dismissed"
      notification_channel: "email" | "push" | "sms" | "discord"
      payment_status:
        | "succeeded"
        | "failed"
        | "pending"
        | "refunded"
        | "disputed"
      poll_type: "single" | "multiple" | "ranked"
      privacy_visibility: "private" | "leaders_only" | "members" | "public"
      proposal_option_kind: "location" | "time_window" | "activity" | "other"
      proposal_status:
        | "draft"
        | "open"
        | "closed"
        | "accepted"
        | "rejected"
        | "expired"
      trip_kind:
        | "outdoor"
        | "indoor"
        | "social"
        | "service"
        | "admin"
        | "travel"
      trip_participant_role:
        | "participant"
        | "leader"
        | "co_leader"
        | "sweeper"
        | "medic"
        | "photographer"
        | "driver"
        | "gear_coordinator"
      trip_rsvp_status:
        | "going"
        | "maybe"
        | "not_going"
        | "waitlisted"
        | "invited"
        | "removed"
      trip_status: "draft" | "published" | "full" | "canceled" | "completed"
      trip_visibility: "members" | "leaders_only" | "invite_only" | "public"
      vehicle_type:
        | "sedan"
        | "suv"
        | "truck"
        | "van"
        | "wagon"
        | "coupe"
        | "motorcycle"
        | "other"
      waypoint_kind:
        | "meeting_spot"
        | "parking"
        | "trailhead"
        | "junction"
        | "water"
        | "campsite"
        | "objective"
        | "viewpoint"
        | "hazard"
        | "bailout"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      attendance_status: [
        "unknown",
        "attended",
        "no_show",
        "canceled",
        "left_early",
      ],
      custom_question_type: [
        "boolean",
        "number",
        "text",
        "select_one",
        "select_many",
        "slider",
      ],
      gear_condition: ["new", "good", "worn", "needs_repair", "retired"],
      itinerary_segment_kind: [
        "meetup",
        "drive",
        "approach",
        "objective",
        "break",
        "camp",
        "return",
        "food",
        "other",
      ],
      member_role: ["regular", "leader", "admin", "board", "founder", "staff"],
      membership_state: [
        "active",
        "inactive",
        "pending",
        "past_due",
        "canceled",
        "suspended",
        "banned",
      ],
      moderation_action_type: [
        "warn",
        "mute",
        "suspend",
        "ban",
        "remove_from_trip",
        "delete_content",
        "other",
      ],
      moderation_report_status: [
        "open",
        "under_review",
        "resolved",
        "dismissed",
      ],
      notification_channel: ["email", "push", "sms", "discord"],
      payment_status: [
        "succeeded",
        "failed",
        "pending",
        "refunded",
        "disputed",
      ],
      poll_type: ["single", "multiple", "ranked"],
      privacy_visibility: ["private", "leaders_only", "members", "public"],
      proposal_option_kind: ["location", "time_window", "activity", "other"],
      proposal_status: [
        "draft",
        "open",
        "closed",
        "accepted",
        "rejected",
        "expired",
      ],
      trip_kind: ["outdoor", "indoor", "social", "service", "admin", "travel"],
      trip_participant_role: [
        "participant",
        "leader",
        "co_leader",
        "sweeper",
        "medic",
        "photographer",
        "driver",
        "gear_coordinator",
      ],
      trip_rsvp_status: [
        "going",
        "maybe",
        "not_going",
        "waitlisted",
        "invited",
        "removed",
      ],
      trip_status: ["draft", "published", "full", "canceled", "completed"],
      trip_visibility: ["members", "leaders_only", "invite_only", "public"],
      vehicle_type: [
        "sedan",
        "suv",
        "truck",
        "van",
        "wagon",
        "coupe",
        "motorcycle",
        "other",
      ],
      waypoint_kind: [
        "meeting_spot",
        "parking",
        "trailhead",
        "junction",
        "water",
        "campsite",
        "objective",
        "viewpoint",
        "hazard",
        "bailout",
        "other",
      ],
    },
  },
} as const
