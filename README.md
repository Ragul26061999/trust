# Turesh - Your Personal Productivity Platform

## Overview
Turesh is a comprehensive productivity platform built with Next.js and powered by Supabase for database, authentication, and storage services. The platform provides various tools to help users manage their personal and professional lives efficiently.

## Features
- **Dashboard**: Central hub for accessing all features
- **Calendar**: Personal and professional scheduling
- **Focus Mode**: Distraction-free work environment
- **Note Taking**: Quick note capture and organization
- **Analytics**: Insights into productivity and time management
- **User Authentication**: Secure login with Google OAuth
- **Customization**: Theme and preference settings

## Technology Stack
- **Framework**: Next.js 16.1.1 with React 19.2.3
- **UI Library**: Material-UI (MUI) v7.3.6
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with Google OAuth
- **Storage**: Supabase Storage
- **APIs**: Supabase REST/GraphQL APIs
- **AI Integration**: Supabase MCP (Model Context Protocol) for AI assistance

## Supabase Integration
All Supabase services are successfully connected to the project:

✅ **Database**: PostgreSQL via Supabase  
✅ **Authentication**: Supabase Auth with Google OAuth  
✅ **Storage**: Available via Supabase Storage  
✅ **APIs**: Supabase REST/GraphQL APIs  
✅ **AI Integration**: MCP server connected for AI assistance  

### Connection Details
- **Project URL**: https://zkezubbjstrixkpqjias.supabase.co
- **Project ID**: zkezubbjstrixkpqjias
- **Client SDK**: Integrated in `lib/supabase.ts`
- **Server SDK**: Integrated in `lib/supabase-server.ts`
- **MCP Server**: Running and connected for AI assistance

## Getting Started

### Prerequisites
- Node.js 18 or higher
- Supabase CLI (optional, for local development)
- Docker (optional, for local Supabase development)

### Installation
1. Clone the repository:
```bash
git clone <repository-url>
cd turesh
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.local.example .env.local
```
> Note: The `.env.local` file is already configured with your Supabase credentials.

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to [http://localhost:3000](http://localhost:3000)

## Development

### Adding New Features
1. Create a new page in the `app/` directory
2. Use the Supabase client from `lib/supabase.ts` for client-side operations
3. Use the Supabase server client from `lib/supabase-server.ts` for server-side operations
4. Follow the existing patterns for authentication and data handling

### Environment Variables
The project uses the following environment variables (already configured in `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Supabase Local Development
If you want to run Supabase locally for development:

1. Make sure Docker is running
2. Start local Supabase:
```bash
supabase start
```

3. To stop local Supabase:
```bash
supabase stop
```

## Project Structure
```
app/                    # Next.js app router pages
├── dashboard/          # Dashboard page
├── calendar/           # Calendar functionality
├── focus-mode/         # Focus mode feature
├── note-taking/        # Note taking feature
├── personal/           # Personal tools
├── professional/       # Professional tools
├── analytical/         # Analytics pages
├── login/              # Authentication pages
components/            # Reusable UI components
lib/                   # Utility functions and Supabase clients
├── supabase.ts        # Client-side Supabase client
├── supabase-server.ts # Server-side Supabase client
├── supabase-auth.ts   # Authentication utilities
├── auth-context.tsx   # Authentication context
supabase/              # Supabase configuration and migrations
├── migrations/        # Database migration files
├── config.toml        # Supabase configuration
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
This project is licensed under the MIT License.