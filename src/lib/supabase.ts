import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - using dummy values for development')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)

export interface Campaign {
  id?: string
  name: string
  metrics: string[]
  data: any[][]
  created_at?: string
  updated_at?: string
}

export interface SaveCampaignData {
  name: string
  metrics: string[]
  data: any[][]
}