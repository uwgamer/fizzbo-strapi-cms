/**
 * Authentication Controller for Supabase Integration
 * 
 * Handles authentication between Supabase and Strapi systems
 * Provides JWT token verification and user synchronization
 */

'use strict';

const jwt = require('jsonwebtoken');

module.exports = {
  /**
   * Verify Supabase JWT token and return Strapi JWT
   */
  async verifySupabaseToken(ctx) {
    console.log('🔐 Auth: Verifying Supabase token...');
    
    try {
      const { token, userProfile } = ctx.request.body;
      
      if (!token) {
        return ctx.badRequest('Supabase token is required');
      }
      
      // Validate Supabase JWT token
      const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
      
      if (!supabaseJwtSecret) {
        console.error('❌ SUPABASE_JWT_SECRET not configured');
        return ctx.internalServerError('JWT secret not configured');
      }
      
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, supabaseJwtSecret);
      } catch (jwtError) {
        console.error('❌ Invalid JWT token:', jwtError.message);
        return ctx.unauthorized('Invalid Supabase token');
      }
      
      const supabaseUserId = decodedToken.sub;
      const userEmail = decodedToken.email;
      
      if (!supabaseUserId || !userEmail) {
        return ctx.badRequest('Invalid token data');
      }
      
      console.log('✅ Supabase token valid', { userId: supabaseUserId, email: userEmail });
      
      // Get or create Strapi user
      let strapiUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: userEmail },
        populate: ['role']
      });
      
      if (!strapiUser) {
        console.log('👤 Creating new Strapi user for:', userEmail);
        
        // Create new user using provided profile data or token data
        const userData = {
          username: userProfile?.username || userEmail.split('@')[0],
          email: userEmail,
          provider: 'supabase',
          confirmed: true,
          blocked: false,
          
          // Profile data
          firstName: userProfile?.firstName || decodedToken.user_metadata?.first_name,
          lastName: userProfile?.lastName || decodedToken.user_metadata?.last_name,
          fullName: userProfile?.fullName || decodedToken.user_metadata?.full_name,
          phone: userProfile?.phone || decodedToken.phone,
          verificationLevel: userProfile?.verificationLevel || 'none',
          supabaseId: supabaseUserId,
          
          // Get authenticated role
          role: await this.getAuthenticatedRole()
        };
        
        strapiUser = await strapi.query('plugin::users-permissions.user').create({
          data: userData,
          populate: ['role']
        });
        
        console.log('✅ Created Strapi user:', { id: strapiUser.id, email: userEmail });
        
        // Sync to RBAC table
        try {
          await strapi.service('api::fizzbo-integration.fizzbo-integration').syncUserFromSupabase(
            supabaseUserId,
            userData
          );
        } catch (syncError) {
          console.warn('⚠️ RBAC sync failed:', syncError.message);
        }
      } else {
        // Update existing user with latest info
        const updateData = {
          updatedAt: new Date(),
          firstName: userProfile?.firstName || strapiUser.firstName,
          lastName: userProfile?.lastName || strapiUser.lastName,
          fullName: userProfile?.fullName || strapiUser.fullName,
          phone: userProfile?.phone || strapiUser.phone,
          verificationLevel: userProfile?.verificationLevel || strapiUser.verificationLevel
        };
        
        await strapi.query('plugin::users-permissions.user').update({
          where: { id: strapiUser.id },
          data: updateData
        });
        
        console.log('🔄 Updated existing user:', { id: strapiUser.id, email: userEmail });
      }
      
      // Generate Strapi JWT token
      const strapiJwt = strapi.plugins['users-permissions'].services.jwt.issue({
        id: strapiUser.id,
        email: strapiUser.email
      });
      
      // Return user data and JWT
      ctx.send({
        jwt: strapiJwt,
        user: {
          id: strapiUser.id,
          username: strapiUser.username,
          email: strapiUser.email,
          firstName: strapiUser.firstName,
          lastName: strapiUser.lastName,
          fullName: strapiUser.fullName,
          phone: strapiUser.phone,
          verificationLevel: strapiUser.verificationLevel,
          role: strapiUser.role,
          supabaseId: strapiUser.supabaseId,
          provider: strapiUser.provider,
          confirmed: strapiUser.confirmed,
          blocked: strapiUser.blocked,
          createdAt: strapiUser.createdAt,
          updatedAt: strapiUser.updatedAt
        }
      });
      
    } catch (error) {
      console.error('❌ Supabase token verification failed:', error);
      ctx.internalServerError('Authentication failed');
    }
  },
  
  /**
   * Sync user data from Supabase to Strapi
   */
  async syncUserFromSupabase(ctx) {
    console.log('🔄 Auth: Syncing user from Supabase...');
    
    try {
      const { supabaseUserId, userData } = ctx.request.body;
      
      if (!supabaseUserId || !userData) {
        return ctx.badRequest('Supabase user ID and user data are required');
      }
      
      // Use Fizzbo integration service to sync user
      const result = await strapi.service('api::fizzbo-integration.fizzbo-integration').syncUserFromSupabase(
        supabaseUserId,
        userData
      );
      
      ctx.send({
        success: true,
        user: result,
        message: 'User synchronized successfully'
      });
      
    } catch (error) {
      console.error('❌ User sync failed:', error);
      ctx.internalServerError('User synchronization failed');
    }
  },
  
  /**
   * Handle OAuth callback from Supabase
   */
  async handleOAuthCallback(ctx) {
    console.log('🔗 Auth: Handling OAuth callback...');
    
    try {
      const { code, error, state } = ctx.query;
      
      if (error) {
        console.error('❌ OAuth error:', error);
        return ctx.redirect(`${process.env.FIZZBO_FRONTEND_URL}?auth_error=${encodeURIComponent(error)}`);
      }
      
      if (!code) {
        return ctx.badRequest('Authorization code not provided');
      }
      
      // Exchange code for access token using Supabase
      const supabaseUrl = process.env.SUPABASE_URL;
      const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          code,
          redirect_uri: `${strapi.config.server.url}/api/auth/supabase/callback`
        })
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      // Redirect back to frontend with token
      const redirectUrl = new URL(process.env.FIZZBO_FRONTEND_URL || 'http://localhost:8081');
      redirectUrl.searchParams.set('supabase_access_token', tokenData.access_token);
      if (state) redirectUrl.searchParams.set('state', state);
      
      ctx.redirect(redirectUrl.toString());
      
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      ctx.redirect(`${process.env.FIZZBO_FRONTEND_URL}?auth_error=${encodeURIComponent('OAuth failed')}`);
    }
  },
  
  /**
   * Helper method to get the authenticated role
   */
  async getAuthenticatedRole() {
    try {
      const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { name: 'Authenticated' }
      });
      
      return authenticatedRole?.id || null;
    } catch (error) {
      console.error('❌ Failed to get authenticated role:', error);
      return null;
    }
  }
};