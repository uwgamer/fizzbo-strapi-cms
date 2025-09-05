/**
 * Campaign Workflow Routes
 * 
 * API routes for marketing automation and workflow management
 */

'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/campaign-workflows',
      handler: 'campaign-workflow.find',
      config: {
        policies: [],
        middlewares: [],
        description: 'Get campaign workflows',
        tags: ['Workflows', 'Automation']
      }
    },
    {
      method: 'GET',
      path: '/campaign-workflows/:id',
      handler: 'campaign-workflow.findOne',
      config: {
        policies: [],
        middlewares: [],
        description: 'Get campaign workflow by ID',
        tags: ['Workflows', 'Automation']
      }
    },
    {
      method: 'POST',
      path: '/campaign-workflows',
      handler: 'campaign-workflow.create',
      config: {
        policies: [],
        middlewares: [],
        description: 'Create new campaign workflow',
        tags: ['Workflows', 'Automation']
      }
    },
    {
      method: 'PUT',
      path: '/campaign-workflows/:id',
      handler: 'campaign-workflow.update',
      config: {
        policies: [],
        middlewares: [],
        description: 'Update campaign workflow',
        tags: ['Workflows', 'Automation']
      }
    },
    {
      method: 'DELETE',
      path: '/campaign-workflows/:id',
      handler: 'campaign-workflow.delete',
      config: {
        policies: [],
        middlewares: [],
        description: 'Delete campaign workflow',
        tags: ['Workflows', 'Automation']
      }
    },
    {
      method: 'POST',
      path: '/campaign-workflows/:id/execute',
      handler: 'campaign-workflow.execute',
      config: {
        policies: [],
        middlewares: [],
        description: 'Execute campaign workflow',
        tags: ['Workflows', 'Execution']
      }
    },
    {
      method: 'POST',
      path: '/campaign-workflows/:id/activate',
      handler: 'campaign-workflow.activate',
      config: {
        policies: [],
        middlewares: [],
        description: 'Activate campaign workflow',
        tags: ['Workflows', 'Management']
      }
    },
    {
      method: 'POST',
      path: '/campaign-workflows/:id/deactivate',
      handler: 'campaign-workflow.deactivate',
      config: {
        policies: [],
        middlewares: [],
        description: 'Deactivate campaign workflow',
        tags: ['Workflows', 'Management']
      }
    },
    {
      method: 'GET',
      path: '/campaign-workflows/:id/executions',
      handler: 'campaign-workflow.getExecutions',
      config: {
        policies: [],
        middlewares: [],
        description: 'Get workflow execution history',
        tags: ['Workflows', 'Analytics']
      }
    }
  ]
};