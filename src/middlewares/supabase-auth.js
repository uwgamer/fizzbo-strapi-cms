/**
 * Supabase Authentication Middleware
 * 
 * Handles JWT token validation and user synchronization between
 * Supabase and Strapi authentication systems
 */

'use strict';

const jwt = require('jsonwebtoken');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    console.log('🔐 SupabaseAuth: Processing request...', {
      path: ctx.path,
      method: ctx.method,
      hasAuth: !!ctx.headers.authorization
    });
    
    try {
      // Skip auth for public routes and Strapi admin
      const publicPaths = [
        '/_health',
        '/auth',
        '/admin',
        '/documentation',
        '/uploads'
      ];
      
      const isPublicPath = publicPaths.some(path => ctx.path.startsWith(path));
      
      if (isPublicPath) {
        console.log('🔓 SupabaseAuth: Public path, skipping auth');
        return await next();
      }
      
      // Extract JWT token from Authorization header
      const authHeader = ctx.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('⚠️ SupabaseAuth: No valid authorization header');
        return await next(); // Let Strapi handle unauthorized requests
      }
      
      const token = authHeader.slice(7); // Remove 'Bearer ' prefix
      
      // Validate Supabase JWT token
      const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
      
      if (!supabaseJwtSecret) {
        console.warn('⚠️ SupabaseAuth: SUPABASE_JWT_SECRET not configured');
        return await next();
      }
      
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, supabaseJwtSecret);
        console.log('✅ SupabaseAuth: Token validated', { 
          userId: decodedToken.sub,
          role: decodedToken.role 
        });
      } catch (jwtError) {
        console.log('❌ SupabaseAuth: Invalid JWT token', jwtError.message);
        return await next(); // Let Strapi handle invalid tokens
      }
      
      // Get or create Strapi user based on Supabase user
      const supabaseUserId = decodedToken.sub;
      const userEmail = decodedToken.email;
      
      if (!supabaseUserId || !userEmail) {
        console.warn('⚠️ SupabaseAuth: Missing user ID or email in token');
        return await next();
      }
      
      // Check if user exists in Strapi
      let strapiUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: userEmail }
      });
      
      if (!strapiUser) {
        // Create new Strapi user based on Supabase data
        console.log('👤 SupabaseAuth: Creating new Strapi user', { email: userEmail });
        
        try {
          // Get user details from Supabase user_profiles table
          const { data: profileData } = await strapi
            .service('api::fizzbo-integration.fizzbo-integration')
            .syncUserFromSupabase(supabaseUserId, {
              email: userEmail,
              role: decodedToken.role || 'authenticated',
              firstname: decodedToken.user_metadata?.first_name,
              lastname: decodedToken.user_metadata?.last_name,
              full_name: decodedToken.user_metadata?.full_name
            });
          
          strapiUser = profileData;
          
        } catch (syncError) {
          console.error('❌ SupabaseAuth: Failed to sync user', syncError);
          return await next();
        }
      } else {
        // Update existing user's last activity
        await strapi.query('plugin::users-permissions.user').update({
          where: { id: strapiUser.id },
          data: { 
            updatedAt: new Date(),
            // Update role if it changed in Supabase
            role: await strapi
              .service('api::fizzbo-integration.fizzbo-integration')
              .getDefaultRoles(decodedToken.role || 'authenticated')
              .then(roles => roles[0])
          }
        });
        
        console.log('🔄 SupabaseAuth: Updated existing user', { 
          strapiUserId: strapiUser.id,
          email: userEmail 
        });
      }
      
      // Set authenticated user in context
      ctx.state.user = strapiUser;
      ctx.state.supabaseToken = decodedToken;
      
      console.log('✅ SupabaseAuth: User authenticated', {
        strapiUserId: strapiUser.id,
        supabaseUserId: supabaseUserId,
        role: strapiUser.role?.name || 'No role'
      });
      
    } catch (error) {
      console.error('❌ SupabaseAuth: Middleware error:', error);
      // Continue anyway - let Strapi handle the request
    }
    
    await next();
  };
};