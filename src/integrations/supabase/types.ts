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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      arbitration_messages: {
        Row: {
          attachment_names: string[]
          attachment_urls: string[]
          body: string
          created_at: string
          id: string
          instructor_id: string
          room_id: string
          sender_name: string
          sender_role: string
        }
        Insert: {
          attachment_names?: string[]
          attachment_urls?: string[]
          body: string
          created_at?: string
          id?: string
          instructor_id: string
          room_id: string
          sender_name: string
          sender_role: string
        }
        Update: {
          attachment_names?: string[]
          attachment_urls?: string[]
          body?: string
          created_at?: string
          id?: string
          instructor_id?: string
          room_id?: string
          sender_name?: string
          sender_role?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          base_price: number
          cancel_reason: string | null
          cancel_requested_at: string | null
          companion_names: string | null
          companions: Json
          coupon_code: string | null
          created_at: string
          deposit_status: string
          discount_amount: number | null
          diver_id: string
          diver_name: string
          drinking: boolean
          evidence_file_names: string[] | null
          flight_info: string | null
          gender: string
          id: string
          on_site_balance: number
          options_cost: number
          participant_count: number
          passport_info: string | null
          payment_method: string
          platform_fee: number
          refund_amount: number | null
          refund_rate: number | null
          room_no: string | null
          room_note: string | null
          selected_options: Json
          smoking: boolean
          snoring: boolean
          status: string
          total_paid: number
          tour_id: string
        }
        Insert: {
          base_price: number
          cancel_reason?: string | null
          cancel_requested_at?: string | null
          companion_names?: string | null
          companions?: Json
          coupon_code?: string | null
          created_at?: string
          deposit_status?: string
          discount_amount?: number | null
          diver_id: string
          diver_name: string
          drinking?: boolean
          evidence_file_names?: string[] | null
          flight_info?: string | null
          gender: string
          id?: string
          on_site_balance?: number
          options_cost?: number
          participant_count?: number
          passport_info?: string | null
          payment_method: string
          platform_fee?: number
          refund_amount?: number | null
          refund_rate?: number | null
          room_no?: string | null
          room_note?: string | null
          selected_options?: Json
          smoking?: boolean
          snoring?: boolean
          status?: string
          total_paid?: number
          tour_id: string
        }
        Update: {
          base_price?: number
          cancel_reason?: string | null
          cancel_requested_at?: string | null
          companion_names?: string | null
          companions?: Json
          coupon_code?: string | null
          created_at?: string
          deposit_status?: string
          discount_amount?: number | null
          diver_id?: string
          diver_name?: string
          drinking?: boolean
          evidence_file_names?: string[] | null
          flight_info?: string | null
          gender?: string
          id?: string
          on_site_balance?: number
          options_cost?: number
          participant_count?: number
          passport_info?: string | null
          payment_method?: string
          platform_fee?: number
          refund_amount?: number | null
          refund_rate?: number | null
          room_no?: string | null
          room_note?: string | null
          selected_options?: Json
          smoking?: boolean
          snoring?: boolean
          status?: string
          total_paid?: number
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      centers: {
        Row: {
          address: string
          country: string | null
          created_at: string
          features: string[]
          google_map: string | null
          homepage: string | null
          id: string
          instagram: string | null
          name: string
          phone: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          country?: string | null
          created_at?: string
          features?: string[]
          google_map?: string | null
          homepage?: string | null
          id?: string
          instagram?: string | null
          name: string
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          country?: string | null
          created_at?: string
          features?: string[]
          google_map?: string | null
          homepage?: string | null
          id?: string
          instagram?: string | null
          name?: string
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_name: string
          sender_profile_id: string
          sender_role: string
          tour_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_name: string
          sender_profile_id: string
          sender_role: string
          tour_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_name?: string
          sender_profile_id?: string
          sender_role?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_discount: number | null
          min_purchase: number
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_purchase?: number
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_purchase?: number
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      deleted_accounts: {
        Row: {
          deleted_at: string
          email: string | null
          id: string
          original_user_id: string
          phone: string | null
        }
        Insert: {
          deleted_at?: string
          email?: string | null
          id?: string
          original_user_id: string
          phone?: string | null
        }
        Update: {
          deleted_at?: string
          email?: string | null
          id?: string
          original_user_id?: string
          phone?: string | null
        }
        Relationships: []
      }
      game_players: {
        Row: {
          created_at: string
          current_points: number
          daily_points_date: string
          daily_points_earned: number
          equipped_skin: string
          hearts_remaining: number
          hearts_reset_date: string
          inventory: string[]
          max_depth: number
          nickname: string
          uid: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_points?: number
          daily_points_date?: string
          daily_points_earned?: number
          equipped_skin?: string
          hearts_remaining?: number
          hearts_reset_date?: string
          inventory?: string[]
          max_depth?: number
          nickname?: string
          uid: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_points?: number
          daily_points_date?: string
          daily_points_earned?: number
          equipped_skin?: string
          hearts_remaining?: number
          hearts_reset_date?: string
          inventory?: string[]
          max_depth?: number
          nickname?: string
          uid?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          booking_id: string | null
          category: string
          created_at: string
          diver_id: string
          id: string
          message: string
          status: string
          tour_id: string | null
        }
        Insert: {
          booking_id?: string | null
          category: string
          created_at?: string
          diver_id: string
          id?: string
          message: string
          status?: string
          tour_id?: string | null
        }
        Update: {
          booking_id?: string | null
          category?: string
          created_at?: string
          diver_id?: string
          id?: string
          message?: string
          status?: string
          tour_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_admin_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          instructor_id: string
          sender_name: string
          sender_role: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          instructor_id: string
          sender_name: string
          sender_role: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          instructor_id?: string
          sender_name?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_admin_notes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_notifications: {
        Row: {
          booking_id: string | null
          created_at: string
          diver_name: string | null
          id: string
          instructor_id: string
          message: string | null
          read: boolean
          selected_option_names: string[] | null
          settlement_amount: number | null
          tour_id: string
          tour_title: string
          type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          diver_name?: string | null
          id?: string
          instructor_id: string
          message?: string | null
          read?: boolean
          selected_option_names?: string[] | null
          settlement_amount?: number | null
          tour_id?: string
          tour_title: string
          type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          diver_name?: string | null
          id?: string
          instructor_id?: string
          message?: string | null
          read?: boolean
          selected_option_names?: string[] | null
          settlement_amount?: number | null
          tour_id?: string
          tour_title?: string
          type?: string
        }
        Relationships: []
      }
      instructors: {
        Row: {
          agency: string | null
          avatar_url: string | null
          bio: string | null
          business_type: string | null
          completion_rate: number
          created_at: string
          documents_pending_review: boolean
          experience_years: number
          favorite_diving: string | null
          id: string
          languages: string[] | null
          level: string | null
          license_file_names: string[] | null
          license_file_paths: string[] | null
          name: string
          penalty_count: number
          penalty_reason: string | null
          pledge_signed: boolean
          pledge_signed_at: string | null
          pledge_version: string | null
          profile_id: string | null
          rating: number
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          settlement_consents: Json
          signature_data_url: string | null
          sns_blog: string | null
          sns_facebook: string | null
          sns_homepage: string | null
          sns_instagram: string | null
          sns_youtube: string | null
          specialty_tags: string[] | null
          teaching_philosophy: string | null
          total_logs: number
          verified_at: string | null
          verified_by: string | null
          verified_status: boolean
        }
        Insert: {
          agency?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_type?: string | null
          completion_rate?: number
          created_at?: string
          documents_pending_review?: boolean
          experience_years?: number
          favorite_diving?: string | null
          id: string
          languages?: string[] | null
          level?: string | null
          license_file_names?: string[] | null
          license_file_paths?: string[] | null
          name: string
          penalty_count?: number
          penalty_reason?: string | null
          pledge_signed?: boolean
          pledge_signed_at?: string | null
          pledge_version?: string | null
          profile_id?: string | null
          rating?: number
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          settlement_consents?: Json
          signature_data_url?: string | null
          sns_blog?: string | null
          sns_facebook?: string | null
          sns_homepage?: string | null
          sns_instagram?: string | null
          sns_youtube?: string | null
          specialty_tags?: string[] | null
          teaching_philosophy?: string | null
          total_logs?: number
          verified_at?: string | null
          verified_by?: string | null
          verified_status?: boolean
        }
        Update: {
          agency?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_type?: string | null
          completion_rate?: number
          created_at?: string
          documents_pending_review?: boolean
          experience_years?: number
          favorite_diving?: string | null
          id?: string
          languages?: string[] | null
          level?: string | null
          license_file_names?: string[] | null
          license_file_paths?: string[] | null
          name?: string
          penalty_count?: number
          penalty_reason?: string | null
          pledge_signed?: boolean
          pledge_signed_at?: string | null
          pledge_version?: string | null
          profile_id?: string | null
          rating?: number
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          settlement_consents?: Json
          signature_data_url?: string | null
          sns_blog?: string | null
          sns_facebook?: string | null
          sns_homepage?: string | null
          sns_instagram?: string | null
          sns_youtube?: string | null
          specialty_tags?: string[] | null
          teaching_philosophy?: string | null
          total_logs?: number
          verified_at?: string | null
          verified_by?: string | null
          verified_status?: boolean
        }
        Relationships: []
      }
      invoices: {
        Row: {
          booking_id: string
          gmv_amount: number
          id: string
          instructor_amount: number
          issued_at: string
          payout_id: string | null
          period: string
          platform_fee_amount: number
          refund_amount: number
        }
        Insert: {
          booking_id: string
          gmv_amount: number
          id: string
          instructor_amount: number
          issued_at?: string
          payout_id?: string | null
          period: string
          platform_fee_amount: number
          refund_amount?: number
        }
        Update: {
          booking_id?: string
          gmv_amount?: number
          id?: string
          instructor_amount?: number
          issued_at?: string
          payout_id?: string | null
          period?: string
          platform_fee_amount?: number
          refund_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      mimo_reservations: {
        Row: {
          created_at: string
          payment_method: string | null
          payment_status: string
          price: number
          reservation_id: string
          salon_id: string
          service_name: string
          start_time: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          payment_method?: string | null
          payment_status?: string
          price: number
          reservation_id?: string
          salon_id: string
          service_name: string
          start_time: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          payment_method?: string | null
          payment_status?: string
          price?: number
          reservation_id?: string
          salon_id?: string
          service_name?: string
          start_time?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mimo_reservations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "mimo_salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mimo_reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mimo_users"
            referencedColumns: ["uid"]
          },
        ]
      }
      mimo_salons: {
        Row: {
          address: string
          categories: string[]
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          photos: string[]
          rating: number
          services: Json
          status: boolean
        }
        Insert: {
          address: string
          categories?: string[]
          created_at?: string
          id: string
          lat: number
          lng: number
          name: string
          photos?: string[]
          rating?: number
          services?: Json
          status?: boolean
        }
        Update: {
          address?: string
          categories?: string[]
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          photos?: string[]
          rating?: number
          services?: Json
          status?: boolean
        }
        Relationships: []
      }
      mimo_users: {
        Row: {
          created_at: string
          favorites: string[]
          name: string
          phone: string | null
          uid: string
        }
        Insert: {
          created_at?: string
          favorites?: string[]
          name: string
          phone?: string | null
          uid: string
        }
        Update: {
          created_at?: string
          favorites?: string[]
          name?: string
          phone?: string | null
          uid?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          pinned: boolean
          title: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          pinned?: boolean
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          booking_id: string | null
          business_type_at_payout: string | null
          created_at: string
          first_amount: number
          id: string
          instructor_id: string
          net_payout_amount: number | null
          paid_at: string | null
          refunded_at: string | null
          scheduled_at: string | null
          second_amount: number
          status: string
          withholding_tax_amount: number
          withholding_tax_rate: number
        }
        Insert: {
          booking_id?: string | null
          business_type_at_payout?: string | null
          created_at?: string
          first_amount?: number
          id?: string
          instructor_id: string
          net_payout_amount?: number | null
          paid_at?: string | null
          refunded_at?: string | null
          scheduled_at?: string | null
          second_amount?: number
          status?: string
          withholding_tax_amount?: number
          withholding_tax_rate?: number
        }
        Update: {
          booking_id?: string | null
          business_type_at_payout?: string | null
          created_at?: string
          first_amount?: number
          id?: string
          instructor_id?: string
          net_payout_amount?: number | null
          paid_at?: string | null
          refunded_at?: string | null
          scheduled_at?: string | null
          second_amount?: number
          status?: string
          withholding_tax_amount?: number
          withholding_tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      penalties_log: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instructor_id: string
          violation_type: string
          voided: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instructor_id: string
          violation_type: string
          voided?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instructor_id?: string
          violation_type?: string
          voided?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "penalties_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          rate: string | null
          sort_order: number
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          rate?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          rate?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_holder: string | null
          account_number: string | null
          avatar_url: string | null
          bank_name: string | null
          bankbook_file_name: string | null
          bankbook_path: string | null
          bio: string | null
          birth_date: string | null
          c_card_agency: string | null
          c_card_number: string | null
          c_card_photo_path: string | null
          created_at: string
          deleted_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          id: string
          id_document_path: string | null
          insurance_info: string | null
          log_count: number | null
          name: string
          phone: string | null
          pledge_settlement_agreed: boolean
          pledge_settlement_agreed_at: string | null
          role: string
          smoking: boolean | null
          snoring: boolean | null
          status: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          avatar_url?: string | null
          bank_name?: string | null
          bankbook_file_name?: string | null
          bankbook_path?: string | null
          bio?: string | null
          birth_date?: string | null
          c_card_agency?: string | null
          c_card_number?: string | null
          c_card_photo_path?: string | null
          created_at?: string
          deleted_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id: string
          id_document_path?: string | null
          insurance_info?: string | null
          log_count?: number | null
          name: string
          phone?: string | null
          pledge_settlement_agreed?: boolean
          pledge_settlement_agreed_at?: string | null
          role?: string
          smoking?: boolean | null
          snoring?: boolean | null
          status?: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          avatar_url?: string | null
          bank_name?: string | null
          bankbook_file_name?: string | null
          bankbook_path?: string | null
          bio?: string | null
          birth_date?: string | null
          c_card_agency?: string | null
          c_card_number?: string | null
          c_card_photo_path?: string | null
          created_at?: string
          deleted_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          id_document_path?: string | null
          insurance_info?: string | null
          log_count?: number | null
          name?: string
          phone?: string | null
          pledge_settlement_agreed?: boolean
          pledge_settlement_agreed_at?: string | null
          role?: string
          smoking?: boolean | null
          snoring?: boolean | null
          status?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_checklist_results: {
        Row: {
          checked_at: string | null
          item_id: number
          note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          checked_at?: string | null
          item_id: number
          note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          checked_at?: string | null
          item_id?: number
          note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          reason: string | null
          refunded_by: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          reason?: string | null
          refunded_by?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          refunded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          target_id: string
          target_name: string
          target_type: string
          violation_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          target_id: string
          target_name: string
          target_type: string
          violation_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          target_id?: string
          target_name?: string
          target_type?: string
          violation_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          category_ratings: Json | null
          comment: string | null
          created_at: string
          deleted: boolean
          diver_id: string
          id: string
          instructor_id: string | null
          instructor_reply: string | null
          instructor_reply_at: string | null
          photos: string[]
          rating: number
          reported: boolean
          title: string | null
          tour_id: string
          video_url: string | null
        }
        Insert: {
          booking_id?: string | null
          category_ratings?: Json | null
          comment?: string | null
          created_at?: string
          deleted?: boolean
          diver_id: string
          id?: string
          instructor_id?: string | null
          instructor_reply?: string | null
          instructor_reply_at?: string | null
          photos?: string[]
          rating: number
          reported?: boolean
          title?: string | null
          tour_id: string
          video_url?: string | null
        }
        Update: {
          booking_id?: string | null
          category_ratings?: Json | null
          comment?: string | null
          created_at?: string
          deleted?: boolean
          diver_id?: string
          id?: string
          instructor_id?: string | null
          instructor_reply?: string | null
          instructor_reply_at?: string | null
          photos?: string[]
          rating?: number
          reported?: boolean
          title?: string | null
          tour_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          attachment_names: string[]
          booking_id: string | null
          category: string | null
          content: string
          created_at: string
          id: string
          status: string
          title: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          attachment_names?: string[]
          booking_id?: string | null
          category?: string | null
          content: string
          created_at?: string
          id?: string
          status?: string
          title?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          attachment_names?: string[]
          booking_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          status?: string
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tour_cancellation_claims: {
        Row: {
          admin_note: string | null
          affected_booking_ids: string[]
          created_at: string
          evidence_file_urls: string[]
          id: string
          instructor_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tour_id: string
        }
        Insert: {
          admin_note?: string | null
          affected_booking_ids?: string[]
          created_at?: string
          evidence_file_urls?: string[]
          id?: string
          instructor_id: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tour_id: string
        }
        Update: {
          admin_note?: string | null
          affected_booking_ids?: string[]
          created_at?: string
          evidence_file_urls?: string[]
          id?: string
          instructor_id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_cancellation_claims_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_cancellation_claims_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          activity_types: string[]
          admin_status: string | null
          auto_close_processed: boolean
          base_price: number
          center_id: string | null
          certification_level: string
          country: string
          created_at: string
          custom_options: Json
          description: string
          end_date: string
          exclusions: string[]
          flight_info: Json | null
          gallery_urls: string[]
          id: string
          inclusions: string[]
          instructor_id: string
          instructor_notice: string | null
          is_confirmed: boolean
          itinerary_days: Json | null
          main_image_url: string
          max_participants: number
          meeting_point: string | null
          meeting_time: string | null
          min_log_count: number | null
          min_participants: number
          one_on_one_care: boolean
          pledge_agreed_at: string | null
          pledge_signature_data_url: string | null
          pledge_signer_name: string | null
          prep_notes: string
          rating: number
          recruitment_deadline: string
          site: string
          start_date: string
          status: string
          tags: string[] | null
          title: string
          under_min_decision_pending: boolean
          under_min_policy: string
          visibility_m: number
          water_temp_c: number
        }
        Insert: {
          activity_types?: string[]
          admin_status?: string | null
          auto_close_processed?: boolean
          base_price: number
          center_id?: string | null
          certification_level: string
          country: string
          created_at?: string
          custom_options?: Json
          description?: string
          end_date: string
          exclusions?: string[]
          flight_info?: Json | null
          gallery_urls?: string[]
          id?: string
          inclusions?: string[]
          instructor_id: string
          instructor_notice?: string | null
          is_confirmed?: boolean
          itinerary_days?: Json | null
          main_image_url: string
          max_participants?: number
          meeting_point?: string | null
          meeting_time?: string | null
          min_log_count?: number | null
          min_participants?: number
          one_on_one_care?: boolean
          pledge_agreed_at?: string | null
          pledge_signature_data_url?: string | null
          pledge_signer_name?: string | null
          prep_notes?: string
          rating?: number
          recruitment_deadline: string
          site: string
          start_date: string
          status?: string
          tags?: string[] | null
          title: string
          under_min_decision_pending?: boolean
          under_min_policy?: string
          visibility_m?: number
          water_temp_c?: number
        }
        Update: {
          activity_types?: string[]
          admin_status?: string | null
          auto_close_processed?: boolean
          base_price?: number
          center_id?: string | null
          certification_level?: string
          country?: string
          created_at?: string
          custom_options?: Json
          description?: string
          end_date?: string
          exclusions?: string[]
          flight_info?: Json | null
          gallery_urls?: string[]
          id?: string
          inclusions?: string[]
          instructor_id?: string
          instructor_notice?: string | null
          is_confirmed?: boolean
          itinerary_days?: Json | null
          main_image_url?: string
          max_participants?: number
          meeting_point?: string | null
          meeting_time?: string | null
          min_log_count?: number | null
          min_participants?: number
          one_on_one_care?: boolean
          pledge_agreed_at?: string | null
          pledge_signature_data_url?: string | null
          pledge_signer_name?: string | null
          prep_notes?: string
          rating?: number
          recruitment_deadline?: string
          site?: string
          start_date?: string
          status?: string
          tags?: string[] | null
          title?: string
          under_min_decision_pending?: boolean
          under_min_policy?: string
          visibility_m?: number
          water_temp_c?: number
        }
        Relationships: [
          {
            foreignKeyName: "tours_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_monthly_accounting: {
        Row: {
          booking_count: number | null
          gmv: number | null
          instructor_payout_total: number | null
          net_revenue: number | null
          period: string | null
          platform_fee_revenue: number | null
          refund_amount: number | null
        }
        Relationships: []
      }
      bookings_directory: {
        Row: {
          base_price: number | null
          cancel_reason: string | null
          cancel_requested_at: string | null
          companion_names: string | null
          companions: Json | null
          coupon_code: string | null
          created_at: string | null
          deposit_status: string | null
          discount_amount: number | null
          diver_id: string | null
          diver_name: string | null
          drinking: boolean | null
          evidence_file_names: string[] | null
          flight_info: string | null
          gender: string | null
          id: string | null
          on_site_balance: number | null
          options_cost: number | null
          participant_count: number | null
          passport_info: string | null
          payment_method: string | null
          platform_fee: number | null
          refund_amount: number | null
          refund_rate: number | null
          room_no: string | null
          room_note: string | null
          selected_options: Json | null
          smoking: boolean | null
          snoring: boolean | null
          status: string | null
          total_paid: number | null
          tour_id: string | null
        }
        Insert: {
          base_price?: never
          cancel_reason?: never
          cancel_requested_at?: never
          companion_names?: never
          companions?: never
          coupon_code?: never
          created_at?: string | null
          deposit_status?: never
          discount_amount?: never
          diver_id?: string | null
          diver_name?: never
          drinking?: never
          evidence_file_names?: never
          flight_info?: never
          gender?: never
          id?: string | null
          on_site_balance?: never
          options_cost?: never
          participant_count?: never
          passport_info?: never
          payment_method?: never
          platform_fee?: never
          refund_amount?: never
          refund_rate?: never
          room_no?: never
          room_note?: never
          selected_options?: never
          smoking?: never
          snoring?: never
          status?: string | null
          total_paid?: never
          tour_id?: string | null
        }
        Update: {
          base_price?: never
          cancel_reason?: never
          cancel_requested_at?: never
          companion_names?: never
          companions?: never
          coupon_code?: never
          created_at?: string | null
          deposit_status?: never
          discount_amount?: never
          diver_id?: string | null
          diver_name?: never
          drinking?: never
          evidence_file_names?: never
          flight_info?: never
          gender?: never
          id?: string | null
          on_site_balance?: never
          options_cost?: never
          participant_count?: never
          passport_info?: never
          payment_method?: never
          platform_fee?: never
          refund_amount?: never
          refund_rate?: never
          room_no?: never
          room_note?: never
          selected_options?: never
          smoking?: never
          snoring?: never
          status?: string | null
          total_paid?: never
          tour_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts_directory: {
        Row: {
          booking_id: string | null
          business_type_at_payout: string | null
          created_at: string | null
          first_amount: number | null
          id: string | null
          instructor_id: string | null
          net_payout_amount: number | null
          second_amount: number | null
          status: string | null
          withholding_tax_amount: number | null
          withholding_tax_rate: number | null
        }
        Insert: {
          booking_id?: string | null
          business_type_at_payout?: never
          created_at?: string | null
          first_amount?: never
          id?: string | null
          instructor_id?: string | null
          net_payout_amount?: never
          second_amount?: never
          status?: string | null
          withholding_tax_amount?: never
          withholding_tax_rate?: never
        }
        Update: {
          booking_id?: string | null
          business_type_at_payout?: never
          created_at?: string | null
          first_amount?: never
          id?: string | null
          instructor_id?: string | null
          net_payout_amount?: never
          second_amount?: never
          status?: string | null
          withholding_tax_amount?: never
          withholding_tax_rate?: never
        }
        Relationships: [
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_directory: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          bankbook_file_name: string | null
          bankbook_path: string | null
          birth_date: string | null
          c_card_agency: string | null
          c_card_number: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          id: string | null
          id_document_path: string | null
          insurance_info: string | null
          log_count: number | null
          name: string | null
          phone: string | null
          role: string | null
          smoking: boolean | null
          snoring: boolean | null
          status: string | null
        }
        Insert: {
          account_holder?: never
          account_number?: never
          bank_name?: never
          bankbook_file_name?: never
          bankbook_path?: never
          birth_date?: never
          c_card_agency?: never
          c_card_number?: never
          created_at?: string | null
          emergency_contact_name?: never
          emergency_contact_phone?: never
          gender?: never
          id?: string | null
          id_document_path?: never
          insurance_info?: never
          log_count?: never
          name?: string | null
          phone?: never
          role?: string | null
          smoking?: never
          snoring?: never
          status?: string | null
        }
        Update: {
          account_holder?: never
          account_number?: never
          bank_name?: never
          bankbook_file_name?: never
          bankbook_path?: never
          birth_date?: never
          c_card_agency?: never
          c_card_number?: never
          created_at?: string | null
          emergency_contact_name?: never
          emergency_contact_phone?: never
          gender?: never
          id?: string | null
          id_document_path?: never
          insurance_info?: never
          log_count?: never
          name?: string | null
          phone?: never
          role?: string | null
          smoking?: never
          snoring?: never
          status?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          role: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          role?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          role?: string | null
          status?: string | null
        }
        Relationships: []
      }
      public_tour_booking_counts: {
        Row: {
          confirmed_count: number | null
          tour_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_restore_settlement_after_claim: {
        Args: { p_booking_ids: string[] }
        Returns: undefined
      }
      admin_set_payout_status: {
        Args: { p_payout_id: string; p_status: string }
        Returns: undefined
      }
      apply_tour_auto_close: {
        Args: { p_meets_minimum: boolean; p_tour_id: string }
        Returns: undefined
      }
      cancel_booking_settlement: {
        Args: { p_booking_id: string; p_refund_amount: number }
        Returns: undefined
      }
      consume_game_heart: { Args: { p_uid: string }; Returns: number }
      create_booking_settlement: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      get_admin_monthly_accounting: {
        Args: { p_month: number; p_year: number }
        Returns: {
          booking_count: number
          estimated_vat: number
          gmv: number
          instructor_payout_total: number
          net_revenue: number
          period: string
          platform_fee_revenue: number
          refund_amount: number
        }[]
      }
      get_instructor_settlement_summary: {
        Args: { p_month: number; p_year: number }
        Returns: {
          booking_count: number
          gmv: number
          instructor_amount_paid: number
          instructor_amount_scheduled: number
          next_payout_date: string
          period: string
          platform_fee_amount: number
          refund_amount: number
        }[]
      }
      get_tour_participants_masked: {
        Args: { p_tour_id: string }
        Returns: {
          diver_id: string
          diver_name_masked: string
          drinking: boolean
          gender: string
          id: string
          participant_count: number
          room_no: string
          room_note: string
          selected_options: Json
          smoking: boolean
          snoring: boolean
          status: string
        }[]
      }
      grant_continue_heart: { Args: { p_uid: string }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_booking_companion: {
        Args: { p_diver_id: string; p_tour_id: string }
        Returns: boolean
      }
      is_booking_staff: {
        Args: { p_diver_id: string; p_tour_id: string }
        Returns: boolean
      }
      is_profile_staff_for: { Args: { p_profile_id: string }; Returns: boolean }
      is_recently_deleted_account: {
        Args: { p_email: string }
        Returns: boolean
      }
      is_tour_companion_of: { Args: { p_profile_id: string }; Returns: boolean }
      owns_booking: { Args: { p_booking_id: string }; Returns: boolean }
      owns_booking_tour: { Args: { p_booking_id: string }; Returns: boolean }
      owns_instructor: { Args: { p_instructor_id: string }; Returns: boolean }
      owns_tour: { Args: { p_tour_id: string }; Returns: boolean }
      redeem_coupon: { Args: { p_coupon_id: string }; Returns: undefined }
      report_review: { Args: { p_review_id: string }; Returns: undefined }
      set_equipped_skin: {
        Args: { p_skin: string; p_uid: string }
        Returns: undefined
      }
      settle_dive_score: {
        Args: { p_depth: number; p_nickname: string; p_uid: string }
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
