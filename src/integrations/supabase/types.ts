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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          invoice_id: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          invoice_id?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          invoice_id?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_settings: {
        Row: {
          accent_color: string | null
          created_at: string
          footer_text: string | null
          id: string
          terms_and_conditions: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          footer_text?: string | null
          id?: string
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          footer_text?: string | null
          id?: string
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      budget_lines: {
        Row: {
          budget_id: string
          category: string
          created_at: string
          description: string
          id: string
          position: number
          quantity: number
          status: string
          unit_price: number
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          budget_id: string
          category?: string
          created_at?: string
          description: string
          id?: string
          position?: number
          quantity?: number
          status?: string
          unit_price?: number
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          budget_id?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          position?: number
          quantity?: number
          status?: string
          unit_price?: number
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          concept_id: string | null
          contingency_type: string
          contingency_value: number
          created_at: string
          currency: string
          event_id: string
          id: string
          internal_notes: string | null
          notes: string | null
          parent_id: string | null
          shared_at: string | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          concept_id?: string | null
          contingency_type?: string
          contingency_value?: number
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          internal_notes?: string | null
          notes?: string | null
          parent_id?: string | null
          shared_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Update: {
          concept_id?: string | null
          contingency_type?: string
          contingency_value?: number
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          internal_notes?: string | null
          notes?: string | null
          parent_id?: string | null
          shared_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_financials"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "budgets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          event_type: string | null
          id: string
          name: string
          notes: Json | null
          phone: string | null
          pipeline_stage: string | null
          portal_token: string | null
          portal_token_expires_at: string | null
          portal_token_rotated_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          event_type?: string | null
          id?: string
          name: string
          notes?: Json | null
          phone?: string | null
          pipeline_stage?: string | null
          portal_token?: string | null
          portal_token_expires_at?: string | null
          portal_token_rotated_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          event_type?: string | null
          id?: string
          name?: string
          notes?: Json | null
          phone?: string | null
          pipeline_stage?: string | null
          portal_token?: string | null
          portal_token_expires_at?: string | null
          portal_token_rotated_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      concepts: {
        Row: {
          created_at: string
          event_id: string
          id: string
          name: string
          position: number
          shared_at: string | null
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          name: string
          position?: number
          shared_at?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          position?: number
          shared_at?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concepts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_financials"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "concepts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          client_id: string | null
          created_at: string
          date: string
          deleted_at: string | null
          event_date: string | null
          event_time: string | null
          id: string
          name: string
          notes: string | null
          status: string | null
          time: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date: string
          deleted_at?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          time?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date?: string
          deleted_at?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          time?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string | null
          deleted_at: string | null
          event_id: string | null
          fx_rate: number | null
          id: string
          notes: string
          paid: boolean
          receipt_url: string
          spent_on: string
          updated_at: string
          vendor: string
          vendor_id: string | null
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          event_id?: string | null
          fx_rate?: number | null
          id?: string
          notes?: string
          paid?: boolean
          receipt_url?: string
          spent_on?: string
          updated_at?: string
          vendor?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          event_id?: string | null
          fx_rate?: number | null
          id?: string
          notes?: string
          paid?: boolean
          receipt_url?: string
          spent_on?: string
          updated_at?: string
          vendor?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_financials"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_payables"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      fx_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          note: string
          quote_currency: string
          rate: number
          rate_date: string
          updated_at: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          note?: string
          quote_currency: string
          rate: number
          rate_date?: string
          updated_at?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          note?: string
          quote_currency?: string
          rate?: number
          rate_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          created_at: string
          deleted_at: string | null
          dietary: string
          email: string
          event_id: string | null
          id: string
          name: string
          phone: string
          rsvp: string
          table_group: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          dietary?: string
          email?: string
          event_id?: string | null
          id?: string
          name: string
          phone?: string
          rsvp?: string
          table_group?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          dietary?: string
          email?: string
          event_id?: string | null
          id?: string
          name?: string
          phone?: string
          rsvp?: string
          table_group?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_financials"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_boards: {
        Row: {
          concept_id: string | null
          cover_item_id: string | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          shared_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          concept_id?: string | null
          cover_item_id?: string | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          shared_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          concept_id?: string | null
          cover_item_id?: string | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          shared_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_boards_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspiration_boards_cover_item_fkey"
            columns: ["cover_item_id"]
            isOneToOne: false
            referencedRelation: "inspiration_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspiration_boards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_financials"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "inspiration_boards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_items: {
        Row: {
          board_id: string
          caption: string | null
          category: string | null
          created_at: string
          id: string
          position: number
          source_url: string | null
          storage_path: string
        }
        Insert: {
          board_id: string
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          position?: number
          source_url?: string | null
          storage_path: string
        }
        Update: {
          board_id?: string
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          position?: number
          source_url?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_items_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "inspiration_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_comments: {
        Row: {
          author: string
          body: string
          created_at: string
          id: string
          invoice_id: string
        }
        Insert: {
          author?: string
          body: string
          created_at?: string
          id?: string
          invoice_id: string
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_comments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          assigned_to: string | null
          billing_type: string | null
          client_id: string | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          discount_amount: number | null
          discount_type: string | null
          discount_value: number | null
          due_date: string
          due_on: string | null
          event_id: string | null
          fx_rate: number | null
          id: string
          internal_notes: string | null
          last_sent_at: string | null
          milestones: Json | null
          notes: string | null
          parent_id: string | null
          reminder_sent_at: string | null
          status: string
          tax_rate: number | null
          updated_at: string
          version: number | null
        }
        Insert: {
          assigned_to?: string | null
          billing_type?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          due_date: string
          due_on?: string | null
          event_id?: string | null
          fx_rate?: number | null
          id?: string
          internal_notes?: string | null
          last_sent_at?: string | null
          milestones?: Json | null
          notes?: string | null
          parent_id?: string | null
          reminder_sent_at?: string | null
          status?: string
          tax_rate?: number | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          assigned_to?: string | null
          billing_type?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          due_date?: string
          due_on?: string | null
          event_id?: string | null
          fx_rate?: number | null
          id?: string
          internal_notes?: string | null
          last_sent_at?: string | null
          milestones?: Json | null
          notes?: string | null
          parent_id?: string | null
          reminder_sent_at?: string | null
          status?: string
          tax_rate?: number | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_financials"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_responses: {
        Row: {
          action: string
          body: string | null
          client_id: string
          created_at: string
          event_id: string | null
          id: string
          subject_id: string
          subject_type: string
        }
        Insert: {
          action: string
          body?: string | null
          client_id: string
          created_at?: string
          event_id?: string | null
          id?: string
          subject_id: string
          subject_type: string
        }
        Update: {
          action?: string
          body?: string | null
          client_id?: string
          created_at?: string
          event_id?: string | null
          id?: string
          subject_id?: string
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_responses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_financials"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "portal_responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string
          completed: boolean
          created_at: string
          deleted_at: string | null
          due_on: string | null
          event_id: string | null
          id: string
          priority: string
          stage: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string
          completed?: boolean
          created_at?: string
          deleted_at?: string | null
          due_on?: string | null
          event_id?: string | null
          id?: string
          priority?: string
          stage?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string
          completed?: boolean
          created_at?: string
          deleted_at?: string | null
          due_on?: string | null
          event_id?: string | null
          id?: string
          priority?: string
          stage?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_financials"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_option_items: {
        Row: {
          created_at: string
          description: string | null
          headline: string | null
          id: string
          image_path: string | null
          link_url: string | null
          option_id: string
          position: number
          price: number | null
          vendor_id: string | null
          vendor_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          headline?: string | null
          id?: string
          image_path?: string | null
          link_url?: string | null
          option_id: string
          position?: number
          price?: number | null
          vendor_id?: string | null
          vendor_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          headline?: string | null
          id?: string
          image_path?: string | null
          link_url?: string | null
          option_id?: string
          position?: number
          price?: number | null
          vendor_id?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_option_items_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "vendor_options"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_options: {
        Row: {
          category: string | null
          concept_id: string | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          selection_mode: string
          shared_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          concept_id?: string | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          selection_mode?: string
          shared_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          concept_id?: string | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          selection_mode?: string
          shared_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_options_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_options_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_financials"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "vendor_options_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: string
          contact: string
          created_at: string
          deleted_at: string | null
          event_ids: string[]
          id: string
          name: string
          notes: string
          rating: number
          updated_at: string
        }
        Insert: {
          category?: string
          contact?: string
          created_at?: string
          deleted_at?: string | null
          event_ids?: string[]
          id?: string
          name: string
          notes?: string
          rating?: number
          updated_at?: string
        }
        Update: {
          category?: string
          contact?: string
          created_at?: string
          deleted_at?: string | null
          event_ids?: string[]
          id?: string
          name?: string
          notes?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      event_financials: {
        Row: {
          client_id: string | null
          event_id: string | null
          event_name: string | null
          invoiced: number | null
          margin: number | null
          margin_pct: number | null
          paid: number | null
          spent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payables: {
        Row: {
          billed: number | null
          category: string | null
          last_activity: string | null
          open_items: number | null
          outstanding: number | null
          settled: number | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      backfill_portal_tokens: { Args: never; Returns: number }
      calc_invoice_totals: {
        Args: {
          _discount_type: string
          _discount_value: number
          _subtotal: number
          _tax_rate: number
        }
        Returns: {
          after_discount: number
          discount: number
          grand_total: number
          subtotal: number
          tax: number
        }[]
      }
      can_assist: { Args: never; Returns: boolean }
      can_write: { Args: never; Returns: boolean }
      current_portal_token: { Args: never; Returns: string }
      fx_rate_on: { Args: { _currency: string; _on?: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invoice_totals: {
        Args: { _invoice_id: string }
        Returns: {
          after_discount: number
          discount: number
          grand_total: number
          subtotal: number
          tax: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      mark_overdue_invoices: { Args: never; Returns: undefined }
      portal_client_access: { Args: { _client_id: string }; Returns: boolean }
      portal_client_from_token: { Args: never; Returns: string }
      portal_current_client: {
        Args: never
        Returns: {
          email: string
          id: string
          name: string
          phone: string
        }[]
      }
      portal_event_access: { Args: { p_event_id: string }; Returns: boolean }
      portal_invoice_access: { Args: { _invoice_id: string }; Returns: boolean }
      rotate_portal_token: { Args: { p_client_id: string }; Returns: string }
      test_invoice_totals: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "planner" | "assistant" | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "planner", "assistant", "viewer"],
    },
  },
} as const
