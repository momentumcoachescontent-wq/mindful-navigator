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
  public: {
    Tables: {
      daily_missions: {
        Row: {
          completed_at: string
          id: string
          metadata: Json | null
          mission_date: string
          mission_id: string
          mission_type: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          id?: string
          metadata?: Json | null
          mission_date?: string
          mission_id: string
          mission_type: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          id?: string
          metadata?: Json | null
          mission_date?: string
          mission_id?: string
          mission_type?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      daily_reflections: {
        Row: {
          author: string | null
          category: string | null
          content: string
          created_at: string
          display_date: string | null
          id: string
          is_active: boolean
          order_index: number | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          created_at?: string
          display_date?: string | null
          id?: string
          is_active?: boolean
          order_index?: number | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          created_at?: string
          display_date?: string | null
          id?: string
          is_active?: boolean
          order_index?: number | null
        }
        Relationships: []
      }
      daily_victories: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          user_id: string
          victory_date: string
          victory_text: string
          xp_bonus: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          user_id: string
          victory_date?: string
          victory_text: string
          xp_bonus?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          user_id?: string
          victory_date?: string
          victory_text?: string
          xp_bonus?: number | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string | null
          created_at: string
          energy_score: number | null
          entry_type: string | null
          id: string
          metadata: Json | null
          mood_score: number | null
          stress_score: number | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          energy_score?: number | null
          entry_type?: string | null
          id?: string
          metadata?: Json | null
          mood_score?: number | null
          stress_score?: number | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          energy_score?: number | null
          entry_type?: string | null
          id?: string
          metadata?: Json | null
          mood_score?: number | null
          stress_score?: number | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      meditation_logs: {
        Row: {
          completed: boolean | null
          created_at: string
          duration_seconds: number
          id: string
          meditation_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          duration_seconds: number
          id?: string
          meditation_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          duration_seconds?: number
          id?: string
          meditation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meditation_logs_meditation_id_fkey"
            columns: ["meditation_id"]
            isOneToOne: false
            referencedRelation: "meditations"
            referencedColumns: ["id"]
          },
        ]
      }
      meditations: {
        Row: {
          audio_url: string | null
          category: string
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          is_free: boolean
          narrator: string | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          audio_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_free?: boolean
          narrator?: string | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          audio_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_free?: boolean
          narrator?: string | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          goals: string[] | null
          id: string
          is_admin: boolean | null
          is_premium: boolean | null
          is_ranking_private: boolean | null
          last_check_in_date: string | null
          notifications_email: boolean | null
          notifications_push: boolean | null
          occupation: string | null
          onboarding_completed: boolean | null
          premium_until: string | null
          streak_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          goals?: string[] | null
          id?: string
          is_admin?: boolean | null
          is_premium?: boolean | null
          is_ranking_private?: boolean | null
          last_check_in_date?: string | null
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          premium_until?: string | null
          streak_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          goals?: string[] | null
          id?: string
          is_admin?: boolean | null
          is_premium?: boolean | null
          is_ranking_private?: boolean | null
          last_check_in_date?: string | null
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          premium_until?: string | null
          streak_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scanner_history: {
        Row: {
          action_plan: Json | null
          ai_response: string | null
          alert_level: string | null
          created_at: string
          id: string
          recommended_tools: string[] | null
          red_flags: string[] | null
          situation_text: string
          user_id: string
        }
        Insert: {
          action_plan?: Json | null
          ai_response?: string | null
          alert_level?: string | null
          created_at?: string
          id?: string
          recommended_tools?: string[] | null
          red_flags?: string[] | null
          situation_text: string
          user_id: string
        }
        Update: {
          action_plan?: Json | null
          ai_response?: string | null
          alert_level?: string | null
          created_at?: string
          id?: string
          recommended_tools?: string[] | null
          red_flags?: string[] | null
          situation_text?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_cards: {
        Row: {
          card_type: string
          content: string
          created_at: string
          id: string
          is_favorite: boolean | null
          reminder_time: string | null
          title: string
          user_id: string
        }
        Insert: {
          card_type: string
          content: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          reminder_time?: string | null
          title: string
          user_id: string
        }
        Update: {
          card_type?: string
          content?: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          reminder_time?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          category: string
          color: string
          content: Json
          created_at: string
          description: string
          icon: string
          id: string
          is_premium: boolean
          order_index: number | null
          title: string
        }
        Insert: {
          category: string
          color?: string
          content?: Json
          created_at?: string
          description: string
          icon?: string
          id: string
          is_premium?: boolean
          order_index?: number | null
          title: string
        }
        Update: {
          category?: string
          color?: string
          content?: Json
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_premium?: boolean
          order_index?: number | null
          title?: string
        }
        Relationships: []
      }
      trusted_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          meditation_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meditation_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meditation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_meditation_id_fkey"
            columns: ["meditation_id"]
            isOneToOne: false
            referencedRelation: "meditations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string
          current_level: string
          id: string
          power_tokens: number
          streak_rescues_available: number
          streak_rescues_used: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: string
          id?: string
          power_tokens?: number
          streak_rescues_available?: number
          streak_rescues_used?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: string
          id?: string
          power_tokens?: number
          streak_rescues_available?: number
          streak_rescues_used?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_stats: { Args: never; Returns: Json }
      is_user_premium: { Args: { check_user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
