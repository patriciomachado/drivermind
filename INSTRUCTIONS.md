# Drivermind PWA - Setup Instructions

## 1. Supabase Setup
1.  Create a project at [supabase.com](https://supabase.com).
2.  Go to the **SQL Editor** in Supabase.
3.  Open the `setup.sql` file located in this project's root folder.
4.  Copy and paste the content into the SQL Editor and run it.

## 2. Local Environment
Create a `.env.local` file in the root of the project with the following keys from your Supabase Project Settings (API):

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 3. Run the App
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your browser (or mobile device on the same network).
