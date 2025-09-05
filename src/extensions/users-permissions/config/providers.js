/**
 * Supabase Authentication Provider for Strapi
 * 
 * Custom authentication provider that integrates with Supabase Auth
 * Enables seamless authentication between Fizzbo platform and Strapi CMS
 */

'use strict';

module.exports = {
  supabase: {
    enabled: true,
    icon: 'supabase',
    key: process.env.SUPABASE_CLIENT_ID || 'supabase',
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
    callback: '/auth/supabase/callback',
    scope: ['read', 'write'],
    
    /**
     * Custom authorization URL for Supabase OAuth
     */
    getAuthorizationUrl(ctx) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const redirectUri = `${strapi.config.server.url}/auth/supabase/callback`;
      
      const authUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
      authUrl.searchParams.set('provider', 'supabase');
      authUrl.searchParams.set('redirect_to', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      
      return authUrl.toString();
    },

    /**
     * Get user info from Supabase using service role key
     */
    async getProfile(accessToken, ctx) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        // Get user from Supabase auth admin API
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user: ${userResponse.statusText}`);
        }
        
        const userData = await userResponse.json();
        const user = userData.users?.find(u => u.access_token === accessToken) || userData;
        
        if (!user) {
          throw new Error('User not found');
        }
        
        // Get user profile from user_profiles table
        const profileResponse = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            }
          }
        );
        
        let profileData = {};
        if (profileResponse.ok) {
          const profiles = await profileResponse.json();
          profileData = profiles[0] || {};
        }
        
        // Return standardized user profile
        return {
          id: user.id,
          email: user.email,
          username: profileData.username || user.email.split('@')[0],
          provider: 'supabase',
          confirmed: user.email_confirmed_at ? true : false,
          blocked: false,
          
          // Additional profile data
          firstName: profileData.first_name || user.user_metadata?.first_name,
          lastName: profileData.last_name || user.user_metadata?.last_name,
          fullName: profileData.full_name || user.user_metadata?.full_name,
          role: profileData.role || 'authenticated',
          verificationLevel: profileData.verification_level || 'none',
          phone: profileData.phone || user.phone,
          avatarUrl: profileData.avatar_url || user.user_metadata?.avatar_url,
          
          // Supabase specific data
          supabaseId: user.id,
          lastSignInAt: user.last_sign_in_at,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        };
        
      } catch (error) {
        console.error('❌ Supabase provider error:', error);
        throw new Error(`Supabase authentication failed: ${error.message}`);
      }
    },

    /**
     * Handle callback from Supabase OAuth
     */
    async callback(ctx) {
      try {
        const { code, error } = ctx.query;
        
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }
        
        if (!code) {
          throw new Error('Authorization code not provided');
        }
        
        // Exchange code for access token
        const supabaseUrl = process.env.SUPABASE_URL;
        const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({
            code,
            redirect_uri: `${strapi.config.server.url}/auth/supabase/callback`
          })
        });
        
        if (!tokenResponse.ok) {
          throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
        }
        
        const tokenData = await tokenResponse.json();
        
        return {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };
        
      } catch (error) {
        console.error('❌ Supabase callback error:', error);
        throw error;
      }
    }
  }
};