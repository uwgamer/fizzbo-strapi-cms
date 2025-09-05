/**
 * Form Builder Controller
 * 
 * Handles dynamic form creation and submission processing
 */

'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::form-builder.form-builder', ({ strapi }) => ({
  /**
   * Find form builders with optional filtering
   */
  async find(ctx) {
    console.log('📋 FormBuilder: Finding forms...', ctx.query);
    
    try {
      const { filters } = ctx.query;
      
      // Add active filter if provided
      if (filters && filters.isActive !== undefined) {
        ctx.query.filters = {
          ...ctx.query.filters,
          isActive: { $eq: filters.isActive === 'true' }
        };
      }
      
      // Add FollowUpBoss integration filter
      if (filters && filters.followUpBossIntegration !== undefined) {
        ctx.query.filters = {
          ...ctx.query.filters,
          followUpBossIntegration: { $eq: filters.followUpBossIntegration === 'true' }
        };
      }
      
      const { data, meta } = await super.find(ctx);
      
      console.log('✅ FormBuilder: Found forms', { count: data.length });
      
      return { data, meta };
      
    } catch (error) {
      console.error('❌ FormBuilder: Find failed:', error);
      throw error;
    }
  },
  
  /**
   * Create form builder
   */
  async create(ctx) {
    console.log('📋 FormBuilder: Creating form...', { name: ctx.request.body.data?.name });
    
    try {
      const { data } = ctx.request.body;
      
      // Validate required fields
      if (!data.name || !data.fields) {
        return ctx.badRequest('Name and fields are required');
      }
      
      // Validate fields structure
      if (!Array.isArray(data.fields)) {
        return ctx.badRequest('Fields must be an array');
      }
      
      // Set default values
      const formData = {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
        followUpBossIntegration: data.followUpBossIntegration || false,
        settings: data.settings || {}
      };
      
      // Use content management service for enhanced creation
      const result = await strapi.service('api::content-management.content-management')
        .createForm(formData);
      
      console.log('✅ FormBuilder: Created form', { id: result.id, name: result.name });
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ FormBuilder: Create failed:', error);
      throw error;
    }
  },
  
  /**
   * Update form builder
   */
  async update(ctx) {
    console.log('📋 FormBuilder: Updating form...', { id: ctx.params.id });
    
    try {
      const { data } = ctx.request.body;
      
      // Validate fields if provided
      if (data.fields && !Array.isArray(data.fields)) {
        return ctx.badRequest('Fields must be an array');
      }
      
      const result = await super.update(ctx);
      
      console.log('✅ FormBuilder: Updated form', { id: ctx.params.id });
      
      return result;
      
    } catch (error) {
      console.error('❌ FormBuilder: Update failed:', error);
      throw error;
    }
  },
  
  /**
   * Duplicate form builder
   */
  async duplicate(ctx) {
    console.log('📋 FormBuilder: Duplicating form...', { id: ctx.params.id });
    
    try {
      const formId = ctx.params.id;
      
      // Get original form
      const originalForm = await strapi.entityService.findOne('api::form-builder.form-builder', formId);
      
      if (!originalForm) {
        return ctx.notFound('Form not found');
      }
      
      // Create duplicate with modified name
      const duplicateData = {
        name: `${originalForm.name} (Copy)`,
        description: originalForm.description,
        fields: originalForm.fields,
        settings: originalForm.settings,
        isActive: false, // Start inactive by default
        followUpBossIntegration: originalForm.followUpBossIntegration
      };
      
      const result = await strapi.entityService.create('api::form-builder.form-builder', {
        data: duplicateData
      });
      
      console.log('✅ FormBuilder: Duplicated form', { originalId: formId, duplicateId: result.id });
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ FormBuilder: Duplicate failed:', error);
      throw error;
    }
  },
  
  /**
   * Get form submissions
   */
  async getSubmissions(ctx) {
    console.log('📬 FormBuilder: Getting submissions...', { formId: ctx.params.id });
    
    try {
      const formId = ctx.params.id;
      const { page = 1, pageSize = 25 } = ctx.query;
      
      // Query submissions from database using raw SQL for performance
      const submissions = await strapi.db.connection.raw(`
        SELECT * FROM form_submissions 
        WHERE form_id = ? 
        ORDER BY submitted_at DESC 
        LIMIT ? OFFSET ?
      `, [formId, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]);
      
      // Get total count
      const countResult = await strapi.db.connection.raw(`
        SELECT COUNT(*) as total FROM form_submissions WHERE form_id = ?
      `, [formId]);
      
      const total = countResult.rows?.[0]?.total || 0;
      
      console.log('✅ FormBuilder: Retrieved submissions', { 
        formId, 
        count: submissions.rows?.length || 0,
        total 
      });
      
      return {
        data: submissions.rows || [],
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total: parseInt(total),
            pageCount: Math.ceil(total / pageSize)
          }
        }
      };
      
    } catch (error) {
      console.error('❌ FormBuilder: Get submissions failed:', error);
      throw error;
    }
  },
  
  /**
   * Process form submission
   */
  async processSubmission(ctx) {
    console.log('📬 FormBuilder: Processing submission...', { formId: ctx.request.body.formId });
    
    try {
      const { formId, data } = ctx.request.body;
      
      if (!formId || !data) {
        return ctx.badRequest('Form ID and submission data are required');
      }
      
      // Use content management service for submission processing
      const result = await strapi.service('api::content-management.content-management')
        .processFormSubmission(formId, data);
      
      if (result.success) {
        console.log('✅ FormBuilder: Submission processed', { 
          formId, 
          submissionId: result.submissionId,
          integrations: result.integrations?.length || 0 
        });
        
        return {
          success: true,
          submissionId: result.submissionId,
          integrations: result.integrations
        };
      } else {
        console.error('❌ FormBuilder: Submission processing failed', result.errors);
        
        return ctx.badRequest({
          success: false,
          errors: result.errors
        });
      }
      
    } catch (error) {
      console.error('❌ FormBuilder: Process submission failed:', error);
      throw error;
    }
  }
}));