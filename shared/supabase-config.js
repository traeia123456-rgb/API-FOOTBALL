// ============================================
// SUPABASE CONFIGURATION
// ============================================

const SUPABASE_CONFIG = {
    url: 'https://udrvtpcgyppfhobhpmyj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcnZ0cGNneXBwZmhvYmhwbXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4Nzg3MzksImV4cCI6MjA3OTQ1NDczOX0.jgcmKsruZbYx9TzNMuOPmNDZW6nLyMZJZQYAvN-Vhtc'
};

// Initialize Supabase client
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

// Export for use in other files
window.supabaseClient = supabase;

console.log('✅ Supabase client initialized');

