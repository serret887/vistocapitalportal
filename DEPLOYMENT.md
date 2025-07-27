# 🚀 Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Supabase Project**: Your Supabase project should be set up and running

## Environment Variables

You'll need to configure these environment variables in your Vercel project:

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NODE_ENV=production
```

### How to Get Supabase Values

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - **Project URL**: Use this for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: Use this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: Use this for `SUPABASE_SERVICE_ROLE_KEY`

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Connect Repository**:

   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**:

   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set Environment Variables**:

   - In the project settings, go to "Environment Variables"
   - Add all the required environment variables listed above

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy**:

   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

## Post-Deployment

1. **Test Your Application**:

   - Visit your deployed URL
   - Test all major functionality
   - Verify database connections

2. **Set Up Custom Domain** (Optional):

   - Go to your Vercel project settings
   - Navigate to "Domains"
   - Add your custom domain

3. **Monitor Performance**:
   - Use Vercel Analytics to monitor performance
   - Set up error tracking if needed

## Troubleshooting

### Common Issues

1. **Build Failures**:

   - Check that all environment variables are set
   - Verify your Supabase project is accessible
   - Check the build logs for specific errors

2. **Database Connection Issues**:

   - Verify your Supabase URL and keys are correct
   - Check that your Supabase project is not paused
   - Ensure your database schema is properly set up

3. **Authentication Issues**:
   - Verify your Supabase authentication is configured
   - Check that your redirect URLs are set correctly

### Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
