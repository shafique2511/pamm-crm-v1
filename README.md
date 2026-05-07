# PAMM CRM

A professional CRM and operations dashboard for managing PAMM investors, trading periods, transactions, manager withdrawals, affiliate tracking, reports, and audit activity.

## Overview

PAMM CRM is a React and Vite application designed for investment managers who need a clear operational view of investor accounts and period performance. The application supports investor onboarding, capital tracking, fee calculations, transaction workflows, reporting, and role-based manager access.

## Features

- Investor management with profiles, account status, capital balances, fee settings, and payout preferences.
- Dashboard analytics for capital, profit allocation, manager wallet balances, and period performance.
- Transaction tracking for deposits, withdrawals, fee payments, and manager withdrawals.
- Trading journal and period history views for reviewing performance over time.
- Reports and invoice generation with export-oriented dependencies.
- Affiliate and IB commission management.
- Manager settings, permissions, branding, and operational configuration.
- Audit log for key authentication, investor, transaction, trade, and system activity.
- Optional Supabase persistence when environment variables are configured.

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Supabase JavaScript client
- Recharts
- jsPDF and html2canvas
- Google Gemini API integration

## Prerequisites

- Node.js 20 or later
- npm
- A Supabase project, if database persistence is required
- A Gemini API key, if Gemini-powered features are used

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Configure the required values in `.env.local`:

   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   APP_URL="http://localhost:3000"
   VITE_SUPABASE_URL="your-supabase-project-url"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the app at:

   ```text
   http://localhost:3000
   ```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server on port 3000. |
| `npm run build` | Creates a production build in `dist`. |
| `npm run preview` | Serves the production build locally for review. |
| `npm run lint` | Runs TypeScript validation with `tsc --noEmit`. |
| `npm run clean` | Removes the production build output. |

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Optional | Gemini API key for AI-powered functionality. |
| `APP_URL` | Optional | Public application URL for self-referential links and callbacks. |
| `VITE_SUPABASE_URL` | Optional | Supabase project URL used by the frontend client. |
| `VITE_SUPABASE_ANON_KEY` | Optional | Supabase anonymous key used by the frontend client. |

If Supabase variables are not provided, the application creates no Supabase client and database-backed operations will not persist remotely.

## Project Structure

```text
src/
  components/      Application views, tables, modals, dashboards, and settings
  lib/             Shared utilities and Supabase client setup
  App.tsx          Main application state and routing logic
  main.tsx         React entry point
  types.ts         Shared domain types
```

## Production Build

Create and preview a production build before deployment:

```bash
npm run build
npm run preview
```

Deploy the generated `dist` directory to any static hosting provider that supports Vite applications. Configure the same environment variables in the target hosting environment.

## Notes

- This project is marked private in `package.json`.
- Supabase table structure and access policies must match the application data model in `src/types.ts`.
- Review production credentials and database permissions before exposing the app publicly.
