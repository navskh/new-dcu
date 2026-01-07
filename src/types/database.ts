export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      forms: {
        Row: {
          id: string;
          short_id: string;
          name: string;
          description: string | null;
          theme: 'default' | 'navy';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          short_id: string;
          name: string;
          description?: string | null;
          theme?: 'default' | 'navy';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          short_id?: string;
          name?: string;
          description?: string | null;
          theme?: 'default' | 'navy';
          created_at?: string;
          updated_at?: string;
        };
      };
      form_fields: {
        Row: {
          id: string;
          form_id: string;
          label: string;
          type: 'number' | 'text' | 'select' | 'steps' | 'checkbox' | 'image';
          options: string[] | null;
          field_order: number;
          required: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          label: string;
          type: 'number' | 'text' | 'select' | 'steps' | 'checkbox' | 'image';
          options?: string[] | null;
          field_order: number;
          required?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          label?: string;
          type?: 'number' | 'text' | 'select';
          options?: string[] | null;
          field_order?: number;
          required?: boolean;
          created_at?: string;
        };
      };
      members: {
        Row: {
          id: string;
          form_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      responses: {
        Row: {
          id: string;
          form_id: string;
          member_id: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          member_id: string;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          member_id?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      response_values: {
        Row: {
          id: string;
          response_id: string;
          field_id: string;
          value: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_id: string;
          field_id: string;
          value: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_id?: string;
          field_id?: string;
          value?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// 편의 타입
export type Form = Database['public']['Tables']['forms']['Row'];
export type FormField = Database['public']['Tables']['form_fields']['Row'];
export type Member = Database['public']['Tables']['members']['Row'];
export type Response = Database['public']['Tables']['responses']['Row'];
export type ResponseValue = Database['public']['Tables']['response_values']['Row'];
