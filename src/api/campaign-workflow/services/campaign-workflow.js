/**
 * Campaign Workflow Service
 */

'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::campaign-workflow.campaign-workflow');