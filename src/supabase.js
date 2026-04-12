import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qifozesinprzjmbinomu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZm96ZXNpbnByemptYmlub211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDA5NjAsImV4cCI6MjA5MTU3Njk2MH0.CeyN2v3E4neUF4ib-XrkKGg9WHLc1razl7ApUyh_L-8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)