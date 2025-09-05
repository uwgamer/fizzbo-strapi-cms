/**
 * Middleware Configuration for Fizzbo Strapi CMS
 * 
 * Configured for integration with Fizzbo platform and Railway deployment
 * Includes security, CORS, and performance optimizations
 */

module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            '*.supabase.co', // Allow Supabase storage images
            '*.amazonaws.com', // Allow AWS S3 images
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            '*.supabase.co',
            '*.amazonaws.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: [
        'http://localhost:8081', // Local Fizzbo development
        'https://d11ze0u6raprps.cloudfront.net', // Fizzbo staging
        'https://fizzbo.com', // Future production domain
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      keepHeadersOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  
  // Custom health check middleware
  {
    name: 'health-check',
    config: {},
    resolve: ({ strapi }) => {
      return async (ctx, next) => {
        if (ctx.path === '/_health') {
          ctx.status = 200;
          ctx.body = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: strapi.db ? 'connected' : 'disconnected',
            auth: 'ready',
            version: strapi.config.info.version || '1.0.0',
            environment: process.env.NODE_ENV || 'production'
          };
          return;
        }
        await next();
      };
    },
  },

  // Custom Supabase authentication middleware
  {
    name: 'global::supabase-auth',
    config: {}
  },
];