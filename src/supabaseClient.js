import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Use the correct prefix for your framework (e.g., VITE_, REACT_APP_)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY

// A simple check to make sure you have configured your environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error("🔴 Missing Supabase URL or Publishable Key. Check your .env file or server settings.")
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)