# HerDrive — Vercel source package

This is the complete frontend from the published HerDrive website, plus a Vercel-compatible backend. Start here. You do not need Next.js to host this site on Vercel: it uses HTML, CSS, JavaScript and Node.js server functions. No npm runtime packages are required.

## What is included

- The responsive pink/plum/cream website, mobile menu, FAQ and business-model accordions.
- All campaign images, the SVG logo, and original brand image.
- DM Sans and Playfair Display font files served locally, with their SIL Open Font Licences. No Google Fonts request is needed in the Vercel version.
- Rider waitlist and Captain interest forms with required consent, age confirmation, validation and duplicate prevention.
- Private lead dashboard: owner sign-in, rider/Captain filters, CSV download and record deletion.
- The existing SOS preview, unchanged. This does not send emergency alerts.
- The existing booking prototype functions, retained in app.js. The public button remains the waitlist, as on the published version; no real rides or payments are processed.
- Proposed business model, launch-readiness content and existing team placeholder. No invented survey results or team members.
- Vercel configuration, Supabase SQL, environment template, local server, tests and dependency lock file.
- An exact copy of the original frontend and hosting adapter under original-hosting/ for reference. This folder is not deployed as public content.

## Important: what must be connected

The old host used Cloudflare R2 storage and ChatGPT owner login. Vercel cannot reuse those automatically. This version uses **Supabase for lead storage** and a **private owner access key** for the dashboard. Configure these once using the steps below. Until then, forms report that saving is unavailable; they do not pretend to save.

This ZIP contains source code and assets, NOT existing lead records, private account details, API keys or passwords. Your old website remains unchanged. Existing signups stay on the old host. Export them from its private lead dashboard if you want to keep a separate copy. There is no automatic data migration or email sending.

## 1. Unzip and open

Extract the ZIP. Open the HerDrive-Vercel folder in VS Code. It contains package.json, public/, api/ and this README. Install Node.js 24 LTS if it is not installed.

In the VS Code terminal:

    npm install
    npm run build
    npm test

There are no third-party npm dependencies to download. npm install checks the included lock file.

## 2. Set up Supabase

1. Create a Supabase account and a project at https://supabase.com/.
2. Open that project's SQL Editor.
3. Paste the entire contents of supabase/schema.sql and run it once.
4. In the project's API settings, copy the project URL and a server-side secret key. New keys start with sb_secret_. A legacy service_role key is also supported. Do not use an anon/publishable key here.
5. Keep the Data API enabled with the public schema exposed. The SQL grants table access ONLY to the service role. Do not disable row-level security or add public read policies.

The server writes to public.leads. Browser visitors never receive the Supabase key and cannot list signups. Supabase project owners can also see the database in their own dashboard.

## 3. Create your dashboard access key

Run:

    node scripts/generate-admin-key.mjs

This prints a random 64-character key. Save it privately in a password manager. It is the password for your lead dashboard. Do not put it in public files, source control, screenshots or your expo QR code. Keep it with the site owner; anyone with it can view/export/delete leads.

## 4. Try it on your laptop

Copy .env.example to .env.local. Replace the three values:

| Variable | What goes here |
| --- | --- |
| SUPABASE_URL | Your Supabase project URL |
| SUPABASE_SECRET_KEY | Your server-side Supabase secret key |
| ADMIN_ACCESS_KEY | The 64-character key generated in step 3 |
| SITE_URL | Optional. Leave blank for automatic same-host checking. |

Then run:

    npm run dev

Open http://localhost:3000. The private dashboard is http://localhost:3000/leads.html. Paste your owner access key there. Sessions expire after eight hours; use Sign out when finished. Production cookies are Secure, HttpOnly and SameSite=Strict. Changing ADMIN_ACCESS_KEY invalidates existing sessions.

Opening index.html directly is only a visual preview. Forms need the server and configured database.

## 5. Put it on GitHub and Vercel

