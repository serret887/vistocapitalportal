# Environment Setup

## Local Development with Supabase

Create a `.env.local` file in the root directory with the following content:

```env
# Supabase Configuration (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

## Production Setup

For production, replace with your actual Supabase project values:

```env
# Supabase Configuration (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Setup

### Tables Created:

- ✅ Partner profiles table (consolidated with user info)
- ✅ Loan applications table
- ✅ Storage bucket for file uploads

### Features:

- ✅ Automatic partner profile creation trigger
- ✅ Row Level Security (RLS) policies
- ✅ File upload support

## Quick Start

1. Ensure Supabase is running: `npx supabase start`
2. Create `.env.local` with the local values above
3. Start the app: `yarn dev`
4. Visit `http://localhost:3000` to test!
