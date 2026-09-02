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
    PostgrestVersion: '14.1'
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
          phone: string | null
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
          phone?: string | null
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
          phone?: string | null
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
          capacity: number | null
          cover_image_path: string | null
          created_at: string
          created_by: string
          description_public: string | null
          difficulty: Database['public']['Enums']['trip_difficulty']
          ends_at: string
          id: string
          is_official: boolean
          location_public: string | null
          rsvp_deadline: string | null
          starts_at: string
          time_zone: string
          title: string
          updated_at: string
          visibility: Database['public']['Enums']['trip_visibility']
          waitlist_enabled: boolean
        }
        Insert: {
          activity_id?: string | null
          capacity?: number | null
          cover_image_path?: string | null
          created_at?: string
          created_by: string
          description_public?: string | null
          difficulty?: Database['public']['Enums']['trip_difficulty']
          ends_at: string
          id?: string
          is_official?: boolean
          location_public?: string | null
          rsvp_deadline?: string | null
          starts_at: string
          time_zone?: string
          title: string
          updated_at?: string
          visibility?: Database['public']['Enums']['trip_visibility']
          waitlist_enabled?: boolean
        }
        Update: {
          activity_id?: string | null
          capacity?: number | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string
          description_public?: string | null
          difficulty?: Database['public']['Enums']['trip_difficulty']
          ends_at?: string
          id?: string
          is_official?: boolean
          location_public?: string | null
          rsvp_deadline?: string | null
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
      is_active_member: { Args: { p_uid: string }; Returns: boolean }
      is_banned: { Args: { p_uid: string }; Returns: boolean }
      is_staff_or_admin: { Args: { p_uid: string }; Returns: boolean }
      try_uuid: { Args: { p: string }; Returns: string }
    }
    Enums: {
      carpool_kind: 'offer' | 'need'
      club_role: 'regular' | 'staff' | 'leadership' | 'admin'
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
    },
  },
} as const
