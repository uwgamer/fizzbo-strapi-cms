const { parse } = require('pg-connection-string');

/**
 * Database Configuration for Fizzbo Strapi CMS
 * 
 * Connects to shared Supabase PostgreSQL database with strapi_ table prefix
 * to avoid conflicts with existing Supabase tables while enabling data sharing
 * and unified authentication between systems.
 */

module.exports = ({ env }) => {
  // Parse database connection string from environment
  const databaseUrl = env('DATABASE_URL') || env('SUPABASE_DB_URL');
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required');
    process.exit(1);
  }

  const config = parse(databaseUrl);

  console.log('🔌 Strapi Database: Connecting to shared Supabase PostgreSQL');
  console.log('📊 Database Host:', config.host);
  console.log('📊 Database Name:', config.database);
  console.log('📊 Table Prefix: strapi_');

  return {
    connection: {
      client: 'postgres',
      connection: {
        connectionString: databaseUrl,
        ssl: env.bool('DATABASE_SSL', true) ? {
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false)
        } : false,
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { 
        min: env.int('DATABASE_POOL_MIN', 2), 
        max: env.int('DATABASE_POOL_MAX', 10) 
      },
      // Use strapi_ prefix for all tables to avoid conflicts with Supabase
      useNullAsDefault: true,
      prefix: env('DATABASE_PREFIX', 'strapi_'),
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};