1. Create a GitHub repository. Upload the CONTENTS of HerDrive-Vercel so package.json is at the repository root. Include public/, api/, lib/, scripts/, supabase/, tests/, package.json, package-lock.json and vercel.json. Include .gitignore. Never upload .env.local.
2. In Vercel, choose Add New Project and import this repository.
3. Framework Preset: Other. Root Directory: the folder containing package.json. If you uploaded the outer folder instead, select HerDrive-Vercel as Root Directory.
4. Build Command: npm run build. Output Directory: public. Node.js version: 24.x. These settings are also declared in the included files.
5. Add SUPABASE_URL, SUPABASE_SECRET_KEY and ADMIN_ACCESS_KEY to the project's environment variables. Select Production; configure Preview separately if you want test deployments to save data. Treat these as sensitive values. Do not prefix them with PUBLIC or NEXT_PUBLIC.
6. Deploy. Vercel will provide an HTTPS address. Open it and check the website.
7. Open YOUR-VERCEL-ADDRESS/leads.html and sign in with the owner access key.

For SITE_URL, leave it blank to support the deployment's own hostname. If you set it to a canonical URL, use the exact HTTPS origin without a trailing slash; forms on other hosts, including previews, will be rejected. Adding/changing environment variables requires a new deployment.

Vercel hosts HTML, assets and API functions. Supabase stores the leads. No paid domain is required. Provider account limits and pricing apply to your accounts.

## 6. Test before the expo

- Submit one clearly labelled test rider and one test Captain.
- Confirm both appear in /leads.html, then refresh to check persistence.
- Test the filter and CSV download.
- Delete only your test rows and verify they disappear.
- Sign out and confirm no lead data is visible. A visitor can load the dashboard page shell, but the server refuses data access until sign-in.
- Check on a phone, test the navigation and open the SOS preview.
- Confirm real data is not included in any public screenshots or shared CSV files.

## Folder guide

| Folder/file | Purpose |
| --- | --- |
| public/index.html | Website content and layout |
| public/style.css | Responsive styling |
| public/app.js | Forms, navigation, booking and SOS interactions |
| public/assets/ | All images, SVG logo and bundled fonts |
| public/leads.html, leads.js | Owner dashboard and CSV export |
| api/ | Vercel Node.js endpoint entry points |
| lib/backend.mjs | Validation, private sessions and Supabase operations |
| lib/vercel-handler.mjs | Vercel request/response adapter |
| supabase/schema.sql | Database setup and access rules |
| scripts/ | Local server, validation and key-generation utilities |
| tests/ | Backend regression tests using an in-memory mock of Supabase |
| original-hosting/ | Original published source adapter and frontend snapshot |

## Security and operational limits

The owner login intentionally uses a cryptographically random key, not a short human password. The public forms have a honeypot and server validation, but no CAPTCHA or persistent rate limiter. Before broad promotion, configure abuse/rate protections in your hosting firewall and monitor database usage. Limit who can access the owner key and Supabase dashboard. Decide and communicate a real retention/deletion policy before collecting at scale. Delete withdrawn leads and protect CSV exports.

This remains a pre-launch marketing website. It does not dispatch rides, vet Captains, take payments, contact sponsors, send marketing emails, or operate a real emergency service. Those require separate operational systems. The website's illustrative business figures remain labelled as proposals.

## Verification and provenance

Exported from published HerDrive version 5, source commit 00de768e2b6d3e31adab70e0eaf7ad98f9ba41c5. The Vercel adaptation is separate; it does not change the current published website.

Checks included: JavaScript syntax, bundled asset paths, font files, backend auth/consent/origin checks, successful insert and duplicate handling, Captain validation, protected reads/deletes, logout and database failure handling. These use local mocked storage. A real Vercel/Supabase deployment has not been performed for this ZIP; complete the checklist after connecting your own accounts.

Official references:
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/project-configuration/vercel-json
- https://supabase.com/docs/guides/api
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Assets

Campaign photographs are AI-generated illustrations carried over from the website. The logo is included as SVG for sharp scaling. Icons are inline SVG, CSS or text glyphs; there is no missing icon package. Fonts are supplied with their licences in public/assets/fonts/. Browser fallbacks remain Arial and Georgia. See ASSETS.md for the file manifest.
