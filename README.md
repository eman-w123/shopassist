# ShopAssist

ShopAssist is a polished AI shopping assistant platform for online stores. It gives merchants a branded dashboard to manage storefronts and product catalogs, then turns that catalog into a product-aware chatbot that can be embedded on any website with a single script tag.

The experience is built to feel instant and trustworthy: shoppers ask about products, pricing, sizing, and stock; the assistant responds using live catalog data; merchants customize the assistant’s look and voice; and the same widget can be previewed in the app or launched as an embeddable component.

## What it does

- Product-aware customer support that answers from the store’s actual catalog.
- Merchant dashboard for creating stores, editing branding, and managing products.
- One-line embed via `public/widget.js`.
- Standalone preview at `/embed/:slug`.
- Supabase-backed persistence for stores, products, conversations, and messages.
- Server-side AI routing through a Supabase Edge Function.

## Core Experience

### For shoppers

- Ask questions about products, prices, stock status, sizing, and links.
- Get concise, helpful replies generated from the live catalog.
- Interact with a widget that can match the store’s visual identity.

### For merchants

- Create and manage stores from the dashboard.
- Add products with descriptions, prices, categories, tags, images, URLs, and stock states.
- Adjust store branding such as greeting text, currency, and primary color.
- Copy an embed snippet and drop the widget into any storefront.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router
- TanStack Query
- Supabase client + Edge Functions
- Google Gemini through the hosted AI gateway

## Project Layout

- `src/pages/Index.tsx` - marketing landing page
- `src/pages/Dashboard.tsx` - store management hub
- `src/pages/StoreEditor.tsx` - catalog, branding, and embed controls
- `src/pages/EmbedView.tsx` - standalone widget preview
- `src/components/ChatWidget.tsx` - the actual chat UI
- `public/widget.js` - script that mounts the floating embed
- `supabase/functions/chat/index.ts` - AI chat orchestration and persistence

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create your local environment file

Create a `.env` file in the project root with the following values:

```env
VITE_SUPABASE_URL="https://ilpavvsnhtaxetmxcfje.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIs...JMg"
VITE_SUPABASE_PROJECT_ID="ilpavvsnhtaxetmxcfje"
```

These point the local app at the same Supabase project, database, and edge functions used by the preview environment.

### 3. Start the dev server

```bash
npm run dev
```

Open `http://localhost:8080`.

## Embedding the Widget

Add the script below to any storefront page:

```html
<script src="https://your-domain.com/widget.js" data-store="your-store-slug" defer></script>
```

The script renders a floating launcher and opens the embedded assistant in an iframe. The `data-store` attribute must match the store slug created in the dashboard.

## How It Works

1. A merchant creates a store and populates products in the dashboard.
2. The widget loads the store by slug from Supabase.
3. Shopper messages are sent to the chat edge function.
4. The edge function builds a system prompt from the live catalog and calls the AI gateway.
5. The assistant reply is returned to the widget and stored in the conversation history.

This architecture keeps the chat logic server-side while leaving the embed lightweight and easy to deploy.

## Scripts

```bash
npm run dev       # Start the Vite dev server
npm run build     # Create a production build
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
npm run test      # Run the test suite once
```

## Notes

- The local frontend talks to the hosted backend through Supabase.
- The AI gateway key stays server-side inside the edge function.
- The widget can be used standalone via `/embed/:slug` or embedded through `widget.js`.

## Why This Project Stands Out

ShopAssist is not a generic chatbot demo. It is an end-to-end commerce support layer: merchant-controlled, catalog-aware, brandable, and built to slot into an existing store with almost no integration friction. The result is a chatbot that feels like part of the storefront rather than a bolted-on support toy.
