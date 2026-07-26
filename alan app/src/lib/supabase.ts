import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://btdwvnanskfdgiaiadwc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZHd2bmFuc2tmZGdpYWlhZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwODA3OTYsImV4cCI6MjEwMDY1Njc5Nn0.VtBVkosvxy2qoz0vxCUAE2HRVJ5CPjjt-qKFS-1Ahok',
)

export type Comment = {
  id: string
  created_at: string
  user_id: string
  circuit_id: string
  race_time: number | null
  text: string
  username: string
  comment_color?: string | null
}

export type Profile = {
  id: string
  tier: 'free' | 'pro'
  comment_color: string | null
  stripe_customer_id: string | null
}
