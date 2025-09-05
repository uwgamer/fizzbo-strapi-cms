/**
 * Server Configuration for Fizzbo Strapi CMS
 * 
 * Optimized for Railway deployment with proper CORS settings
 * for integration with Fizzbo frontend and zero-disruption operation
 */

module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', ['defaultkey1', 'defaultkey2']),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  settings: {
    cors: {
      enabled: true,
      headers: '*',
      origin: [
        'http://localhost:8081', // Local Fizzbo development
        'https://d11ze0u6raprps.cloudfront.net', // Fizzbo staging
        'https://fizzbo.com', // Future production domain
        env('FIZZBO_FRONTEND_URL', 'http://localhost:8081') // Dynamic frontend URL
      ]
    },
    logger: {
      level: env('LOG_LEVEL', 'info'),
      requests: true
    }
  },
  // Health check endpoint for Railway and monitoring
  healthcheck: {
    enabled: true,
    endpoint: '/_health'
  }
});