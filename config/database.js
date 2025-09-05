/**
 * Database Configuration for Fizzbo Strapi CMS
 * 
 * Uses official Strapi Cloud individual environment variables pattern
 * instead of connection strings to avoid IPv6 connectivity issues.
 * Connects to shared Supabase PostgreSQL database with strapi_ table prefix.
 */

module.exports = ({ env }) => {
  console.log('🔍 Strapi Cloud Database Configuration');
  console.log('📊 Using individual environment variables pattern');
  
  // Check for individual environment variables (Strapi Cloud official pattern)
  const hasIndividualVars = env('DATABASE_HOST') || env('DATABASE_NAME');
  
  if (hasIndividualVars) {
    console.log('✅ Individual database environment variables found');
    console.log('🔌 Database Host:', env('DATABASE_HOST', 'not-set'));
    console.log('🔌 Database Name:', env('DATABASE_NAME', 'not-set'));
    console.log('🔌 Database Port:', env('DATABASE_PORT', 'not-set'));
    
    return {
      connection: {
        client: env('DATABASE_CLIENT', 'postgres'),
        connection: {
          host: env('DATABASE_HOST', 'db.dsnoxaolyvopzyrjzukb.supabase.co'),
          port: env.int('DATABASE_PORT', 5432),
          database: env('DATABASE_NAME', 'postgres'),
          user: env('DATABASE_USERNAME', 'postgres.dsnoxaolyvopzyrjzukb'),
          password: env('DATABASE_PASSWORD', 'Wus7VcuYgvd'),
          ssl: env.bool('DATABASE_SSL', true) ? {
            rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false)
          } : false,
          schema: env('DATABASE_SCHEMA', 'public'),
        },
        pool: { 
          min: env.int('DATABASE_POOL_MIN', 2), 
          max: env.int('DATABASE_POOL_MAX', 10) 
        },
        useNullAsDefault: true,
        prefix: env('DATABASE_PREFIX', 'strapi_'),
        acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
      },
    };
  }
  
  // Fallback to connection string pattern for development
  const databaseUrl = 
    env('DATABASE_URL') || 
    env('SUPABASE_DB_URL') ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL;
  
  if (databaseUrl) {
    console.log('✅ Database connection string found');
    const { parse } = require('pg-connection-string');
    const config = parse(databaseUrl);
    
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
        useNullAsDefault: true,
        prefix: env('DATABASE_PREFIX', 'strapi_'),
        acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
      },
    };
  }
  
  // Final fallback with hardcoded values for build-time
  console.warn('⚠️ No database configuration found. Using build-time defaults.');
  return {
    connection: {
      client: 'postgres',
      connection: {
        host: 'db.dsnoxaolyvopzyrjzukb.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres.dsnoxaolyvopzyrjzukb',
        password: 'Wus7VcuYgvd',
        ssl: { rejectUnauthorized: false },
        schema: 'public',
      },
      pool: { min: 2, max: 10 },
      useNullAsDefault: true,
      prefix: 'strapi_',
      acquireConnectionTimeout: 60000,
    },
  };
};