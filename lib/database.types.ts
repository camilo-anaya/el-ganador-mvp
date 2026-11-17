// lib/database.types.ts
// Tipos oficiales de Supabase para las tablas merchants, raffles y tickets

export interface MerchantRow {
  id: string;
  business_name: string;
  nit: string;
  plan_type: 'emprendedor' | 'pro' | 'enterprise';
  subscription_status: string;
  created_at: string;
}

export interface RaffleRow {
  id: string;
  merchant_id: string;
  title: string;
  description?: string | null;
  prize_value: number;
  ticket_price: number;
  total_tickets: number;
  coverage_type: 'local' | 'nacional';
  city?: string;
  radicado_number: string;
  resolution_pdf_url: string;
  payment_receipt_url?: string;
  draw_date: string;
  status: 'pending_approval' | 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface TicketRow {
  id: string;
  raffle_id: string;
  buyer_email: string;
  buyer_phone: string;
  ticket_number: number;
  sha256_hash: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
}
