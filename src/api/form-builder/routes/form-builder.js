/**
 * Form Builder Routes
 * 
 * API routes for dynamic form creation and management
 */

'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/form-builders',
      handler: 'form-builder.find',
      config: {
        policies: [],
        middlewares: [],
        description: 'Get form builders',
        tags: ['Forms', 'CMS']
      }
    },
    {
      method: 'GET',
      path: '/form-builders/:id',
      handler: 'form-builder.findOne',
      config: {
        policies: [],
        middlewares: [],
        description: 'Get form builder by ID',
        tags: ['Forms', 'CMS']
      }
    },
    {
      method: 'POST',
      path: '/form-builders',
      handler: 'form-builder.create',
      config: {
        policies: [],
        middlewares: [],
        description: 'Create new form builder',
        tags: ['Forms', 'CMS']
      }
    },
    {
      method: 'PUT',
      path: '/form-builders/:id',
      handler: 'form-builder.update',
      config: {
        policies: [],
        middlewares: [],
        description: 'Update form builder',
        tags: ['Forms', 'CMS']
      }
    },
    {
      method: 'DELETE',
      path: '/form-builders/:id',
      handler: 'form-builder.delete',
      config: {
        policies: [],
        middlewares: [],
        description: 'Delete form builder',
        tags: ['Forms', 'CMS']
      }
    },
    {
      method: 'POST',
      path: '/form-builders/:id/duplicate',
      handler: 'form-builder.duplicate',
      config: {
        policies: [],
        middlewares: [],
        description: 'Duplicate form builder',
        tags: ['Forms', 'Management']
      }
    },
    {
      method: 'GET',
      path: '/form-builders/:id/submissions',
      handler: 'form-builder.getSubmissions',
      config: {
        policies: [],
        middlewares: [],
        description: 'Get form submissions',
        tags: ['Forms', 'Submissions']
      }
    },
    {
      method: 'POST',
      path: '/form-submissions',
      handler: 'form-builder.processSubmission',
      config: {
        auth: false, // Allow public form submissions
        policies: [],
        middlewares: [],
        description: 'Process form submission',
        tags: ['Forms', 'Submissions']
      }
    }
  ]
};