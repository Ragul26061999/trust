#!/usr/bin/env node

// Supabase MCP Server - Note: The actual server is started via npx mcp-server-supabase command
// This script documents the configuration needed for the MCP server

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Supabase MCP Server Configuration:');
console.log('===================================');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing');
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing');
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing');

// Instructions for running the MCP server
console.log('\nTo start the MCP server, run:');
console.log('npx mcp-server-supabase --supabase-url $NEXT_PUBLIC_SUPABASE_URL --anon-key $NEXT_PUBLIC_SUPABASE_ANON_KEY --service-role-key $SUPABASE_SERVICE_ROLE_KEY');

console.log('\nOr with a local config file containing:');
console.log('{');
console.log('  "supabaseUrl": "<your_supabase_url>",');
console.log('  "anonKey": "<your_anon_key>",');
console.log('  "serviceRoleKey": "<your_service_role_key>"');
console.log('}');

console.log('\nThe MCP server provides AI-assisted database context to IDEs and AI agents.');