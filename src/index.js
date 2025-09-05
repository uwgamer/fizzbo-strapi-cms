/**
 * Fizzbo Strapi CMS Application Entry Point
 * 
 * Minimal configuration for Strapi Cloud deployment
 */

'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }) {
    console.log('🎨 Fizzbo Strapi CMS: Registering application...');
    console.log('✅ Fizzbo Strapi CMS: Application registered successfully');
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }) {
    console.log('🚀 Fizzbo Strapi CMS: Bootstrapping application...');
    
    try {
      // Test database connection
      await strapi.db.connection.raw('SELECT 1');
      console.log('✅ Database connection successful');
      
      console.log('✅ Fizzbo Strapi CMS: Application bootstrapped successfully');
      console.log('🌐 Admin panel available at: /admin');
      console.log('📊 Health check available at: /_health');
      
    } catch (error) {
      console.error('❌ Fizzbo Strapi CMS: Bootstrap failed:', error);
      console.warn('⚠️ Continuing with minimal functionality...');
    }
  },
};