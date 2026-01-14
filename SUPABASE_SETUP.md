# Supabase Migration - Next Steps

## Installation Required

Due to PowerShell execution policy restrictions, you'll need to manually install the dependencies:

```bash
npm install
```

This will install the new Supabase packages and remove the old Prisma/NextAuth dependencies.

## Supabase Setup

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details
   - Wait for the database to be provisioned

2. **Run the SQL Migration**:
   - In Supabase Dashboard → SQL Editor
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and execute the SQL
   - Verify tables were created in Table Editor

3. **Configure Environment Variables**:
   - In Supabase Dashboard → Settings → API
   - Copy your Project URL and anon/public key
   - Update `.env` file:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Test the Application**:
   ```bash
   npm run dev
   ```
   - Navigate to http://localhost:3000
   - Try registering a new user
   - Try logging in
   - Create and manage flows

## Files to Delete (Optional)

After confirming everything works:
- `prisma/` directory
- `lib/db.ts`
- `lib/auth.ts`
- `types/next-auth.d.ts`
- `app/api/auth/[...nextauth]/route.ts`

## Migration Complete! 🎉

All code has been updated to use Supabase. The main changes:
- ✅ Replaced Prisma with Supabase Client
- ✅ Replaced NextAuth with Supabase Auth
- ✅ Updated all API routes
- ✅ Updated client components
- ✅ Created SQL migration with RLS policies
