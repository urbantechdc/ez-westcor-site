# Cloudflare Workers Vite Plugin Setup

## ✅ Integration Complete!

The Cloudflare Workers Vite Plugin has been integrated into this template, providing a **game-changing local development experience**.

## 🚀 What's New

### Before (Deploy-to-Test)
```bash
# Make code changes
npm run dev          # ❌ D1 bindings don't work locally
git commit && git push
./build.sh --deploy-dev    # Deploy to test Worker functionality
# Discover bug, repeat cycle...
```

### After (Local-First Development)
```bash
# Make code changes
npm run dev          # ✅ D1, R2, KV bindings work locally!
# Fix any issues immediately in local development
./build.sh --deploy-dev    # Deploy with confidence
```

## 🎯 First-Time Setup

### 1. Install Dependencies
```bash
npm install  # Installs @cloudflare/vite-plugin (latest v1.13.3)
```

### 2. Set Up Local Database (First Time Only)
```bash
# Option 1: Quick setup
npm run dev:local-db

# Option 2: Step by step
./build.sh --migrate-local
npm run dev
```

### 3. Test the Integration
Visit: `http://localhost:5173/api/test-local-d1`

**Expected Response:**
```json
{
  "timestamp": "2025-01-13T10:30:00.000Z",
  "environment": "development",
  "tests": {
    "bindingExists": true,
    "canQuery": true,
    "tablesExist": false,
    "migrationTableExists": true
  },
  "info": [
    "✅ D1 database binding found",
    "✅ Basic queries work",
    "✅ D1 migrations table exists with 0 migration(s)",
    "⚠️  Basic setup works, but run migrations to complete setup."
  ]
}
```

### 4. Create Your First Migration (Optional)
```bash
./build.sh --migrate-create "create_users_table"
```

Edit the generated file in `migrations/` folder:
```sql
-- Create initial user table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

Apply it locally:
```bash
npm run migrate:apply:local
```

Test again: `http://localhost:5173/api/test-local-d1` should now show `tablesExist: true`

## 🔧 Configuration Details

### Vite Config (`vite.config.js`)
```javascript
import { sveltekit } from '@sveltejs/kit/vite';
import { cloudflareDevProxyVitePlugin as cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    cloudflare({
      configPath: './wrangler.toml',
      experimentalJsonConfig: false
    })
  ]
});
```

### Wrangler Configuration
The plugin reads your `wrangler.toml` file to understand:
- D1 database bindings
- R2 bucket bindings
- KV namespace bindings
- Environment variables

## 📝 Development Workflow

### Daily Development
```bash
# Standard development
npm run dev                    # Start with all bindings

# With fresh local database
npm run dev:reset-db          # Reset DB + start dev server

# Database operations
npm run migrate:apply:local   # Apply new migrations
npm run migrate:list:local    # Check migration status
```

### Testing Your API Endpoints
```bash
# Test D1 connection
curl http://localhost:5173/api/test-local-d1

# Test your app endpoints with real data
curl http://localhost:5173/api/hello
curl -X POST http://localhost:5173/api/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com"}'
```

## 🛠️ Available Commands

### NPM Scripts
```bash
# Development
npm run dev                    # Standard dev server
npm run dev:local-db          # Apply migrations + start dev
npm run dev:reset-db          # Reset DB + apply migrations + start dev

# Local database management
npm run migrate:apply:local   # Apply migrations to local DB
npm run migrate:list:local    # List local migration status
npm run db:reset:local        # Reset local database files
```

### Build Script Commands
```bash
# Local database operations
./build.sh --migrate-local               # Apply migrations to local DB
./build.sh --migrate-status local        # Check local migration status
./build.sh --db-reset-local              # Reset local DB (with confirmation)

# Migration management
./build.sh --migrate-create 'description'  # Create new migration
./build.sh --migrate-dev                   # Apply to development
./build.sh --migrate-prod                  # Apply to production
```

## 🚨 Troubleshooting

### Plugin Not Loading
**Error:** `Cannot resolve '@cloudflare/vite-plugin'`
```bash
npm install @cloudflare/vite-plugin --save-dev
```

### D1 Bindings Not Working
1. Check `wrangler.toml` has D1 database configured
2. Ensure you've run `npm run migrate:apply:local`
3. Restart dev server: `npm run dev`

### Local Database Reset
```bash
# Nuclear option - completely reset local state
rm -rf .wrangler/state/v3/d1
npm run migrate:apply:local
npm run dev
```

### Check Plugin Status
Visit: `http://localhost:5173/api/test-local-d1`

This endpoint will validate your setup and show what's working.

## 🎉 Benefits Unlocked

- ✅ **Real D1 bindings** in local development
- ✅ **Hot module replacement** for both frontend + Worker code
- ✅ **Production-accurate runtime** using `workerd`
- ✅ **Test database operations** without deploying
- ✅ **Debug API endpoints** with actual Cloudflare bindings
- ✅ **Faster iteration cycles** - no more deploy-to-test
- ✅ **Better error debugging** - see issues immediately
- ✅ **Safer deployments** - test everything locally first

## 📚 Next Steps

1. **Test the integration** - Visit the test endpoint
2. **Create your schema** - Add your first migration
3. **Build your API** - Use real D1 bindings in development
4. **Deploy with confidence** - Everything tested locally first

The local development experience is now **production-grade**! 🚀