# Cloudflare Zero Trust Setup Guide

This guide will help you configure Cloudflare Zero Trust (Access) to protect your Downloads page and provide user authentication for the download logging system.

## Overview

The EZ-Westcor Downloads system integrates with Cloudflare Zero Trust to:
- 🔐 Authenticate users accessing the Downloads page
- 📧 Track user email addresses in download logs
- 📍 Log user location and access information
- 👥 Support group-based permissions (admin features)
- 🔍 Provide audit trails for compliance

## Prerequisites

1. ✅ Cloudflare account with Zero Trust enabled
2. ✅ Domain name managed by Cloudflare
3. ✅ Zero Trust subscription (Free tier available)

## Step 1: Enable Zero Trust

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select **Zero Trust** from the left sidebar
3. If not enabled, click **Get started** and follow the setup

## Step 2: Configure Authentication

### Identity Providers

Set up your preferred identity provider:

1. Go to **Zero Trust** → **Settings** → **Authentication**
2. Click **Add new** under **Login methods**
3. Choose your provider:

**Recommended Options:**
- **One-time PIN**: Email-based authentication
- **Microsoft Azure AD**: For Microsoft/Office 365 users
- **Google Workspace**: For Google users
- **SAML/OIDC**: For enterprise SSO

**Example: One-time PIN Setup**
1. Select **One-time PIN**
2. Enable **Email validation**
3. Configure email domains (e.g., `@your-company.com`)
4. Save configuration

## Step 3: Create Access Application

### Application Configuration

1. Go to **Zero Trust** → **Access** → **Applications**
2. Click **Add an application**
3. Select **Self-hosted**

**Application Settings:**
```
Application name: EZ-Westcor Downloads
Session duration: 8 hours
Application domain: your-domain.com
Path: /downloads
```

**Advanced Settings:**
- ✅ Enable **Browser rendering**
- ✅ Enable **HTTP Cookie**
- ✅ Enable **CORS headers**

### Access Policies

Create policies to control who can access the Downloads page:

**Policy 1: Employee Access**
```
Name: Employee Downloads Access
Action: Allow
Session duration: 8 hours

Include rules:
- Emails: @your-company.com
- Groups: employees, staff

Require rules:
- Country: United States (optional)
```

**Policy 2: Admin Access** (Optional - for future admin features)
```
Name: Download Administrators
Action: Allow
Session duration: 24 hours

Include rules:
- Groups: admin, download-admin
- Emails: admin@your-company.com

Additional verification:
- Purpose justification
```

## Step 4: Configure Groups (Optional)

For advanced access control:

1. Go to **Zero Trust** → **Access** → **Groups**
2. Click **Add a group**

**Example Groups:**
```
Name: download-admin
Criteria:
- Email: admin@company.com, security@company.com

Name: employees
Criteria:
- Email domain: @company.com
- Country: US, CA
```

## Step 5: Test Configuration

### Verification Steps

1. **Deploy your application** to the configured domain
2. **Visit `/downloads`** in incognito mode
3. **Verify authentication** prompt appears
4. **Complete login flow** with your test account
5. **Check application logs** for user information

### Expected Headers

After successful authentication, these headers will be available:

```http
cf-access-authenticated-user-email: user@company.com
cf-access-authenticated-user-name: John Doe
cf-access-authenticated-user-id: 123abc...
cf-access-authenticated-user-groups: employees,staff
```

## Step 6: Application Integration

The EZ-Westcor application automatically:

- ✅ **Extracts user info** from Zero Trust headers
- ✅ **Populates event.locals.user** with user data
- ✅ **Logs download attempts** with user email and location
- ✅ **Supports group-based permissions** for admin features

### User Information Available

```typescript
// In any API endpoint or page:
const user = event.locals.user;
// {
//   id: "user@company.com",
//   email: "user@company.com",
//   name: "John Doe"
// }

const isAdmin = event.locals.isAdmin; // boolean
const fullZTUser = event.locals.zeroTrustUser; // complete ZT data
```

## Step 7: Security Considerations

### Recommended Settings

**Session Management:**
- Session duration: 8 hours for regular users, 4 hours for admins
- Idle timeout: 2 hours
- Force re-authentication for sensitive operations

**Location-based Controls:**
- Restrict to trusted countries/regions
- Alert on unusual location access
- Block known VPN/proxy traffic

**Device Trust:**
- Require device certificates for admin access
- Enable device posture checks
- Monitor for suspicious device behavior

### Monitoring & Alerts

Set up monitoring for:
- ❌ Failed authentication attempts
- 🌍 Access from new locations
- ⏰ After-hours access patterns
- 🔄 Unusual download frequency

## Step 8: Advanced Features

### Custom Claims

Add custom user metadata:

1. Go to **Zero Trust** → **Access** → **Applications**
2. Edit your application
3. Go to **Settings** → **Policies**
4. Add custom headers:

```
X-Department: Engineering
X-Role: Manager
X-Clearance-Level: 3
```

### API Access

For programmatic access:

1. Create **service authentication**
2. Generate **service tokens**
3. Use tokens in API calls:

```bash
curl -H "CF-Access-Client-Id: xxx" \
     -H "CF-Access-Client-Secret: yyy" \
     https://your-domain.com/api/downloads/logs
```

## Troubleshooting

### Common Issues

**Users not authenticated:**
- Check domain/path configuration
- Verify DNS/proxy settings
- Review policy rules

**Missing user information:**
- Check header configuration
- Verify identity provider claims
- Review application logs

**Permission denied errors:**
- Verify group membership
- Check policy precedence
- Review geographic restrictions

### Debug Commands

```bash
# Check headers in browser developer tools
# Network tab → Response Headers

# Test with curl
curl -I https://your-domain.com/downloads

# Check application logs
wrangler tail --format pretty
```

## Production Checklist

Before going live:

- [ ] Test all authentication flows
- [ ] Verify user group assignments
- [ ] Test download logging
- [ ] Review security policies
- [ ] Set up monitoring alerts
- [ ] Document user access procedures
- [ ] Train administrators on user management

## Support

For Zero Trust support:
- 📖 [Cloudflare Zero Trust Docs](https://developers.cloudflare.com/cloudflare-one/)
- 💬 [Cloudflare Community](https://community.cloudflare.com/)
- 🎫 [Cloudflare Support](https://support.cloudflare.com/)

For application-specific issues:
- Check application logs: `wrangler tail`
- Review network requests in browser dev tools
- Verify database logs for download attempts