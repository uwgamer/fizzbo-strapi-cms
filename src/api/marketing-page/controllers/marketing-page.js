/**
 * Marketing Page Controller
 * 
 * Handles marketing page operations with property integration
 */

'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::marketing-page.marketing-page', ({ strapi }) => ({
  /**
   * Find marketing pages with optional filtering
   */
  async find(ctx) {
    console.log('📄 MarketingPage: Finding pages...', ctx.query);
    
    try {
      // Add property integration filters if provided
      const { filters } = ctx.query;
      if (filters && filters.propertyIntegration) {
        ctx.query.filters = {
          ...ctx.query.filters,
          propertyIntegration: { $eq: filters.propertyIntegration === 'true' }
        };
      }
      
      // Add region filtering if provided
      if (filters && filters.targetRegions) {
        ctx.query.filters = {
          ...ctx.query.filters,
          targetRegions: { $contains: filters.targetRegions }
        };
      }
      
      const { data, meta } = await super.find(ctx);
      
      console.log('✅ MarketingPage: Found pages', { count: data.length });
      
      return { data, meta };
      
    } catch (error) {
      console.error('❌ MarketingPage: Find failed:', error);
      throw error;
    }
  },
  
  /**
   * Create marketing page with property integration
   */
  async create(ctx) {
    console.log('📄 MarketingPage: Creating page...', { title: ctx.request.body.data?.title });
    
    try {
      const { data } = ctx.request.body;
      
      // Validate required fields
      if (!data.title || !data.content) {
        return ctx.badRequest('Title and content are required');
      }
      
      // Set default values for property integration
      const pageData = {
        ...data,
        propertyIntegration: data.propertyIntegration || false,
        targetRegions: data.targetRegions || [],
        publishedAt: data.publishedAt || null
      };
      
      // Use content management service for enhanced creation
      const result = await strapi.service('api::content-management.content-management')
        .createMarketingPage(pageData, data.propertyFilters);
      
      console.log('✅ MarketingPage: Created page', { id: result.id, title: result.title });
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ MarketingPage: Create failed:', error);
      throw error;
    }
  },
  
  /**
   * Update marketing page
   */
  async update(ctx) {
    console.log('📄 MarketingPage: Updating page...', { id: ctx.params.id });
    
    try {
      const { data } = ctx.request.body;
      
      // Handle property integration updates
      if (data.propertyIntegration !== undefined) {
        data.propertyIntegration = Boolean(data.propertyIntegration);
      }
      
      const result = await super.update(ctx);
      
      console.log('✅ MarketingPage: Updated page', { id: ctx.params.id });
      
      return result;
      
    } catch (error) {
      console.error('❌ MarketingPage: Update failed:', error);
      throw error;
    }
  },
  
  /**
   * Publish marketing page
   */
  async publish(ctx) {
    console.log('📰 MarketingPage: Publishing page...', { id: ctx.params.id });
    
    try {
      const pageId = ctx.params.id;
      
      const result = await strapi.entityService.update('api::marketing-page.marketing-page', pageId, {
        data: {
          publishedAt: new Date()
        }
      });
      
      console.log('✅ MarketingPage: Published page', { id: pageId });
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ MarketingPage: Publish failed:', error);
      throw error;
    }
  },
  
  /**
   * Unpublish marketing page
   */
  async unpublish(ctx) {
    console.log('📰 MarketingPage: Unpublishing page...', { id: ctx.params.id });
    
    try {
      const pageId = ctx.params.id;
      
      const result = await strapi.entityService.update('api::marketing-page.marketing-page', pageId, {
        data: {
          publishedAt: null
        }
      });
      
      console.log('✅ MarketingPage: Unpublished page', { id: pageId });
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ MarketingPage: Unpublish failed:', error);
      throw error;
    }
  }
}));