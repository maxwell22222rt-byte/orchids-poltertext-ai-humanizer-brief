# Vercel Deployment Guide

## ✅ Backend Migration Complete

The Python FastAPI backend has been successfully converted to Next.js API routes. All functionality now runs natively on Vercel without requiring a separate Python server.

### What Was Changed

1. **Migrated Python backend logic** from `backend/main.py` to Next.js API routes:
   - `/api/humanize` - Text humanization endpoint
   - `/api/paraphrase` - Text paraphrasing endpoint

2. **Integrated OpenAI** directly in the Next.js API routes

3. **Preserved all functionality**:
   - Rule-based preprocessing (AI pattern removal, sentence restructuring)
   - OpenAI GPT-4o integration for humanization
   - Rule-based postprocessing (contractions, cleanup)
   - Database logging via Supabase
   - 5000 word limit validation

## Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: [vercel.com/new](https://vercel.com/new)

2. **Import Your Repository**:
   - Click "Import Git Repository"
   - Select `maxwell22222rt-byte/orchids-poltertext-ai-humanizer-brief`

3. **Configure Environment Variables**:
   Add these in Project Settings → Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   DATABASE_URL=your_database_url
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Deploy**: Click "Deploy" and Vercel will automatically:
   - Detect Next.js framework
   - Install dependencies with `npm install --legacy-peer-deps`
   - Build your project with `npm run build`
   - Deploy to production

5. **Your app will be live** at: `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Environment Variables

Make sure to set all environment variables in Vercel:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (private) |
| `DATABASE_URL` | PostgreSQL database connection string |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o |

## API Endpoints

Once deployed, your API endpoints will be available at:

- `POST https://your-project.vercel.app/api/humanize`
- `POST https://your-project.vercel.app/api/paraphrase`
- `POST https://your-project.vercel.app/api/history`

### Example API Request

```bash
curl -X POST https://your-project.vercel.app/api/humanize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your AI-generated text here",
    "tone": "professional",
    "readability": "natural"
  }'
```

## Build Configuration

- **Framework**: Next.js 15.3.6
- **Node Version**: Auto-detected by Vercel (Node 20+ recommended)
- **Build Command**: `npm run build`
- **Install Command**: `npm install --legacy-peer-deps`
- **Output Directory**: `.next` (auto-detected)

## Troubleshooting

### Build Errors
- TypeScript errors are ignored (`ignoreBuildErrors: true`)
- ESLint errors are ignored (`ignoreDuringBuilds: true`)

### Missing OpenAI API Key
The app will fall back to rule-based processing if `OPENAI_API_KEY` is not set.

### Database Connection Issues
Check that your `DATABASE_URL` is correct and accessible from Vercel's network.

## Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Notes

- The old Python backend in `backend/main.py` is no longer needed for deployment
- All backend logic is now in Next.js API routes
- The app is optimized for Vercel's serverless architecture
- Environment variables are loaded automatically from `.env` locally
