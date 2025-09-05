/**
 * Strapi Plugins Configuration
 * 
 * Configures Strapi plugins including users-permissions with Supabase integration
 * and other plugins required for Fizzbo CMS functionality
 */

'use strict';

module.exports = ({ env }) => ({
  // Users & Permissions plugin with Supabase integration
  'users-permissions': {
    enabled: true,
    config: {
      register: {
        allowedFields: ['firstName', 'lastName', 'fullName', 'phone', 'verificationLevel', 'supabaseId']
      },
      
      // JWT configuration to work with Supabase
      jwt: {
        expiresIn: '30d'
      },
      
      // Custom providers configuration
      providers: {
        supabase: {
          enabled: true,
          icon: 'supabase',
          key: env('SUPABASE_CLIENT_ID', 'supabase'),
          secret: env('SUPABASE_SERVICE_ROLE_KEY'),
          callback: `${env('HOST', 'localhost')}/auth/supabase/callback`,
          scope: ['read', 'write']
        }
      },
      
      // Email configuration
      email: {
        from: env('ADMIN_FROM_EMAIL', 'admin@fizzbo.com'),
        replyTo: env('ADMIN_REPLY_TO_EMAIL', 'noreply@fizzbo.com')
      }
    }
  },
  
  // Email plugin configuration
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'localhost'),
        port: env('SMTP_PORT', 1025),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('ADMIN_FROM_EMAIL', 'admin@fizzbo.com'),
        defaultReplyTo: env('ADMIN_REPLY_TO_EMAIL', 'noreply@fizzbo.com'),
      },
    },
  },
  
  // Upload plugin for file management
  upload: {
    config: {
      sizeLimit: 250 * 1024 * 1024, // 250MB
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      }
    }
  },
  
  // Documentation plugin
  documentation: {
    enabled: true,
    config: {
      restrictedAccess: false,
      password: env('DOCUMENTATION_PASSWORD'),
      
      // OpenAPI specification
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Fizzbo Strapi CMS API',
        description: 'API documentation for Fizzbo Strapi CMS integration',
        contact: {
          name: 'Fizzbo Development Team',
          email: 'dev@fizzbo.com'
        }
      },
      
      // Server configuration
      servers: [
        {
          url: env('FIZZBO_FRONTEND_URL', 'https://d11ze0u6raprps.cloudfront.net'),
          description: 'Fizzbo Frontend'
        },
        {
          url: 'https://localhost:1337',
          description: 'Local development'
        }
      ]
    }
  },
  
  // GraphQL plugin (optional, can be enabled if needed)
  graphql: {
    enabled: false,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: false,
      depthLimit: 7,
      amountLimit: 100,
      apolloServer: {
        tracing: false,
      },
    }
  },
  
  // Internationalization plugin
  i18n: {
    enabled: true,
    config: {
      locales: ['en', 'es'], // English and Spanish support
      defaultLocale: 'en'
    }
  }
});