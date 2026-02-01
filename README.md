# Echo Agent - Community-Driven Code Automation

Echo Agent is an AI-powered platform that bridges the gap between community feedback and codebase evolution. By monitoring GitHub repository comments and discussions, Echo uses Gemini AI and pgVector to analyze feedback, detect patterns, and automatically propose code changes via Pull Requests.

## Features

- **Real-time Monitoring**: Tracks feedback across multiple repositories via Supabase.
- **Semantic Feedback Analysis**: Uses Gemini Pro for sentiment and category classification.
- **Vector-Powered Search**: Semantic search over thousands of comments using pgVector.
- **AI Code Proposals**: Automatically implements fixes and features based on community consensus.
- **Human-in-the-Loop**: A streamlined PR approval system for developers.
- **Multi-Account API Support**: Rotating Gemini API keys to handle scale and rate limits.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (Postgres) with `pgVector`
- **AI**: Google Gemini AI (Pro & Embedding models)
- **Infrastructure**: Upstash Redis (Rate Limiting), Vercel

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/echo-v2.git
   cd echo-v2
   ```

2. **Environment Variables**:
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   GEMINI_API_KEYS=key1,key2,key3
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   ```

3. **Database Migrations**:
   Deploy the migrations found in the `supabase/migrations` folder to your Supabase project.

4. **Install Dependencies**:
   ```bash
   npm install
   ```

5. **Run Locally**:
   ```bash
   npm run dev
   ```

## Documentation

- [User Guide](file:///e:/Projects/echo-v2/USER_GUIDE.md)
- [Architecture Walkthrough](file:///C:/Users/Varad%20Singhal/.gemini/antigravity/brain/d83d4245-9053-48fd-b17c-6955eeef5027/walkthrough.md)
