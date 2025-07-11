export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          namespace: string
          team_id: string | null
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          namespace: string
          team_id?: string | null
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          namespace?: string
          team_id?: string | null
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_executions: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          provider_id: string
          result_data: Json | null
          started_at: string | null
          status: string
          task_type: string
          team_id: string
          triggered_by: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_id: string
          result_data?: Json | null
          started_at?: string | null
          status?: string
          task_type: string
          team_id: string
          triggered_by: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string
          result_data?: Json | null
          started_at?: string | null
          status?: string
          task_type?: string
          team_id?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_executions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "cloud_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_jobs: {
        Row: {
          backup_type: string
          created_at: string | null
          destination: string
          id: string
          last_run: string | null
          metadata: Json | null
          name: string
          next_run: string | null
          retention_days: number | null
          schedule_cron: string | null
          source_path: string
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          backup_type: string
          created_at?: string | null
          destination: string
          id?: string
          last_run?: string | null
          metadata?: Json | null
          name: string
          next_run?: string | null
          retention_days?: number | null
          schedule_cron?: string | null
          source_path: string
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          backup_type?: string
          created_at?: string | null
          destination?: string
          id?: string
          last_run?: string | null
          metadata?: Json | null
          name?: string
          next_run?: string | null
          retention_days?: number | null
          schedule_cron?: string | null
          source_path?: string
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_jobs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_asset: {
        Row: {
          asset_id: string
          asset_name: string | null
          asset_type: string | null
          cloud_provider_id: string
          discovered_at: string | null
          id: string
          last_scan: string | null
          metadata: Json | null
          region: string | null
          status: string | null
          tags: Json | null
          team_id: string
        }
        Insert: {
          asset_id: string
          asset_name?: string | null
          asset_type?: string | null
          cloud_provider_id: string
          discovered_at?: string | null
          id?: string
          last_scan?: string | null
          metadata?: Json | null
          region?: string | null
          status?: string | null
          tags?: Json | null
          team_id: string
        }
        Update: {
          asset_id?: string
          asset_name?: string | null
          asset_type?: string | null
          cloud_provider_id?: string
          discovered_at?: string | null
          id?: string
          last_scan?: string | null
          metadata?: Json | null
          region?: string | null
          status?: string | null
          tags?: Json | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_instances_cloud_provider_id_fkey"
            columns: ["cloud_provider_id"]
            isOneToOne: false
            referencedRelation: "cloud_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_instances_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_credentials: {
        Row: {
          config: Json
          configured_by: string
          created_at: string
          id: string
          provider_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          configured_by: string
          created_at?: string
          id?: string
          provider_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          configured_by?: string
          created_at?: string
          id?: string
          provider_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_credentials_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "cloud_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_providers: {
        Row: {
          api_endpoint: string | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documentation: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          team_id: string
          title: string
          updated_at: string
          updated_by: string | null
          version: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          team_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          team_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      infrastructure_docs: {
        Row: {
          approved_by: string | null
          content: string | null
          created_at: string | null
          created_by: string
          doc_type: string | null
          id: string
          metadata: Json | null
          status: string | null
          team_id: string
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          approved_by?: string | null
          content?: string | null
          created_at?: string | null
          created_by: string
          doc_type?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          team_id: string
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          approved_by?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string
          doc_type?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "infrastructure_docs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infrastructure_docs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infrastructure_docs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      itsm_change_requests: {
        Row: {
          approved_by: string | null
          change_type: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          requested_by: string
          scheduled_date: string | null
          status: string | null
          team_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          change_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          requested_by: string
          scheduled_date?: string | null
          status?: string | null
          team_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          change_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          requested_by?: string
          scheduled_date?: string | null
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itsm_change_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itsm_change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itsm_change_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      itsm_comments: {
        Row: {
          change_request_id: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          incident_id: string | null
          metadata: Json | null
          team_id: string
          updated_at: string
          vulnerability_id: string | null
        }
        Insert: {
          change_request_id?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          incident_id?: string | null
          metadata?: Json | null
          team_id: string
          updated_at?: string
          vulnerability_id?: string | null
        }
        Update: {
          change_request_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          incident_id?: string | null
          metadata?: Json | null
          team_id?: string
          updated_at?: string
          vulnerability_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itsm_comments_change_request_id_fkey"
            columns: ["change_request_id"]
            isOneToOne: false
            referencedRelation: "itsm_change_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itsm_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itsm_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "itsm_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itsm_comments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itsm_comments_vulnerability_id_fkey"
            columns: ["vulnerability_id"]
            isOneToOne: false
            referencedRelation: "security_vulnerabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      itsm_incidents: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          metadata: Json | null
          priority: string | null
          resolved_at: string | null
          status: string | null
          team_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          team_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itsm_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itsm_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itsm_incidents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_name: string
          alert_type: string
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          resolved_at: string | null
          severity: string
          source_system: string | null
          status: string | null
          team_id: string
          triggered_at: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_name: string
          alert_type: string
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          severity: string
          source_system?: string | null
          status?: string | null
          team_id: string
          triggered_at?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_name?: string
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          source_system?: string | null
          status?: string | null
          team_id?: string
          triggered_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_alerts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_transports: {
        Row: {
          channel: string
          config: Json
          configured_by: string
          created_at: string
          id: string
          is_active: boolean
          scope: string
          team_id: string
          updated_at: string
        }
        Insert: {
          channel: string
          config?: Json
          configured_by: string
          created_at?: string
          id?: string
          is_active?: boolean
          scope: string
          team_id: string
          updated_at?: string
        }
        Update: {
          channel?: string
          config?: Json
          configured_by?: string
          created_at?: string
          id?: string
          is_active?: boolean
          scope?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notification_transports_configured_by"
            columns: ["configured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notification_transports_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          itsm_change_request_id: string | null
          payload: Json
          sent_at: string | null
          status: string
          team_id: string
          transport_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          itsm_change_request_id?: string | null
          payload?: Json
          sent_at?: string | null
          status?: string
          team_id: string
          transport_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          itsm_change_request_id?: string | null
          payload?: Json
          sent_at?: string | null
          status?: string
          team_id?: string
          transport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_itsm_change_request_id"
            columns: ["itsm_change_request_id"]
            isOneToOne: false
            referencedRelation: "itsm_change_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notifications_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notifications_transport_id"
            columns: ["transport_id"]
            isOneToOne: false
            referencedRelation: "notification_transports"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          is_msp: boolean | null
          metadata: Json | null
          name: string
          parent_organization_id: string | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_msp?: boolean | null
          metadata?: Json | null
          name: string
          parent_organization_id?: string | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_msp?: boolean | null
          metadata?: Json | null
          name?: string
          parent_organization_id?: string | null
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      patch_schedules: {
        Row: {
          cloud_asset_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          patch_type: string | null
          scheduled_at: string
          status: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          cloud_asset_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          patch_type?: string | null
          scheduled_at: string
          status?: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          cloud_asset_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          patch_type?: string | null
          scheduled_at?: string
          status?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patch_schedules_cloud_asset_id_fkey"
            columns: ["cloud_asset_id"]
            isOneToOne: false
            referencedRelation: "cloud_asset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patch_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patch_schedules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          metadata: Json | null
          name: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          metadata?: Json | null
          name: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          metadata?: Json | null
          name?: string
          resource?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          default_organization_id: string | null
          default_team_id: string | null
          email: string
          first_name: string | null
          id: string
          is_msp_admin: boolean | null
          last_name: string | null
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          default_organization_id?: string | null
          default_team_id?: string | null
          email: string
          first_name?: string | null
          id: string
          is_msp_admin?: boolean | null
          last_name?: string | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          default_organization_id?: string | null
          default_team_id?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_msp_admin?: boolean | null
          last_name?: string | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_organization_id_fkey"
            columns: ["default_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_team_id_fkey"
            columns: ["default_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_system_role: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_system_role?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_system_role?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_vulnerabilities: {
        Row: {
          affected_instances: string[] | null
          assigned_to: string | null
          cloud_asset_id: string | null
          created_at: string | null
          cve_id: string | null
          description: string | null
          discovered_at: string | null
          id: string
          metadata: Json | null
          remediated_at: string | null
          severity: string
          status: string | null
          team_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_instances?: string[] | null
          assigned_to?: string | null
          cloud_asset_id?: string | null
          created_at?: string | null
          cve_id?: string | null
          description?: string | null
          discovered_at?: string | null
          id?: string
          metadata?: Json | null
          remediated_at?: string | null
          severity: string
          status?: string | null
          team_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_instances?: string[] | null
          assigned_to?: string | null
          cloud_asset_id?: string | null
          created_at?: string | null
          cve_id?: string | null
          description?: string | null
          discovered_at?: string | null
          id?: string
          metadata?: Json | null
          remediated_at?: string | null
          severity?: string
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_vulnerabilities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_vulnerabilities_cloud_asset_id_fkey"
            columns: ["cloud_asset_id"]
            isOneToOne: false
            referencedRelation: "cloud_asset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_vulnerabilities_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      uptime_checks: {
        Row: {
          check_interval: number
          checked_at: string | null
          created_at: string
          expected_status_codes: number[] | null
          id: string
          metadata: Json | null
          method: string
          name: string
          next_check: string | null
          response_time: number | null
          status: string
          status_code: number | null
          team_id: string
          timeout_seconds: number
          updated_at: string
          url: string
        }
        Insert: {
          check_interval?: number
          checked_at?: string | null
          created_at?: string
          expected_status_codes?: number[] | null
          id?: string
          metadata?: Json | null
          method?: string
          name: string
          next_check?: string | null
          response_time?: number | null
          status?: string
          status_code?: number | null
          team_id: string
          timeout_seconds?: number
          updated_at?: string
          url: string
        }
        Update: {
          check_interval?: number
          checked_at?: string | null
          created_at?: string
          expected_status_codes?: number[] | null
          id?: string
          metadata?: Json | null
          method?: string
          name?: string
          next_check?: string | null
          response_time?: number | null
          status?: string
          status_code?: number | null
          team_id?: string
          timeout_seconds?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          organization_id: string | null
          role_id: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          role_id: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          role_id?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          current_organization_id: string | null
          current_team_id: string | null
          expires_at: string | null
          id: string
          is_msp: boolean | null
          session_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_organization_id?: string | null
          current_team_id?: string | null
          expires_at?: string | null
          id?: string
          is_msp?: boolean | null
          session_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_organization_id?: string | null
          current_team_id?: string | null
          expires_at?: string | null
          id?: string
          is_msp?: boolean | null
          session_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_current_organization_id_fkey"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_current_team_id_fkey"
            columns: ["current_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_init_msp_admin_session: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_document_version: {
        Args: { doc_id: string; new_title?: string; new_content?: string }
        Returns: string
      }
      delete_setting: {
        Args: { p_team_id: string; p_namespace: string; p_key: string }
        Returns: boolean
      }
      diagnose_user_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          is_msp_admin: boolean
          has_session: boolean
          session_team_id: string
          session_org_id: string
          org_memberships_count: number
        }[]
      }
      get_app_session_variables: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_team: string
          is_msp: boolean
        }[]
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          is_msp_admin: boolean
        }[]
      }
      get_current_user_session: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_organization_id: string
          current_team_id: string
          is_msp: boolean
        }[]
      }
      get_keys_by_namespace: {
        Args: { p_namespace: string }
        Returns: {
          key: string
          has_global: boolean
          has_team: boolean
          team_count: number
        }[]
      }
      get_namespaces: {
        Args: Record<PropertyKey, never>
        Returns: {
          namespace: string
          is_global: boolean
          setting_count: number
        }[]
      }
      get_setting: {
        Args: { p_team_id: string; p_namespace: string; p_key: string }
        Returns: Json
      }
      initialize_user_session: {
        Args: { p_organization_id?: string; p_team_id?: string }
        Returns: {
          user_id: string
          organization_id: string
          team_id: string
          is_msp: boolean
          success: boolean
        }[]
      }
      is_msp_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_in_msp_organization: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_app_session_variables: {
        Args: { p_team_id?: string; p_is_msp?: boolean }
        Returns: undefined
      }
      set_setting: {
        Args: {
          p_team_id: string
          p_namespace: string
          p_key: string
          p_value: Json
        }
        Returns: string
      }
      set_user_session_context: {
        Args: { p_organization_id?: string; p_team_id?: string }
        Returns: undefined
      }
      test_session_variables: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_team_var: string
          is_msp_var: string
          parsed_team: string
          parsed_is_msp: boolean
        }[]
      }
      trigger_team_backup: {
        Args: { p_team_id: string; p_provider_id: string }
        Returns: string
      }
      trigger_team_inventory: {
        Args: { p_team_id: string; p_provider_id: string }
        Returns: string
      }
      update_execution_status: {
        Args: {
          p_execution_id: string
          p_status: string
          p_error_message?: string
          p_result_data?: Json
        }
        Returns: undefined
      }
      user_has_organization_access: {
        Args: { org_id: string }
        Returns: boolean
      }
      user_has_team_access: {
        Args: { team_id: string }
        Returns: boolean
      }
    }
    Enums: {
      organization_type: "client" | "esn" | "msp"
      team_role: "owner" | "admin" | "member" | "viewer"
      user_role: "admin" | "manager" | "technician" | "user"
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
    Enums: {
      organization_type: ["client", "esn", "msp"],
      team_role: ["owner", "admin", "member", "viewer"],
      user_role: ["admin", "manager", "technician", "user"],
    },
  },
} as const
