export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      agencies: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      agency_brain_entries: {
        Row: {
          agency_id: string
          authenticity_score: number | null
          category: Database["public"]["Enums"]["agency_brain_category"]
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          source_client_id: string | null
          source_project_id: string | null
          tags: string[]
          times_used: number
          updated_at: string
        }
        Insert: {
          agency_id: string
          authenticity_score?: number | null
          category: Database["public"]["Enums"]["agency_brain_category"]
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          source_client_id?: string | null
          source_project_id?: string | null
          tags?: string[]
          times_used?: number
          updated_at?: string
        }
        Update: {
          agency_id?: string
          authenticity_score?: number | null
          category?: Database["public"]["Enums"]["agency_brain_category"]
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          source_client_id?: string | null
          source_project_id?: string | null
          tags?: string[]
          times_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_brain_entries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_brain_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_brain_entries_source_client_id_fkey"
            columns: ["source_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_brain_entries_source_project_id_fkey"
            columns: ["source_project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_branding: {
        Row: {
          agency_id: string
          brand_name: string | null
          custom_domain: string | null
          logo_url: string | null
          primary_color: string | null
          updated_at: string
          white_label: boolean
        }
        Insert: {
          agency_id: string
          brand_name?: string | null
          custom_domain?: string | null
          logo_url?: string | null
          primary_color?: string | null
          updated_at?: string
          white_label?: boolean
        }
        Update: {
          agency_id?: string
          brand_name?: string | null
          custom_domain?: string | null
          logo_url?: string | null
          primary_color?: string | null
          updated_at?: string
          white_label?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agency_branding_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_outputs: {
        Row: {
          agency_id: string
          agent: Database["public"]["Enums"]["agent_name"]
          created_at: string
          id: string
          payload: Json
          project_id: string
          run_id: string | null
          supersedes_id: string | null
          version: number
        }
        Insert: {
          agency_id: string
          agent: Database["public"]["Enums"]["agent_name"]
          created_at?: string
          id?: string
          payload: Json
          project_id: string
          run_id?: string | null
          supersedes_id?: string | null
          version?: number
        }
        Update: {
          agency_id?: string
          agent?: Database["public"]["Enums"]["agent_name"]
          created_at?: string
          id?: string
          payload?: Json
          project_id?: string
          run_id?: string | null
          supersedes_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_outputs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_outputs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_outputs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_outputs_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "agent_outputs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agency_id: string
          agent: Database["public"]["Enums"]["agent_name"]
          cost_usd: number | null
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          input_ref: Json
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["run_status"]
        }
        Insert: {
          agency_id: string
          agent: Database["public"]["Enums"]["agent_name"]
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input_ref?: Json
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
        }
        Update: {
          agency_id?: string
          agent?: Database["public"]["Enums"]["agent_name"]
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input_ref?: Json
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          agency_id: string
          comment: string | null
          created_at: string
          decided_by: string | null
          decision: Database["public"]["Enums"]["approval_decision"]
          id: string
          project_id: string
          stage: Database["public"]["Enums"]["approval_stage"]
        }
        Insert: {
          agency_id: string
          comment?: string | null
          created_at?: string
          decided_by?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"]
          id?: string
          project_id: string
          stage: Database["public"]["Enums"]["approval_stage"]
        }
        Update: {
          agency_id?: string
          comment?: string | null
          created_at?: string
          decided_by?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"]
          id?: string
          project_id?: string
          stage?: Database["public"]["Enums"]["approval_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "approvals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          agency_id: string
          created_at: string
          diff: Json
          entity_id: string | null
          entity_type: string
          id: string
          ip: unknown
        }
        Insert: {
          action: string
          actor_id?: string | null
          agency_id: string
          created_at?: string
          diff?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          ip?: unknown
        }
        Update: {
          action?: string
          actor_id?: string | null
          agency_id?: string
          created_at?: string
          diff?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      authenticity_scores: {
        Row: {
          agency_id: string
          breakdown: Json
          created_at: string
          flagged_phrases: Json
          id: string
          passed: boolean
          piece_id: string | null
          project_id: string
          run_id: string | null
          score: number
        }
        Insert: {
          agency_id: string
          breakdown?: Json
          created_at?: string
          flagged_phrases?: Json
          id?: string
          passed?: boolean
          piece_id?: string | null
          project_id: string
          run_id?: string | null
          score: number
        }
        Update: {
          agency_id?: string
          breakdown?: Json
          created_at?: string
          flagged_phrases?: Json
          id?: string
          passed?: boolean
          piece_id?: string | null
          project_id?: string
          run_id?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "authenticity_scores_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authenticity_scores_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "content_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authenticity_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authenticity_scores_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_entries: {
        Row: {
          agency_id: string
          body: string
          category: Database["public"]["Enums"]["brain_category"]
          client_id: string
          created_at: string
          created_by: string | null
          data: Json
          id: string
          is_active: boolean
          priority: number
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          body?: string
          category: Database["public"]["Enums"]["brain_category"]
          client_id: string
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          is_active?: boolean
          priority?: number
          source?: string
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          body?: string
          category?: Database["public"]["Enums"]["brain_category"]
          client_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          is_active?: boolean
          priority?: number
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_entries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          agency_id: string
          audience: string | null
          banned_phrases: string[]
          client_id: string
          created_at: string
          id: string
          is_active: boolean
          products_services: Json
          reading_level: string | null
          required_disclaimers: string[]
          sample_copy: string | null
          tone_descriptors: string[]
          version: number
          voice_summary: string | null
        }
        Insert: {
          agency_id: string
          audience?: string | null
          banned_phrases?: string[]
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          products_services?: Json
          reading_level?: string | null
          required_disclaimers?: string[]
          sample_copy?: string | null
          tone_descriptors?: string[]
          version?: number
          voice_summary?: string | null
        }
        Update: {
          agency_id?: string
          audience?: string | null
          banned_phrases?: string[]
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          products_services?: Json
          reading_level?: string | null
          required_disclaimers?: string[]
          sample_copy?: string | null
          tone_descriptors?: string[]
          version?: number
          voice_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cc_tasks: {
        Row: {
          agency_id: string
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          kind: Database["public"]["Enums"]["cc_task_kind"]
          payload: Json
          priority: number
          project_id: string | null
          requested_by: string | null
          result: Json
          started_at: string | null
          status: Database["public"]["Enums"]["cc_task_status"]
          target: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["cc_task_kind"]
          payload?: Json
          priority?: number
          project_id?: string | null
          requested_by?: string | null
          result?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["cc_task_status"]
          target: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["cc_task_kind"]
          payload?: Json
          priority?: number
          project_id?: string | null
          requested_by?: string | null
          result?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["cc_task_status"]
          target?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cc_tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cc_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cc_tasks_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          title: string | null
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          title?: string | null
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          agency_id: string
          author_id: string | null
          body: string
          client_id: string
          created_at: string
          id: string
          pinned: boolean
        }
        Insert: {
          agency_id: string
          author_id?: string | null
          body: string
          client_id: string
          created_at?: string
          id?: string
          pinned?: boolean
        }
        Update: {
          agency_id?: string
          author_id?: string | null
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          pinned?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_user_links: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_user_links_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_user_links_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_user_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          agency_id: string
          created_at: string
          health_score: number
          id: string
          industry: string | null
          name: string
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string
          health_score?: number
          id?: string
          industry?: string | null
          name: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string
          health_score?: number
          id?: string
          industry?: string | null
          name?: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pieces: {
        Row: {
          agency_id: string
          body: string | null
          channel: Database["public"]["Enums"]["content_channel"]
          created_at: string
          id: string
          metadata: Json
          project_id: string
          status: string
          title: string | null
          version: number
        }
        Insert: {
          agency_id: string
          body?: string | null
          channel: Database["public"]["Enums"]["content_channel"]
          created_at?: string
          id?: string
          metadata?: Json
          project_id: string
          status?: string
          title?: string | null
          version?: number
        }
        Update: {
          agency_id?: string
          body?: string | null
          channel?: Database["public"]["Enums"]["content_channel"]
          created_at?: string
          id?: string
          metadata?: Json
          project_id?: string
          status?: string
          title?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_pieces_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pieces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_projects: {
        Row: {
          agency_id: string
          authenticity_score: number | null
          client_id: string
          created_at: string
          created_by: string | null
          current_agent: Database["public"]["Enums"]["agent_name"] | null
          id: string
          period: string | null
          status: Database["public"]["Enums"]["project_status"]
          submission_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          authenticity_score?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          current_agent?: Database["public"]["Enums"]["agent_name"] | null
          id?: string
          period?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          submission_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          authenticity_score?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          current_agent?: Database["public"]["Enums"]["agent_name"] | null
          id?: string
          period?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          submission_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_projects_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_projects_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "intake_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_roadmaps: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          created_by: string | null
          horizon: number
          id: string
          payload: Json
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          horizon: number
          id?: string
          payload?: Json
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          horizon?: number
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_roadmaps_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_roadmaps_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_roadmaps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_analyses: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "gap_analyses_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_analyses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_analyses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_playbooks: {
        Row: {
          agency_id: string
          created_at: string
          created_by: string | null
          id: string
          industry: string
          payload: Json
        }
        Insert: {
          agency_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          industry: string
          payload?: Json
        }
        Update: {
          agency_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "industry_playbooks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_playbooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_files: {
        Row: {
          agency_id: string
          created_at: string
          file_name: string
          id: string
          intake_item_id: string | null
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          submission_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          file_name: string
          id?: string
          intake_item_id?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          submission_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          file_name?: string
          id?: string
          intake_item_id?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_files_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_files_intake_item_id_fkey"
            columns: ["intake_item_id"]
            isOneToOne: false
            referencedRelation: "intake_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "intake_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_items: {
        Row: {
          agency_id: string
          body: string | null
          created_at: string
          id: string
          metadata: Json
          submission_id: string
          title: string | null
          type: Database["public"]["Enums"]["intake_type"]
        }
        Insert: {
          agency_id: string
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          submission_id: string
          title?: string | null
          type: Database["public"]["Enums"]["intake_type"]
        }
        Update: {
          agency_id?: string
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          submission_id?: string
          title?: string | null
          type?: Database["public"]["Enums"]["intake_type"]
        }
        Relationships: [
          {
            foreignKeyName: "intake_items_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_items_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "intake_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_submissions: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          id: string
          period: string
          reviewed_by: string | null
          status: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          id?: string
          period: string
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          id?: string
          period?: string
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_submissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          agency_id: string
          config: Json
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          config?: Json
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_connections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_briefs: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json
          period: string | null
          readiness_score: number | null
          submission_id: string
          summary: string
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          period?: string | null
          readiness_score?: number | null
          submission_id: string
          summary?: string
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          period?: string | null
          readiness_score?: number | null
          submission_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_briefs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_briefs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_briefs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_briefs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "intake_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_intelligence: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json
          source_type: Database["public"]["Enums"]["meeting_source"]
          title: string
          transcript: string
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          source_type?: Database["public"]["Enums"]["meeting_source"]
          title: string
          transcript?: string
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          source_type?: Database["public"]["Enums"]["meeting_source"]
          title?: string
          transcript?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_intelligence_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_intelligence_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_intelligence_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_plans: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          deliverables: Json
          id: string
          package_id: string | null
          period: string
          status: string
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          deliverables?: Json
          id?: string
          package_id?: string | null
          period: string
          status?: string
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          deliverables?: Json
          id?: string
          package_id?: string | null
          period?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_plans_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_plans_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          agency_id: string
          created_at: string
          deliverables: Json
          id: string
          monthly_price: number
          name: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          deliverables?: Json
          id?: string
          monthly_price?: number
          name: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          deliverables?: Json
          id?: string
          monthly_price?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          agency_id: string
          channel: string
          clicks: number
          client_id: string
          conversions: number
          created_at: string
          created_by: string | null
          id: string
          opens: number
          project_id: string | null
          recorded_at: string
          replies: number
          sent: number
          subject_line: string | null
          unsubscribes: number
        }
        Insert: {
          agency_id: string
          channel?: string
          clicks?: number
          client_id: string
          conversions?: number
          created_at?: string
          created_by?: string | null
          id?: string
          opens?: number
          project_id?: string | null
          recorded_at?: string
          replies?: number
          sent?: number
          subject_line?: string | null
          unsubscribes?: number
        }
        Update: {
          agency_id?: string
          channel?: string
          clicks?: number
          client_id?: string
          conversions?: number
          created_at?: string
          created_by?: string | null
          id?: string
          opens?: number
          project_id?: string | null
          recorded_at?: string
          replies?: number
          sent?: number
          subject_line?: string | null
          unsubscribes?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reports: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "performance_reports_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      preference_profiles: {
        Row: {
          agency_id: string
          approval_speed_days: number | null
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json
        }
        Insert: {
          agency_id: string
          approval_speed_days?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
        }
        Update: {
          agency_id?: string
          approval_speed_days?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "preference_profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preference_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preference_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          agency_id: string
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          agency_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_reviews: {
        Row: {
          agency_id: string
          created_at: string
          findings: Json
          id: string
          layer: string
          passed: boolean
          project_id: string
          run_id: string
          score: number | null
          summary: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          findings?: Json
          id?: string
          layer: string
          passed?: boolean
          project_id: string
          run_id: string
          score?: number | null
          summary?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          findings?: Json
          id?: string
          layer?: string
          passed?: boolean
          project_id?: string
          run_id?: string
          score?: number | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_reviews_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_events: {
        Row: {
          agency_id: string
          amount: number
          client_id: string
          created_at: string
          id: string
          occurred_at: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          type: Database["public"]["Enums"]["revenue_event_type"]
        }
        Insert: {
          agency_id: string
          amount: number
          client_id: string
          created_at?: string
          id?: string
          occurred_at?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          type: Database["public"]["Enums"]["revenue_event_type"]
        }
        Update: {
          agency_id?: string
          amount?: number
          client_id?: string
          created_at?: string
          id?: string
          occurred_at?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          type?: Database["public"]["Enums"]["revenue_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "revenue_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      revisions: {
        Row: {
          agency_id: string
          approval_id: string | null
          created_at: string
          id: string
          instructions: string
          project_id: string
          requested_by: string | null
          scope: string | null
          status: string
        }
        Insert: {
          agency_id: string
          approval_id?: string | null
          created_at?: string
          id?: string
          instructions: string
          project_id: string
          requested_by?: string | null
          scope?: string | null
          status?: string
        }
        Update: {
          agency_id?: string
          approval_id?: string | null
          created_at?: string
          id?: string
          instructions?: string
          project_id?: string
          requested_by?: string | null
          scope?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisions_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisions_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecards: {
        Row: {
          agency_id: string
          created_at: string
          created_by: string | null
          id: string
          overall: number
          passed: boolean
          project_id: string
          scores: Json
          summary: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          overall: number
          passed?: boolean
          project_id: string
          scores?: Json
          summary?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          overall?: number
          passed?: boolean
          project_id?: string
          scores?: Json
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorecards_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorecards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorecards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          agency_id: string
          category: Database["public"]["Enums"]["story_category"]
          client_id: string
          created_at: string
          created_by: string | null
          detail: string
          id: string
          search: unknown
          source: string
          source_refs: Json
          status: string
          summary: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          category: Database["public"]["Enums"]["story_category"]
          client_id: string
          created_at?: string
          created_by?: string | null
          detail?: string
          id?: string
          search?: unknown
          source?: string
          source_refs?: Json
          status?: string
          summary?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          category?: Database["public"]["Enums"]["story_category"]
          client_id?: string
          created_at?: string
          created_by?: string | null
          detail?: string
          id?: string
          search?: unknown
          source?: string
          source_refs?: Json
          status?: string
          summary?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          monthly_amount: number
          package_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_amount?: number
          package_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_amount?: number
          package_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_documents: {
        Row: {
          agency_id: string
          analyzed: boolean
          client_id: string | null
          created_at: string
          created_by: string | null
          doc_type: Database["public"]["Enums"]["vault_doc_type"]
          extracted_text: string
          file_name: string
          id: string
          mime_type: string | null
          search: unknown
          size_bytes: number | null
          storage_path: string
          summary: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          analyzed?: boolean
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          doc_type?: Database["public"]["Enums"]["vault_doc_type"]
          extracted_text?: string
          file_name: string
          id?: string
          mime_type?: string | null
          search?: unknown
          size_bytes?: number | null
          storage_path: string
          summary?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          analyzed?: boolean
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          doc_type?: Database["public"]["Enums"]["vault_doc_type"]
          extracted_text?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          search?: unknown
          size_bytes?: number | null
          storage_path?: string
          summary?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_documents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_profiles: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "voice_profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      website_analyses: {
        Row: {
          agency_id: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          pages: string[]
          payload: Json
          url: string
        }
        Insert: {
          agency_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          pages?: string[]
          payload?: Json
          url: string
        }
        Update: {
          agency_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pages?: string[]
          payload?: Json
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_analyses_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_analyses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_analyses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_agency_mrr: {
        Row: {
          agency_id: string | null
          mrr: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_client_ltv: {
        Row: {
          agency_id: string | null
          client_id: string | null
          ltv: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_agency_id: { Args: never; Returns: string }
      current_client_ids: { Args: never; Returns: string[] }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_agency_admin: { Args: never; Returns: boolean }
      is_agency_staff: { Args: never; Returns: boolean }
      is_my_client_project: { Args: { p: string }; Returns: boolean }
      search_vector: {
        Args: { a: string; b: string; c: string; tags: string[] }
        Returns: unknown
      }
    }
    Enums: {
      agency_brain_category:
        | "subject_line"
        | "newsletter"
        | "campaign"
        | "prompt"
        | "cta"
      agent_name:
        | "account_manager"
        | "research"
        | "strategist"
        | "newsletter"
        | "seo_blog"
        | "social"
        | "human_editor"
        | "compliance"
        | "delivery"
      approval_decision: "pending" | "approved" | "changes_requested"
      approval_stage: "internal" | "client"
      brain_category:
        | "company_history"
        | "service"
        | "product"
        | "promotion"
        | "event"
        | "cta_preference"
        | "audience_insight"
        | "key_fact"
      cc_task_kind: "workflow" | "agent"
      cc_task_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "cancelled"
      client_status: "active" | "paused" | "churned"
      content_channel:
        | "newsletter"
        | "blog"
        | "facebook"
        | "linkedin"
        | "instagram"
        | "sms"
        | "website_announcement"
      intake_type:
        | "business_update"
        | "promotion"
        | "event"
        | "testimonial"
        | "new_service"
        | "volunteer_story"
        | "customer_story"
        | "announcement"
        | "project_complete"
        | "team_update"
        | "donor_story"
      meeting_source:
        | "transcript"
        | "zoom_export"
        | "call_summary"
        | "voice_note"
      payment_status: "paid" | "pending" | "failed"
      project_status:
        | "intake_received"
        | "research_complete"
        | "draft_generated"
        | "internal_review"
        | "client_review"
        | "revision_requested"
        | "approved"
        | "scheduled"
        | "sent"
        | "archived"
      revenue_event_type: "charge" | "refund" | "adjustment"
      run_status: "queued" | "running" | "succeeded" | "failed"
      story_category:
        | "customer"
        | "volunteer"
        | "donor"
        | "employee"
        | "project_success"
      subscription_status: "active" | "past_due" | "paused" | "cancelled"
      user_role: "owner" | "admin" | "writer" | "client"
      vault_doc_type:
        | "pdf"
        | "flyer"
        | "logo"
        | "image"
        | "brochure"
        | "brand_guide"
        | "sop"
        | "meeting_notes"
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
      agency_brain_category: [
        "subject_line",
        "newsletter",
        "campaign",
        "prompt",
        "cta",
      ],
      agent_name: [
        "account_manager",
        "research",
        "strategist",
        "newsletter",
        "seo_blog",
        "social",
        "human_editor",
        "compliance",
        "delivery",
      ],
      approval_decision: ["pending", "approved", "changes_requested"],
      approval_stage: ["internal", "client"],
      brain_category: [
        "company_history",
        "service",
        "product",
        "promotion",
        "event",
        "cta_preference",
        "audience_insight",
        "key_fact",
      ],
      cc_task_kind: ["workflow", "agent"],
      cc_task_status: ["queued", "running", "succeeded", "failed", "cancelled"],
      client_status: ["active", "paused", "churned"],
      content_channel: [
        "newsletter",
        "blog",
        "facebook",
        "linkedin",
        "instagram",
        "sms",
        "website_announcement",
      ],
      intake_type: [
        "business_update",
        "promotion",
        "event",
        "testimonial",
        "new_service",
        "volunteer_story",
        "customer_story",
        "announcement",
        "project_complete",
        "team_update",
        "donor_story",
      ],
      meeting_source: [
        "transcript",
        "zoom_export",
        "call_summary",
        "voice_note",
      ],
      payment_status: ["paid", "pending", "failed"],
      project_status: [
        "intake_received",
        "research_complete",
        "draft_generated",
        "internal_review",
        "client_review",
        "revision_requested",
        "approved",
        "scheduled",
        "sent",
        "archived",
      ],
      revenue_event_type: ["charge", "refund", "adjustment"],
      run_status: ["queued", "running", "succeeded", "failed"],
      story_category: [
        "customer",
        "volunteer",
        "donor",
        "employee",
        "project_success",
      ],
      subscription_status: ["active", "past_due", "paused", "cancelled"],
      user_role: ["owner", "admin", "writer", "client"],
      vault_doc_type: [
        "pdf",
        "flyer",
        "logo",
        "image",
        "brochure",
        "brand_guide",
        "sop",
        "meeting_notes",
        "other",
      ],
    },
  },
} as const

