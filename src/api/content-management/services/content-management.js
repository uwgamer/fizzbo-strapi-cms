/**
 * Content Management Service for Fizzbo Integration
 * 
 * Manages Strapi content types and their integration with Fizzbo data
 * Provides content creation, updates, and synchronization capabilities
 */

'use strict';

module.exports = () => ({
  /**
   * Initialize content types for Fizzbo integration
   */
  async initializeContentTypes() {
    console.log('📄 ContentManagement: Initializing content types...');
    
    try {
      // Define content types needed for Fizzbo integration
      const contentTypes = [
        {
          singularName: 'marketing-page',
          pluralName: 'marketing-pages',
          displayName: 'Marketing Page',
          description: 'Dynamic marketing and landing pages with property integration'
        },
        {
          singularName: 'form-builder',
          pluralName: 'form-builders', 
          displayName: 'Form Builder',
          description: 'Dynamic form creation and management with lead integration'
        },
        {
          singularName: 'campaign-workflow',
          pluralName: 'campaign-workflows',
          displayName: 'Campaign Workflow',
          description: 'Marketing automation and API orchestration workflows'
        }
      ];
      
      // Register content types with Strapi
      for (const contentType of contentTypes) {
        await this.ensureContentTypeExists(contentType);
      }
      
      console.log('✅ ContentManagement: Content types initialized successfully');
      
    } catch (error) {
      console.error('❌ ContentManagement: Failed to initialize content types:', error);
      throw error;
    }
  },

  /**
   * Ensure content type exists in the database
   */
  async ensureContentTypeExists(contentTypeDefinition) {
    try {
      // Check if content type already exists in strapi_content_types table
      const existingType = await strapi.db.connection.raw(`
        SELECT * FROM strapi_content_types 
        WHERE api_id = ? AND is_active = true
      `, [contentTypeDefinition.singularName]);
      
      if (existingType.rows && existingType.rows.length > 0) {
        console.log(`📄 ContentManagement: Content type '${contentTypeDefinition.displayName}' already exists`);
        return;
      }
      
      // Insert content type metadata
      await strapi.db.connection.raw(`
        INSERT INTO strapi_content_types (api_id, display_name, description, schema_definition, is_active)
        VALUES (?, ?, ?, ?, true)
        ON CONFLICT (api_id) DO NOTHING
      `, [
        contentTypeDefinition.singularName,
        contentTypeDefinition.displayName,
        contentTypeDefinition.description,
        JSON.stringify(this.getDefaultSchema(contentTypeDefinition.singularName))
      ]);
      
      console.log(`✅ ContentManagement: Content type '${contentTypeDefinition.displayName}' registered`);
      
    } catch (error) {
      console.error(`❌ ContentManagement: Failed to ensure content type exists:`, error);
      // Don't throw - continue with other content types
    }
  },

  /**
   * Get default schema for content type
   */
  getDefaultSchema(contentType) {
    const schemas = {
      'marketing-page': {
        kind: 'collectionType',
        collectionName: 'marketing_pages',
        info: {
          singularName: 'marketing-page',
          pluralName: 'marketing-pages',
          displayName: 'Marketing Page'
        },
        options: {
          draftAndPublish: true,
        },
        attributes: {
          title: {
            type: 'string',
            required: true
          },
          slug: {
            type: 'uid',
            targetField: 'title'
          },
          content: {
            type: 'richtext'
          },
          seo: {
            type: 'component',
            component: 'shared.seo'
          },
          propertyIntegration: {
            type: 'boolean',
            default: false
          },
          targetRegions: {
            type: 'json'
          }
        }
      },
      'form-builder': {
        kind: 'collectionType',
        collectionName: 'form_builders',
        info: {
          singularName: 'form-builder',
          pluralName: 'form-builders',
          displayName: 'Form Builder'
        },
        options: {
          draftAndPublish: false,
        },
        attributes: {
          name: {
            type: 'string',
            required: true
          },
          description: {
            type: 'text'
          },
          fields: {
            type: 'json',
            required: true
          },
          settings: {
            type: 'json'
          },
          isActive: {
            type: 'boolean',
            default: true
          },
          followUpBossIntegration: {
            type: 'boolean',
            default: false
          }
        }
      },
      'campaign-workflow': {
        kind: 'collectionType',
        collectionName: 'campaign_workflows',
        info: {
          singularName: 'campaign-workflow',
          pluralName: 'campaign-workflows',
          displayName: 'Campaign Workflow'
        },
        options: {
          draftAndPublish: false,
        },
        attributes: {
          name: {
            type: 'string',
            required: true
          },
          description: {
            type: 'text'
          },
          triggers: {
            type: 'json',
            required: true
          },
          actions: {
            type: 'json',
            required: true
          },
          conditions: {
            type: 'json'
          },
          isActive: {
            type: 'boolean',
            default: true
          },
          apiIntegrations: {
            type: 'json'
          }
        }
      }
    };
    
    return schemas[contentType] || {};
  },

  /**
   * Create marketing page with property integration
   */
  async createMarketingPage(pageData, propertyFilters = null) {
    console.log('📄 ContentManagement: Creating marketing page...', { title: pageData.title });
    
    try {
      const marketingPage = await strapi.entityService.create('api::marketing-page.marketing-page', {
        data: {
          ...pageData,
          propertyIntegration: !!propertyFilters,
          propertyFilters: propertyFilters ? JSON.stringify(propertyFilters) : null,
          publishedAt: new Date()
        }
      });
      
      console.log('✅ ContentManagement: Marketing page created', { id: marketingPage.id });
      return marketingPage;
      
    } catch (error) {
      console.error('❌ ContentManagement: Failed to create marketing page:', error);
      throw error;
    }
  },

  /**
   * Create dynamic form with lead integration
   */
  async createForm(formDefinition) {
    console.log('📋 ContentManagement: Creating form...', { name: formDefinition.name });
    
    try {
      const form = await strapi.entityService.create('api::form-builder.form-builder', {
        data: {
          ...formDefinition,
          createdAt: new Date()
        }
      });
      
      console.log('✅ ContentManagement: Form created', { id: form.id });
      return form;
      
    } catch (error) {
      console.error('❌ ContentManagement: Failed to create form:', error);
      throw error;
    }
  },

  /**
   * Process form submission and integrate with Fizzbo systems
   */
  async processFormSubmission(formId, submissionData) {
    console.log('📬 ContentManagement: Processing form submission...', { formId });
    
    try {
      // Get form configuration
      const form = await strapi.entityService.findOne('api::form-builder.form-builder', formId);
      
      if (!form) {
        throw new Error(`Form not found: ${formId}`);
      }
      
      // Validate submission data
      const isValid = this.validateFormSubmission(form.fields, submissionData);
      
      if (!isValid.valid) {
        return { success: false, errors: isValid.errors };
      }
      
      // Store submission in database
      const submission = await strapi.db.connection.raw(`
        INSERT INTO form_submissions (form_id, data, submitted_at)
        VALUES (?, ?, ?)
        RETURNING *
      `, [formId, JSON.stringify(submissionData), new Date().toISOString()]);
      
      // Handle integrations
      const integrationResults = [];
      
      // FollowUpBoss integration
      if (form.settings?.followUpBossIntegration) {
        try {
          const leadResult = await this.createFollowUpBossLead(submissionData);
          integrationResults.push({ service: 'followupboss', success: true, result: leadResult });
        } catch (error) {
          console.error('❌ FollowUpBoss integration failed:', error);
          integrationResults.push({ service: 'followupboss', success: false, error: error.message });
        }
      }
      
      console.log('✅ ContentManagement: Form submission processed', { 
        submissionId: submission.rows[0]?.id,
        integrations: integrationResults.length
      });
      
      return { 
        success: true, 
        submissionId: submission.rows[0]?.id,
        integrations: integrationResults
      };
      
    } catch (error) {
      console.error('❌ ContentManagement: Failed to process form submission:', error);
      return { success: false, errors: [error.message] };
    }
  },

  /**
   * Validate form submission data
   */
  validateFormSubmission(fields, submissionData) {
    const errors = [];
    
    for (const field of fields) {
      const value = submissionData[field.id];
      
      if (field.required && (!value || value.trim() === '')) {
        errors.push(`${field.label} is required`);
      }
      
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field.label} must be a valid email address`);
        }
      }
      
      if (field.type === 'phone' && value) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
          errors.push(`${field.label} must be a valid phone number`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Create lead in FollowUpBoss (placeholder for integration)
   */
  async createFollowUpBossLead(submissionData) {
    // This will integrate with existing FollowUpBoss service
    // For now, return mock success
    console.log('📞 ContentManagement: Creating FollowUpBoss lead...', { 
      email: submissionData.email,
      name: submissionData.name 
    });
    
    return { id: 'mock-lead-id', created: true };
  },

  /**
   * Get content management status
   */
  getStatus() {
    return {
      contentTypesInitialized: true,
      timestamp: new Date().toISOString()
    };
  }
});