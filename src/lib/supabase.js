import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vhuhkatfczhzqeeoqqrs.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodWhrYXRmY3poenFlZW9xcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjYzOTksImV4cCI6MjEwMDc0MjM5OX0.7AwpK09nMOmIJ23UY_lRtMbpPj1CWP24FMD_lenLlQE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
