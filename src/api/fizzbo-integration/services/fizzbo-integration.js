/**
 * Fizzbo Integration Service
 * 
 * Handles integration with Fizzbo National Property Data Platform
 * Provides user synchronization, permission management, and data sharing
 */

'use strict';

module.exports = () => ({
  /**
   * Register Fizzbo integration services
   */
  register() {
    console.log('🔌 FizzboIntegration: Registering integration services...');
    
    // Service registration logic
    this.isRegistered = true;
  },

  /**
   * Bootstrap Fizzbo integration
   */
  async bootstrap() {
    console.log('🔄 FizzboIntegration: Bootstrapping integration...');
    
    try {
      // Test Supabase connection
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ FizzboIntegration: Supabase credentials not configured, skipping integration');
        return;
      }
      
      // Initialize Supabase client for server-side operations
      const { createClient } = require('@supabase/supabase-js');
      this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Test connection
      const { data, error } = await this.supabaseClient
        .from('strapi_user_role_sync')
        .select('id')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ FizzboIntegration: RBAC sync tables not found, integration limited');
      } else {
        console.log('✅ FizzboIntegration: Supabase connection successful');
      }
      
      this.isBootstrapped = true;
      
    } catch (error) {
      console.error('❌ FizzboIntegration: Bootstrap failed:', error);
      throw error;
    }
  },

  /**
   * Sync user from Supabase to Strapi
   */
  async syncUserFromSupabase(supabaseUserId, userData) {
    console.log('🔄 FizzboIntegration: Syncing user from Supabase', { supabaseUserId });
    
    try {
      if (!this.supabaseClient) {
        throw new Error('Supabase client not initialized');
      }
      
      // Check if user already exists in Strapi
      let strapiUser = await strapi.query('admin::user').findOne({
        where: { email: userData.email }
      });
      
      if (!strapiUser) {
        // Create new Strapi admin user
        strapiUser = await strapi.query('admin::user').create({
          data: {
            firstname: userData.firstname || userData.full_name?.split(' ')[0] || 'User',
            lastname: userData.lastname || userData.full_name?.split(' ').slice(1).join(' ') || '',
            username: userData.email,
            email: userData.email,
            password: 'temp-password-' + Math.random().toString(36),
            isActive: true,
            roles: await this.getDefaultRoles(userData.role || 'authenticated'),
            preferedLanguage: 'en'
          }
        });
        
        console.log('✅ FizzboIntegration: Created new Strapi user', { 
          strapiUserId: strapiUser.id,
          email: userData.email 
        });
      } else {
        // Update existing user
        strapiUser = await strapi.query('admin::user').update({
          where: { id: strapiUser.id },
          data: {
            firstname: userData.firstname || userData.full_name?.split(' ')[0] || strapiUser.firstname,
            lastname: userData.lastname || userData.full_name?.split(' ').slice(1).join(' ') || strapiUser.lastname,
            isActive: true,
            roles: await this.getDefaultRoles(userData.role || 'authenticated')
          }
        });
        
        console.log('✅ FizzboIntegration: Updated existing Strapi user', { 
          strapiUserId: strapiUser.id,
          email: userData.email 
        });
      }
      
      // Update sync record in Supabase
      const { error } = await this.supabaseClient
        .from('strapi_user_role_sync')
        .upsert({
          supabase_user_id: supabaseUserId,
          strapi_user_id: strapiUser.id,
          email: userData.email,
          role: userData.role || 'authenticated',
          permissions: userData.permissions || [],
          last_sync_at: new Date().toISOString(),
          is_active: true
        });
      
      if (error) {
        console.warn('⚠️ FizzboIntegration: Failed to update sync record:', error);
      }
      
      return strapiUser;
      
    } catch (error) {
      console.error('❌ FizzboIntegration: User sync failed:', error);
      throw error;
    }
  },

  /**
   * Get default roles for user based on Fizzbo role
   */
  async getDefaultRoles(fizzboRole) {
    const roleMapping = {
      'platform_admin': 'Super Admin',
      'marketing_manager': 'Editor',
      'real_estate_agent': 'Editor',
      'property_owner': 'Author',
      'lead_prospect': 'Author'
    };
    
    const roleName = roleMapping[fizzboRole] || 'Author';
    
    try {
      const role = await strapi.query('admin::role').findOne({
        where: { name: roleName }
      });
      
      return role ? [role.id] : [];
    } catch (error) {
      console.error('❌ FizzboIntegration: Failed to get role:', error);
      return [];
    }
  },

  /**
   * Validate user permissions for Fizzbo integration
   */
  async validateUserPermissions(userId, resource, action) {
    console.log('🔐 FizzboIntegration: Validating permissions', { userId, resource, action });
    
    try {
      if (!this.supabaseClient) {
        console.warn('⚠️ FizzboIntegration: Supabase client not available, allowing access');
        return true;
      }
      
      // Get user role from sync table
      const { data: syncData, error } = await this.supabaseClient
        .from('strapi_user_role_sync')
        .select('role, permissions')
        .eq('strapi_user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (error || !syncData) {
        console.warn('⚠️ FizzboIntegration: User sync data not found, defaulting to basic access');
        return action === 'read'; // Allow read access by default
      }
      
      // Check permissions
      const requiredPermission = `${resource}.${action}`;
      const hasPermission = syncData.permissions?.includes('*') || 
                           syncData.permissions?.includes(requiredPermission) ||
                           syncData.permissions?.includes(`${resource}.*`);
      
      console.log('🔐 FizzboIntegration: Permission check result', { 
        userId, 
        resource, 
        action, 
        role: syncData.role, 
        hasPermission 
      });
      
      return hasPermission;
      
    } catch (error) {
      console.error('❌ FizzboIntegration: Permission validation failed:', error);
      // Fail open for development/debugging
      return true;
    }
  },

  /**
   * Get integration status
   */
  getStatus() {
    return {
      registered: this.isRegistered || false,
      bootstrapped: this.isBootstrapped || false,
      supabaseConnected: !!this.supabaseClient,
      timestamp: new Date().toISOString()
    };
  }
});