/**
 * Admin Panel Configuration for Fizzbo Strapi CMS
 * 
 * Integrates with Supabase authentication and provides
 * secure admin access with JWT token sharing
 */

module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'default-jwt-secret-change-in-production'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'default-api-token-salt'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'default-transfer-token-salt'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  // Admin panel URL configuration for Railway
  url: env('ADMIN_URL', '/admin'),
  // Disable registration for security
  registration: {
    enabled: env.bool('ADMIN_REGISTRATION_ENABLED', false),
  },
  // Forgot password settings
  forgotPassword: {
    enabled: env.bool('ADMIN_FORGOT_PASSWORD_ENABLED', true),
    from: env('ADMIN_FROM_EMAIL', 'admin@fizzbo.com'),
    replyTo: env('ADMIN_REPLY_TO_EMAIL', 'noreply@fizzbo.com'),
  },
  // Session configuration
  session: {
    name: 'fizzbo-strapi-session',
    secret: env('SESSION_SECRET', 'default-session-secret'),
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    secure: env.bool('SESSION_SECURE', env('NODE_ENV') === 'production'),
  }
});