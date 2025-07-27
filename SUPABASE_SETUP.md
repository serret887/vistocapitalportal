# 🗄️ Supabase Database Setup for Production

## **Required Database Setup**

Your Supabase database needs the complete schema and seed data. Follow these steps:

### **Step 1: Run the Complete Schema**

1. **Go to your Supabase Dashboard**

   - Navigate to SQL Editor
   - Create a new query

2. **Run the Initial Schema**:

   ```sql
   -- Copy and paste the entire contents of:
   -- supabase/migrations/20250726110000_initial_schema.sql
   ```

3. **Run the Seed Data**:
   ```sql
   -- Copy and paste the entire contents of:
   -- supabase/seed.sql
   ```

### **Step 2: Verify Tables Exist**

Run this query to check if all tables are created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Tables:**

- `eligibility_matrices`
- `lenders`
- `loan_applications`
- `loans`
- `partner_profiles`
- `pricing_matrices`

### **Step 3: Check Seed Data**

Verify the seed data was inserted:

```sql
-- Check lenders
SELECT * FROM lenders;

-- Check pricing matrices
SELECT COUNT(*) FROM pricing_matrices;

-- Check eligibility matrices
SELECT COUNT(*) FROM eligibility_matrices;
```

### **Step 4: Test Database Connection**

Test if your Vercel app can connect to Supabase by visiting:

- Your Vercel URL + `/api/health`

## **Common Issues & Solutions**

### **Issue 1: "Table doesn't exist"**

**Solution**: Run the complete schema migration

### **Issue 2: "No pricing data found"**

**Solution**: Run the seed.sql file to populate pricing matrices

### **Issue 3: "Authentication failed"**

**Solution**: Check your environment variables in Vercel

### **Issue 4: "RLS Policy violation"**

**Solution**: The schema includes proper RLS policies, but you may need to:

1. Enable Row Level Security in Supabase
2. Check if your user is authenticated

## **Quick Fix Commands**

If you have access to your local Supabase CLI:

```bash
# Reset and setup database
supabase db reset

# Or manually run migrations
supabase db push
```

## **Environment Variables Check**

Make sure these are set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## **Need Help?**

1. Check Vercel deployment logs
2. Check Supabase logs in the dashboard
3. Test the `/api/health` endpoint
4. Verify all environment variables are set correctly
