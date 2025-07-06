import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.RESUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)