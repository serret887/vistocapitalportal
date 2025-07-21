# Deployment Guide

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Vercel Account** (recommended) or any other hosting platform
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

## Step 1: Set Up Supabase

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project name (e.g., "partner-onboarding-portal")
   - Set a database password
   - Choose a region close to your users
   - Click "Create new project"

2. **Run the database schema**
   - In your Supabase dashboard, go to the SQL Editor
   - Copy the contents of `supabase-schema.sql`
   - Paste and run the SQL commands
   - This creates the `partner_profiles` table

3. **Get your API credentials**
   - Go to Settings → API
   - Copy the "Project URL" and "anon public" key
   - You'll need these for environment variables

## Step 2: Deploy to Vercel (Recommended)

1. **Connect your repository**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your Git provider
   - Click "New Project"
   - Import your repository

2. **Configure environment variables**
   - In the Vercel project settings, go to "Environment Variables"
   - Add the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Deploy**
   - Vercel will automatically detect Next.js
   - Click "Deploy"
   - Your app will be live in minutes

## Step 3: Alternative Deployment Options

### Netlify
1. Connect your repository to Netlify
2. Set build command: `yarn build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Railway
1. Connect your repository to Railway
2. Add environment variables
3. Railway will automatically detect and deploy

### DigitalOcean App Platform
1. Create a new app in DigitalOcean
2. Connect your repository
3. Set build command: `yarn build`
4. Add environment variables

## Step 4: Post-Deployment

1. **Test the application**
   - Visit your deployed URL
   - Complete the onboarding flow
   - Verify data is saved to Supabase

2. **Set up custom domain** (optional)
   - In Vercel/your hosting platform, add a custom domain
   - Configure DNS records as instructed

3. **Monitor and maintain**
   - Set up error monitoring (e.g., Sentry)
   - Monitor Supabase usage and costs
   - Set up backups if needed

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

## Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check that Supabase credentials are valid
- Verify the database schema is created

### Runtime Errors
- Check browser console for client-side errors
- Check Supabase logs for database errors
- Verify RLS policies are configured correctly

### Performance Issues
- Enable Supabase connection pooling
- Consider using Supabase Edge Functions for heavy operations
- Optimize images and assets

## Security Considerations

1. **Row Level Security (RLS)**: The current setup allows all operations. In production, implement proper RLS policies
2. **Authentication**: Add user authentication before implementing proper user management
3. **Rate Limiting**: Consider adding rate limiting for form submissions
4. **Data Validation**: Add server-side validation for all form inputs

## Next Steps

1. **Add Authentication**: Implement user registration/login
2. **Email Notifications**: Set up email confirmations
3. **Admin Dashboard**: Create an admin interface to manage partners
4. **Analytics**: Add tracking and analytics
5. **Testing**: Add unit and integration tests 