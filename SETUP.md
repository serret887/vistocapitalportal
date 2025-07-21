# 🔐 Visto Capital Partner Portal - Authentication Setup

## 📋 Overview

The Partner Portal now includes a complete authentication flow:

1. **Sign Up** → **Onboarding** → **Dashboard**
2. **Sign In** → **Dashboard** (if onboarded) or **Onboarding** (if not)
3. **Protected Routes** ensure users must be authenticated and onboarded

## 🗄️ Database Setup

### 1. Run the Database Schema

Execute the SQL in `supabase-schema.sql` in your Supabase SQL editor:

```sql
-- This creates:
-- 1. user_profiles table (basic user info)
-- 2. partner_profiles table (onboarding data)
-- 3. RLS policies for security
-- 4. Trigger to auto-create user profiles
```

### 2. Configure Environment Variables

Update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔄 User Flow

### New User Journey
```
1. Visit /signup
2. Fill out: First Name, Last Name, Email, Password
3. Account created → Redirect to /onboarding
4. Complete 4-step onboarding process
5. Submit → Redirect to /dashboard
```

### Returning User Journey
```
1. Visit /login
2. Enter credentials
3. If onboarded → /dashboard
4. If not onboarded → /onboarding
```

## 🛡️ Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Automatic user profile creation on signup
- Secure authentication with Supabase Auth

### Protected Routes
- `/dashboard` requires authentication + completed onboarding
- `/onboarding` requires authentication
- Automatic redirects if not authorized

## 📱 Components

### Authentication Components
- `SignupForm` - Functional signup with validation
- `LoginForm` - Functional login with onboarding check
- `ProtectedRoute` - Route wrapper for auth checks

### Context & State
- `OnboardingContext` - Now works with authenticated users
- Real-time auth state management
- Automatic profile loading and saving

## 🚀 Quick Start

1. **Setup Supabase Database**:
   ```sql
   -- Copy and run supabase-schema.sql in Supabase SQL editor
   ```

2. **Configure Environment**:
   ```bash
   # Update .env.local with your Supabase credentials
   ```

3. **Start Development**:
   ```bash
   yarn dev
   ```

4. **Test the Flow**:
   - Visit `http://localhost:3000/signup`
   - Create an account
   - Complete onboarding
   - Access the dashboard

## 🎯 Features

### ✅ Implemented
- [x] User registration with basic info
- [x] Automatic Supabase user creation
- [x] Protected dashboard route
- [x] Onboarding completion tracking
- [x] Form validation and error handling
- [x] Loading states and user feedback
- [x] Automatic redirection based on auth state

### 🔮 Future Enhancements
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Social authentication (Google, Microsoft)
- [ ] User profile management
- [ ] Admin dashboard for partner management

## 🛠️ Development Notes

### Database Tables
```sql
user_profiles (
  id: uuid (auth.users.id)
  first_name: text
  last_name: text
  email: text
  created_at: timestamp
)

partner_profiles (
  id: uuid
  user_id: uuid (auth.users.id)
  partner_type: text
  phone_number: text
  deals_per_month: integer
  monthly_volume: numeric
  transaction_types: text[]
  license_number: text (optional)
  license_state: text (optional)
  onboarding_completed: boolean
  created_at: timestamp
)
```

### Authentication Flow
1. User signs up → Supabase creates auth user
2. Trigger creates user_profile automatically
3. User completes onboarding → partner_profile created
4. Dashboard access granted only after onboarding

## 🚨 Important Notes

- Users MUST complete onboarding to access the dashboard
- RLS policies ensure data security
- All forms include proper validation
- Loading states prevent double submissions
- Error handling provides user feedback

## 📝 Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

The Visto Capital Partner Portal is now a complete authentication-enabled application! 🎉 