/**
 * Campaign Workflow Controller
 * 
 * Handles marketing automation workflows and API orchestration
 */

'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::campaign-workflow.campaign-workflow', ({ strapi }) => ({
  /**
   * Find campaign workflows with optional filtering
   */
  async find(ctx) {
    console.log('⚙️ CampaignWorkflow: Finding workflows...', ctx.query);
    
    try {
      const { filters } = ctx.query;
      
      // Add active filter if provided
      if (filters && filters.isActive !== undefined) {
        ctx.query.filters = {
          ...ctx.query.filters,
          isActive: { $eq: filters.isActive === 'true' }
        };
      }
      
      const { data, meta } = await super.find(ctx);
      
      console.log('✅ CampaignWorkflow: Found workflows', { count: data.length });
      
      return { data, meta };
      
    } catch (error) {
      console.error('❌ CampaignWorkflow: Find failed:', error);
      throw error;
    }
  },
  
  /**
   * Create campaign workflow
   */
  async create(ctx) {
    console.log('⚙️ CampaignWorkflow: Creating workflow...', { name: ctx.request.body.data?.name });
    
    try {
      const { data } = ctx.request.body;
      
      // Validate required fields
      if (!data.name || !data.triggers || !data.actions) {
        return ctx.badRequest('Name, triggers, and actions are required');
      }
      
      // Validate triggers and actions are arrays
      if (!Array.isArray(data.triggers) || !Array.isArray(data.actions)) {
        return ctx.badRequest('Triggers and actions must be arrays');
      }
      
      // Set default values
      const workflowData = {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
        conditions: data.conditions || [],
        apiIntegrations: data.apiIntegrations || {}
      };
      
      const result = await super.create({ ...ctx, request: { ...ctx.request, body: { data: workflowData } } });
      
      console.log('✅ CampaignWorkflow: Created workflow', { id: result.data.id, name: result.data.name });
      
      return result;
      
    } catch (error) {
      console.error('❌ CampaignWorkflow: Create failed:', error);
      throw error;
    }
  },
  
  /**
   * Update campaign workflow
   */
  async update(ctx) {
    console.log('⚙️ CampaignWorkflow: Updating workflow...', { id: ctx.params.id });
    
    try {
      const { data } = ctx.request.body;
      
      // Validate arrays if provided
      if (data.triggers && !Array.isArray(data.triggers)) {
        return ctx.badRequest('Triggers must be an array');
      }
      
      if (data.actions && !Array.isArray(data.actions)) {
        return ctx.badRequest('Actions must be an array');
      }
      
      if (data.conditions && !Array.isArray(data.conditions)) {
        return ctx.badRequest('Conditions must be an array');
      }
      
      const result = await super.update(ctx);
      
      console.log('✅ CampaignWorkflow: Updated workflow', { id: ctx.params.id });
      
      return result;
      
    } catch (error) {
      console.error('❌ CampaignWorkflow: Update failed:', error);
      throw error;
    }
  },
  
  /**
   * Execute campaign workflow
   */
  async execute(ctx) {
    console.log('🚀 CampaignWorkflow: Executing workflow...', { id: ctx.params.id });
    
    try {
      const workflowId = ctx.params.id;
      const { context } = ctx.request.body;
      
      // Get workflow
      const workflow = await strapi.entityService.findOne('api::campaign-workflow.campaign-workflow', workflowId);
      
      if (!workflow) {
        return ctx.notFound('Workflow not found');
      }
      
      if (!workflow.isActive) {
        return ctx.badRequest('Workflow is not active');
      }
      
      // Execute workflow with provided context
      const execution = await this.executeWorkflowActions(workflow, context);
      
      // Log execution to database
      await strapi.db.connection.raw(`
        INSERT INTO workflow_executions (workflow_id, context, results, executed_at)
        VALUES (?, ?, ?, ?)
      `, [
        workflowId,
        JSON.stringify(context || {}),
        JSON.stringify(execution),
        new Date().toISOString()
      ]);
      
      console.log('✅ CampaignWorkflow: Executed workflow', { 
        workflowId, 
        success: execution.success,
        actionsExecuted: execution.actions?.length || 0 
      });
      
      return {
        success: execution.success,
        executionId: execution.executionId,
        results: execution.results,
        actionsExecuted: execution.actions?.length || 0,
        executedAt: execution.executedAt
      };
      
    } catch (error) {
      console.error('❌ CampaignWorkflow: Execution failed:', error);
      throw error;
    }
  },
  
  /**
   * Activate campaign workflow
   */
  async activate(ctx) {
    console.log('✅ CampaignWorkflow: Activating workflow...', { id: ctx.params.id });
    
    try {
      const workflowId = ctx.params.id;
      
      const result = await strapi.entityService.update('api::campaign-workflow.campaign-workflow', workflowId, {
        data: {
          isActive: true,
          activatedAt: new Date()
        }
      });
      
      console.log('✅ CampaignWorkflow: Activated workflow', { id: workflowId });
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ CampaignWorkflow: Activation failed:', error);
      throw error;
    }
  },
  
  /**
   * Deactivate campaign workflow
   */
  async deactivate(ctx) {
    console.log('⏸️ CampaignWorkflow: Deactivating workflow...', { id: ctx.params.id });
    
    try {
      const workflowId = ctx.params.id;
      
      const result = await strapi.entityService.update('api::campaign-workflow.campaign-workflow', workflowId, {
        data: {
          isActive: false,
          deactivatedAt: new Date()
        }
      });
      
      console.log('✅ CampaignWorkflow: Deactivated workflow', { id: workflowId });
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ CampaignWorkflow: Deactivation failed:', error);
      throw error;
    }
  },
  
  /**
   * Get workflow execution history
   */
  async getExecutions(ctx) {
    console.log('📊 CampaignWorkflow: Getting executions...', { workflowId: ctx.params.id });
    
    try {
      const workflowId = ctx.params.id;
      const { page = 1, pageSize = 25 } = ctx.query;
      
      // Query executions from database
      const executions = await strapi.db.connection.raw(`
        SELECT * FROM workflow_executions 
        WHERE workflow_id = ? 
        ORDER BY executed_at DESC 
        LIMIT ? OFFSET ?
      `, [workflowId, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]);
      
      // Get total count
      const countResult = await strapi.db.connection.raw(`
        SELECT COUNT(*) as total FROM workflow_executions WHERE workflow_id = ?
      `, [workflowId]);
      
      const total = countResult.rows?.[0]?.total || 0;
      
      console.log('✅ CampaignWorkflow: Retrieved executions', { 
        workflowId, 
        count: executions.rows?.length || 0,
        total 
      });
      
      return {
        data: executions.rows || [],
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
      console.error('❌ CampaignWorkflow: Get executions failed:', error);
      throw error;
    }
  },
  
  /**
   * Helper method to execute workflow actions
   */
  async executeWorkflowActions(workflow, context) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const executedAt = new Date().toISOString();
    
    console.log('🔧 CampaignWorkflow: Executing actions...', { 
      workflowId: workflow.id,
      executionId,
      actionCount: workflow.actions?.length || 0 
    });
    
    const results = [];
    
    try {
      // Check conditions first
      if (workflow.conditions && workflow.conditions.length > 0) {
        const conditionsMet = await this.evaluateConditions(workflow.conditions, context);
        if (!conditionsMet) {
          return {
            success: false,
            executionId,
            executedAt,
            reason: 'Workflow conditions not met',
            results: []
          };
        }
      }
      
      // Execute actions sequentially
      for (const action of workflow.actions) {
        try {
          const actionResult = await this.executeAction(action, context, workflow.apiIntegrations);
          results.push({
            action: action.type,
            success: true,
            result: actionResult,
            executedAt: new Date().toISOString()
          });
        } catch (actionError) {
          console.error(`❌ Action failed: ${action.type}`, actionError);
          results.push({
            action: action.type,
            success: false,
            error: actionError.message,
            executedAt: new Date().toISOString()
          });
        }
      }
      
      return {
        success: true,
        executionId,
        executedAt,
        actions: workflow.actions,
        results,
        context
      };
      
    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      return {
        success: false,
        executionId,
        executedAt,
        error: error.message,
        results
      };
    }
  },
  
  /**
   * Helper method to evaluate workflow conditions
   */
  async evaluateConditions(conditions, context) {
    console.log('🔍 CampaignWorkflow: Evaluating conditions...', { conditionCount: conditions.length });
    
    for (const condition of conditions) {
      // Simple condition evaluation - can be enhanced
      const { field, operator, value } = condition;
      const contextValue = context[field];
      
      let conditionMet = false;
      
      switch (operator) {
        case 'equals':
          conditionMet = contextValue === value;
          break;
        case 'not_equals':
          conditionMet = contextValue !== value;
          break;
        case 'greater_than':
          conditionMet = parseFloat(contextValue) > parseFloat(value);
          break;
        case 'less_than':
          conditionMet = parseFloat(contextValue) < parseFloat(value);
          break;
        case 'contains':
          conditionMet = String(contextValue).includes(String(value));
          break;
        case 'exists':
          conditionMet = contextValue !== undefined && contextValue !== null;
          break;
        default:
          console.warn(`Unknown condition operator: ${operator}`);
          conditionMet = true; // Default to true for unknown operators
      }
      
      if (!conditionMet) {
        console.log('❌ Condition not met:', { field, operator, value, contextValue });
        return false;
      }
    }
    
    console.log('✅ All conditions met');
    return true;
  },
  
  /**
   * Helper method to execute individual action
   */
  async executeAction(action, context, apiIntegrations) {
    console.log('🎯 CampaignWorkflow: Executing action...', { type: action.type });
    
    switch (action.type) {
      case 'send_email':
        // Placeholder for email sending
        return { sent: true, recipient: action.recipient };
        
      case 'create_lead':
        // Placeholder for lead creation
        return { created: true, leadId: 'lead_' + Date.now() };
        
      case 'api_call':
        // Execute API integration
        return await this.executeAPICall(action, context, apiIntegrations);
        
      case 'delay':
        // Placeholder for delay action
        return { delayed: true, duration: action.duration };
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  },
  
  /**
   * Helper method to execute API calls
   */
  async executeAPICall(action, context, apiIntegrations) {
    console.log('🌐 CampaignWorkflow: Executing API call...', { 
      endpoint: action.endpoint,
      method: action.method 
    });
    
    const { endpoint, method = 'GET', headers = {}, body } = action;
    
    // Replace context variables in endpoint and body
    const processedEndpoint = this.replaceContextVariables(endpoint, context);
    const processedBody = body ? this.replaceContextVariables(JSON.stringify(body), context) : null;
    
    try {
      const response = await fetch(processedEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: processedBody
      });
      
      const responseData = await response.json();
      
      return {
        status: response.status,
        success: response.ok,
        data: responseData
      };
      
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  },
  
  /**
   * Helper method to replace context variables in strings
   */
  replaceContextVariables(template, context) {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      return context[variable.trim()] || match;
    });
  }
}));