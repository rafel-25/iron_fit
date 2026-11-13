IRON FIT — VERCEL EDITION
========================
This version removes PHP/MySQL and uses Supabase Auth + PostgreSQL. It is a static site, suitable for Vercel.

1) Create a Supabase project at https://supabase.com/
2) In Supabase > SQL Editor, run the complete file supabase-schema.sql.
3) In Supabase > Project Settings > API, copy Project URL and anon/public key.
4) Open config/supabase.js and replace YOUR-PROJECT and YOUR_SUPABASE_ANON_KEY. The anon key is designed to be public; never put a service_role key in this file.
5) Upload this folder to a GitHub repository.
6) In https://vercel.com/ choose Add New > Project, import that repository, Framework Preset: Other, Build Command: leave empty, Output Directory: . (root), then Deploy.
7) In Supabase > Authentication > URL Configuration, set Site URL to your Vercel URL and add https://YOUR-APP.vercel.app/** to Redirect URLs.
8) Register your own account on the deployed site. To make it Admin, open Supabase SQL Editor and run (replace email):
   update public.profiles p set role='admin' from auth.users u where p.id=u.id and u.email='YOUR_EMAIL';
9) Log out and log in again; open /admin/dashboard.html. Other registrations are regular User accounts.

IMPORTANT
- Do not use a service_role key in browser code.
- Run the SQL policies as supplied; they restrict admin actions to the admin role.
- Member removal deletes the profile row only, not the Supabase Auth identity. Disable is safer if you want to retain records.
- For live public use, enable email confirmation and configure SMTP in Supabase.
- Local preview: serve this folder using a local static server; opening HTML as file:// may block JavaScript modules.
