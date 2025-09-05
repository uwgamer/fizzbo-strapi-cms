const { parse } = require('pg-connection-string');

/**
 * Database Configuration for Fizzbo Strapi CMS
 * 
 * Connects to shared Supabase PostgreSQL database with strapi_ table prefix
 * to avoid conflicts with existing Supabase tables while enabling data sharing
 * and unified authentication between systems.
 */

module.exports = ({ env }) => {
  // Parse database connection string from environment - try multiple patterns
  const databaseUrl = 
    env('DATABASE_URL') || 
    env('SUPABASE_DB_URL') ||
    env('STRAPI_DATABASE_URL') ||
    env('DB_URL') ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.STRAPI_DATABASE_URL ||
    process.env.DB_URL;
  
  console.log('🔍 Environment variable check:');
  console.log('DATABASE_URL:', env('DATABASE_URL') ? 'found' : 'not found');
  console.log('SUPABASE_DB_URL:', env('SUPABASE_DB_URL') ? 'found' : 'not found');
  console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL ? 'found' : 'not found');
  console.log('process.env.SUPABASE_DB_URL:', process.env.SUPABASE_DB_URL ? 'found' : 'not found');
  
  if (!databaseUrl) {
    // For Strapi Cloud: Environment variables might only be available at runtime, not build time
    // Use a default connection during build, real connection at runtime
    console.warn('⚠️ No database URL found during build. Using build-time fallback.');
    console.log('🏗️ Build stage detected - environment variables will be available at runtime');
    
    // Minimal connection for build stage - will be replaced at runtime
    return {
      connection: {
        client: 'postgres',
        connection: {
          host: 'localhost',
          port: 5432,
          database: 'strapi_build',
          user: 'strapi',
          password: 'strapi',
        },
        useNullAsDefault: true,
        prefix: 'strapi_',
      },
    };
  }
  
  console.log('✅ Database URL found, connecting...');

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