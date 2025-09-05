/**
 * Form Builder Service
 */

'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::form-builder.form-builder');