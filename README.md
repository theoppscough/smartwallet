# SmartWallet MVP

SmartWallet is a responsive prototype for the CIS 9590 Group 4 term project. It combines an expense tracker, monthly budget view, credit-card reward recommendation engine, and administrator reporting portal.

## Current prototype features

### End user
- Sign in and create an account
- View a monthly spending dashboard
- Add, edit, delete, and filter expenses
- Add and remove credit-card products from a wallet
- Compare cards for an upcoming purchase
- See estimated rewards based on administrator-managed rules

### Administrator
- View aggregate category and card-usage reports
- Add new card products
- Activate or deactivate cards
- Add and edit reward rates
- Turn individual reward rules on or off

## Data mode

The first version uses browser `localStorage`, so the complete interface works before a Supabase project is connected. Demo passwords are intentionally stored only in local prototype data; this mode must not be used for real accounts or financial information. Use the reset button on the login page to restore the seed dataset.

The `supabase/schema.sql` file creates the production-style PostgreSQL structure, database views, policies, and seed card data for the next integration phase.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| User | `user@smartwallet.demo` | `demo123` |
| Admin | `admin@smartwallet.demo` | `admin123` |

The login page also includes one-click demo buttons.

## Run locally

Requirements:
- Node.js 20.19+ or 22.12+
- npm

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, normally `http://localhost:5173`.

## Build for deployment

```bash
npm run build
npm run preview
```

The production bundle is generated in `dist/`.

## Connect Supabase

1. Create a Supabase project.
2. Open the SQL Editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Add the project URL and publishable key.
5. Replace the local-storage context methods with Supabase queries using `src/lib/supabase.js`.
6. Create one user in Supabase Auth, then change that user's `profiles.role` to `admin` in the SQL Editor for the admin demo.

## Recommended next development phase

1. Wire Supabase Auth to the login and registration form.
2. Replace expense CRUD with `expenses` table queries.
3. Replace wallet management with `user_cards` queries.
4. Load cards and reward rules from Supabase.
5. Query the two reporting views from the administrator portal.
6. Add loading states and user-facing error handling for network failures.

## Project structure

```text
src/
├── components/          Shared layout and UI
├── context/             Prototype state and CRUD operations
├── data/                Demo seed data
├── lib/                 Supabase client
├── pages/               User and administrator screens
├── services/            Formatting and recommendation logic
└── styles.css           Responsive application design
supabase/
└── schema.sql           PostgreSQL schema, RLS, views, and seed data
```
