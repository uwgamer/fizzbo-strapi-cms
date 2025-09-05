# Fizzbo Strapi CMS Deployment Guide

## Overview

This guide covers deploying the Fizzbo Strapi CMS to Railway with shared Supabase PostgreSQL database integration. The deployment maintains zero disruption to existing Fizzbo functionality while adding comprehensive CMS and workflow management capabilities.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Strapi code must be in a Git repository
3. **Supabase Database**: Existing Fizzbo Supabase project with PostgreSQL access
4. **Environment Variables**: All required configuration values

## Step 1: Railway Project Setup

### Create New Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new fizzbo-strapi-cms

# Connect to GitHub repository
railway connect
```

### Configure Railway Environment Variables
In Railway dashboard, add these environment variables:

```bash
# Strapi Configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=1337

# Database Configuration (from your Supabase project)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
DATABASE_SSL=true
DATABASE_PREFIX=strapi_

# Generate new security keys (CRITICAL - don't use examples)
APP_KEYS=your-generated-key-1,your-generated-key-2,your-generated-key-3,your-generated-key-4
ADMIN_JWT_SECRET=your-generated-jwt-secret-here
API_TOKEN_SALT=your-generated-api-token-salt
TRANSFER_TOKEN_SALT=your-generated-transfer-salt
SESSION_SECRET=your-generated-session-secret

# Admin Configuration
ADMIN_REGISTRATION_ENABLED=false
ADMIN_FROM_EMAIL=admin@fizzbo.com
ADMIN_REPLY_TO_EMAIL=noreply@fizzbo.com

# CORS Configuration
FIZZBO_FRONTEND_URL=https://d11ze0u6raprps.cloudfront.net

# Supabase Integration (from your existing project)
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### Generate Security Keys
**CRITICAL**: Generate new, secure keys for production:

```bash
# Generate APP_KEYS (4 random strings)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Generate SALT values
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 2: Database Migration

### Run RBAC Sync Migration
Before deploying, run the RBAC synchronization migration in your Supabase SQL editor:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor
2. Copy content from `src/shared/database/migrations/strapi-rbac-sync.sql`
3. Execute the migration
4. Verify tables created with `strapi_` prefix

### Verify Database Connection
Test the database connection string:
```bash
# Test connection (replace with your actual connection string)
psql "postgresql://postgres:[password]@[host]:5432/postgres" -c "SELECT 1;"
```

## Step 3: Deploy to Railway

### Initial Deployment
```bash
# Deploy from local directory
railway up

# Or deploy from GitHub (recommended)
# 1. Push code to GitHub repository
# 2. Connect Railway to GitHub repo in dashboard
# 3. Enable automatic deployments
```

### Monitor Deployment
```bash
# View deployment logs
railway logs

# Check service status
railway status
```

## Step 4: Verify Deployment

### Health Check
Test the deployment health endpoint:
```bash
curl https://[your-railway-domain]/_health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2023-XX-XXTXX:XX:XX.XXXZ",
  "database": "connected",
  "auth": "ready",
  "version": "1.0.0",
  "environment": "production"
}
```

### Admin Panel Access
1. Navigate to `https://[your-railway-domain]/admin`
2. Create first admin user (if registration enabled)
3. Or login with synced Supabase user

### API Testing
Test basic API endpoints:
```bash
# Test content types
curl https://[your-railway-domain]/api/marketing-pages

# Test form builders
curl https://[your-railway-domain]/api/form-builders
```

## Step 5: Fizzbo Frontend Integration

### Update Environment Variables
In your Fizzbo frontend environment configuration:

```bash
# Add Strapi URL
EXPO_PUBLIC_STRAPI_URL=https://[your-railway-domain]

# Update if needed
EXPO_PUBLIC_SUPABASE_URL=[your-existing-supabase-url]
```

### Test Integration
From Fizzbo frontend:
```javascript
import { getStrapiService } from './src/shared/services/ServiceFactory';

// Test connection
const strapiService = getStrapiService();
const isHealthy = await strapiService.isHealthy();
console.log('Strapi integration:', isHealthy);
```

## Step 6: Configure Custom Domain (Optional)

### Add Custom Domain in Railway
1. Go to Railway dashboard → Your service → Settings → Domains  
2. Add custom domain (e.g., `cms.fizzbo.com`)
3. Update DNS records as instructed
4. Update `FIZZBO_FRONTEND_URL` and CORS settings

## Troubleshooting

### Common Issues

**Database Connection Errors:**
- Verify `DATABASE_URL` format and credentials
- Check Supabase connection pooling settings
- Ensure `DATABASE_SSL=true` for Supabase

**Authentication Issues:**
- Verify all JWT secrets are properly generated
- Check CORS configuration includes your frontend URLs
- Ensure Supabase service role key has correct permissions

**Migration Errors:**
- Run migrations manually in Supabase SQL editor
- Verify `strapi_` prefixed tables exist
- Check database user has CREATE TABLE permissions

**Health Check Failures:**
- Check Railway deployment logs: `railway logs`
- Verify all environment variables are set
- Test database connection independently

### Debug Commands
```bash
# View Railway service logs
railway logs --follow

# Check environment variables
railway vars

# Test database connection
railway run psql $DATABASE_URL -c "SELECT version();"

# SSH into container (if needed)
railway shell
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **Admin Registration**: Keep `ADMIN_REGISTRATION_ENABLED=false` in production
3. **JWT Secrets**: Generate strong, unique secrets for each environment
4. **CORS**: Restrict to specific frontend domains only
5. **Database Access**: Use service role key, not anonymous key

## Monitoring and Maintenance

### Railway Monitoring
- Enable Railway monitoring and alerts
- Monitor resource usage and scaling needs
- Set up log retention policies

### Health Monitoring
- Integrate health check with monitoring service
- Monitor database connection pool usage
- Track API response times and error rates

### Backup Strategy
- Supabase handles database backups
- Export Strapi configuration regularly
- Document environment variable configurations

## Production Scaling

### Vertical Scaling
- Monitor memory and CPU usage in Railway
- Upgrade Railway plan as needed
- Optimize database queries and connections

### Horizontal Scaling
- Railway supports horizontal scaling
- Configure load balancing if needed
- Ensure session state is stateless

### Database Optimization
- Monitor database performance
- Optimize queries with indexes
- Consider connection pooling configuration

## Support and Monitoring

### Railway Support
- Railway documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord community
- Railway status page

### Integration Support
- Monitor Fizzbo frontend integration
- Check ServiceFactory health status
- Verify RBAC synchronization

---

## Deployment Checklist

- [ ] Railway project created and configured
- [ ] Environment variables set (all required values)
- [ ] Security keys generated (not using examples)
- [ ] Database migration executed in Supabase
- [ ] Code deployed to Railway
- [ ] Health check endpoint responding
- [ ] Admin panel accessible
- [ ] Fizzbo frontend integration tested
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and alerts configured
- [ ] Documentation updated with actual URLs

**Deployment Status**: Ready for production when checklist completed ✅