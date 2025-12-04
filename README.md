# Locafy Frontend - Next.js

A modern Next.js frontend for the Locafy local business directory application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file (optional):
```env
NEXT_PUBLIC_API_URL=http://localhost:7000/api
```

3. Start the development server (runs on port 3000):
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
front-end-system/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with AuthProvider
│   ├── page.tsx           # Landing page
│   ├── login/             # Login page
│   ├── register/          # Register page
│   ├── home/              # Home page
│   └── ...                # Other pages
├── src/
│   ├── components/        # Reusable React components
│   ├── contexts/          # React contexts (Auth)
│   ├── services/          # API service layer
│   ├── constants/         # Constants (barangays, categories)
│   └── types/             # TypeScript type definitions
└── public/                # Static assets
```

## Tech Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Axios** - HTTP client
- **Next.js App Router** - File-based routing

## Port Configuration

The application is configured to run on port 3000 by default. This is set in:
- `package.json` scripts: `"dev": "next dev -p 3000"`
- `package.json` scripts: `"start": "next start -p 3000"`

## Migration Notes

This project was migrated from Create React App to Next.js:
- React Router → Next.js App Router
- `useNavigate()` → `useRouter()` from `next/navigation`
- `Link` from `react-router-dom` → `Link` from `next/link`
- Environment variables: `REACT_APP_*` → `NEXT_PUBLIC_*`
- All client components marked with `'use client'` directive
