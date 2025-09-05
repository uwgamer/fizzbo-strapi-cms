# Fizzbo Strapi CMS

A Strapi 4.25.9 CMS application integrated with Supabase PostgreSQL database for the Fizzbo real estate platform.

## Features

- Strapi CMS 4.25.9
- PostgreSQL database integration via Supabase
- Cloud deployment ready
- User permissions and content types
- API documentation plugin

## Database Configuration

Uses shared Supabase PostgreSQL database with `strapi_` table prefix to avoid conflicts with main application tables.

## Deployment

Designed for deployment on Strapi Cloud with external PostgreSQL database connection to Supabase.

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_DB_URL` - Alternative environment variable for database connection
- Strapi security keys for JWT and encryption