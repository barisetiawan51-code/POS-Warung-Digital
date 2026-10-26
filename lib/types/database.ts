// ==============================================================================
// WARUNGKU - SUPABASE DATABASE TYPE DEFINITIONS
// Strongly typed Supabase schema mapping for strict TypeScript compliance
// ==============================================================================

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
      product_images: {
        Row: { id: string; owner_id: string; product_id: string; storage_path: string | null; public_url: string | null; alt_text: string | null; sort_order: number; is_primary: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; owner_id: string; product_id: string; storage_path?: string | null; public_url?: string | null; alt_text?: string | null; sort_order?: number; is_primary?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: string; owner_id?: string; product_id?: string; storage_path?: string | null; public_url?: string | null; alt_text?: string | null; sort_order?: number; is_primary?: boolean; updated_at?: string };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          store_name: string;
          owner_name: string;
          role: string;
          phone: string | null;
          address: string | null;
          profile_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          store_name?: string;
          owner_name?: string;
          role?: string;
          phone?: string | null;
          address?: string | null;
          profile_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_name?: string;
          owner_name?: string;
          role?: string;
          phone?: string | null;
          address?: string | null;
          profile_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          prefix: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          prefix?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          prefix?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          owner_id: string;
          category_id: string | null;
          sku: string;
          name: string;
          unit: string;
          cost_price: number;
          selling_price: number;
          stock: number;
          minimum_stock: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          category_id?: string | null;
          sku: string;
          name: string;
          unit?: string;
          cost_price?: number;
          selling_price?: number;
          stock?: number;
          minimum_stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          category_id?: string | null;
          sku?: string;
          name?: string;
          unit?: string;
          cost_price?: number;
          selling_price?: number;
          stock?: number;
          minimum_stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          owner_id: string;
          invoice_number: string;
          idempotency_key: string | null;
          subtotal: number;
          discount: number;
          total: number;
          transaction_status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          invoice_number: string;
          idempotency_key?: string | null;
          subtotal: number;
          discount?: number;
          total: number;
          transaction_status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          invoice_number?: string;
          idempotency_key?: string | null;
          subtotal?: number;
          discount?: number;
          total?: number;
          transaction_status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          sku: string;
          unit: string;
          quantity: number;
          unit_price: number;
          cost_price: number;
          line_subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          sku: string;
          unit: string;
          quantity: number;
          unit_price: number;
          cost_price?: number;
          line_subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          sku?: string;
          unit?: string;
          quantity?: number;
          unit_price?: number;
          cost_price?: number;
          line_subtotal?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          payment_method: string;
          amount: number;
          cash_received: number | null;
          cash_change: number | null;
          payment_status: string;
          provider_reference: string | null;
          verification_user: string | null;
          verification_timestamp: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          payment_method: string;
          amount: number;
          cash_received?: number | null;
          cash_change?: number | null;
          payment_status?: string;
          provider_reference?: string | null;
          verification_user?: string | null;
          verification_timestamp?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          payment_method?: string;
          amount?: number;
          cash_received?: number | null;
          cash_change?: number | null;
          payment_status?: string;
          provider_reference?: string | null;
          verification_user?: string | null;
          verification_timestamp?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          owner_id: string;
          product_id: string;
          quantity_change: number;
          balance_after: number;
          reason: string;
          reference_id: string | null;
          acting_user: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          product_id: string;
          quantity_change: number;
          balance_after: number;
          reason: string;
          reference_id?: string | null;
          acting_user?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          product_id?: string;
          quantity_change?: number;
          balance_after?: number;
          reason?: string;
          reference_id?: string | null;
          acting_user?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      store_settings: {
        Row: {
          id: string;
          bank_name: string;
          bank_account_number: string;
          bank_account_holder: string;
          default_minimum_stock: number;
          is_online_payment_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          bank_name?: string;
          bank_account_number?: string;
          bank_account_holder?: string;
          default_minimum_stock?: number;
          is_online_payment_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bank_name?: string;
          bank_account_number?: string;
          bank_account_holder?: string;
          default_minimum_stock?: number;
          is_online_payment_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

