/**
 * Authentication Routes for Supabase Integration
 * 
 * Custom authentication routes that handle Supabase JWT tokens
 * and create corresponding Strapi authentication sessions
 */

'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/supabase/verify',
      handler: 'auth.verifySupabaseToken',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Verify Supabase JWT token and return Strapi JWT',
        tags: ['Authentication', 'Supabase']
      }
    },
    {
      method: 'POST', 
      path: '/auth/supabase/sync',
      handler: 'auth.syncUserFromSupabase',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Sync user data from Supabase to Strapi',
        tags: ['Authentication', 'User Management']
      }
    },
    {
      method: 'GET',
      path: '/auth/supabase/callback',
      handler: 'auth.handleOAuthCallback',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Handle OAuth callback from Supabase',
        tags: ['Authentication', 'OAuth']
      }
    }
  ]
};