/**
 * Marketing Page Routes
 * 
 * API routes for marketing page management with property integration
 */

'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/marketing-pages',
      handler: 'marketing-page.find',
      config: {
        policies: [],
        middlewares: [],
        description: 'Get marketing pages',
        tags: ['Marketing', 'CMS']
      }
    },
    {
      method: 'GET',
      path: '/marketing-pages/:id',
      handler: 'marketing-page.findOne',
      config: {
        policies: [],
        middlewares: [],
        description: 'Get marketing page by ID',
        tags: ['Marketing', 'CMS']
      }
    },
    {
      method: 'POST',
      path: '/marketing-pages',
      handler: 'marketing-page.create',
      config: {
        policies: [],
        middlewares: [],
        description: 'Create new marketing page',
        tags: ['Marketing', 'CMS']
      }
    },
    {
      method: 'PUT',
      path: '/marketing-pages/:id',
      handler: 'marketing-page.update',
      config: {
        policies: [],
        middlewares: [],
        description: 'Update marketing page',
        tags: ['Marketing', 'CMS']
      }
    },
    {
      method: 'DELETE',
      path: '/marketing-pages/:id',
      handler: 'marketing-page.delete',
      config: {
        policies: [],
        middlewares: [],
        description: 'Delete marketing page',
        tags: ['Marketing', 'CMS']
      }
    },
    {
      method: 'POST',
      path: '/marketing-pages/:id/publish',
      handler: 'marketing-page.publish',
      config: {
        policies: [],
        middlewares: [],
        description: 'Publish marketing page',
        tags: ['Marketing', 'Publishing']
      }
    },
    {
      method: 'POST',
      path: '/marketing-pages/:id/unpublish',
      handler: 'marketing-page.unpublish',
      config: {
        policies: [],
        middlewares: [],
        description: 'Unpublish marketing page',
        tags: ['Marketing', 'Publishing']
      }
    }
  ]
};