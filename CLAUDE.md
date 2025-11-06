# Project Overview
[PROJECT_NAME] - SvelteKit + Cloudflare Workers Application
- Frontend: SvelteKit with file-based routing and reactive components
- Backend: Cloudflare Workers with API routes integrated in the same project
- Database: D1 (serverless SQLite) for data storage
- Object Storage: R2 for files and media
- KV Storage: For simple key-value caching
- Authentication: Can integrate with Cloudflare Zero Trust
- Deployment: Single deployment to Cloudflare Workers (not Pages)

Configuration is managed via `project.config.json`

# Tools & Dependencies
- wrangler login complete (v4.42.2+)
- gh login complete
- mcp Puppeteer enabled (playwright:browser_install() (MCP) has already been run)
- Claude for git commit, Human for push
- **Cloudflare Workers Vite Plugin** - Enables local D1/R2/KV bindings in development

## Keeping Dependencies Updated
```bash
# Check for outdated packages
npm outdated

# Update wrangler specifically
npm install wrangler@latest --save-dev

# Update all dependencies to latest compatible versions
npm update

# For major version updates
npm install <package>@latest --save-dev
```

# Folder Structure
- /src: Application code (SvelteKit)
  - /src/lib: Reusable components, stores, and utilities
    - /src/lib/components: Reusable Svelte components
    - /src/lib/stores: Svelte stores for state management
    - /src/lib/server: Server-only utilities
  - /src/routes: Pages and API endpoints
    - /src/routes/api: API endpoints (+server.ts files)
    - /src/routes/*: Page routes (+page.svelte files)
  - /src/hooks.server.ts: Server hooks for middleware
- /static: Static assets (images, fonts, etc.)
- /.svelte-kit: Build output (git-ignored)
- /migrations: D1 database migration files (auto-generated)
- wrangler.toml: Cloudflare deployment config
- svelte.config.js: SvelteKit configuration
- vite.config.js: Vite bundler configuration
- app.d.ts: TypeScript app definitions
- app.html: HTML template

# Development Practices
- Minimize complexity. Prefer simple, understandable code.
- Deploy to Cloudflare Workers for testing (preview URLs auto-generated)
- Use SvelteKit's built-in Vite bundler (no additional bundlers needed)
- TypeScript support included but not strictly enforced
- Small functions, clear folder structure, clean module exports
- File-based routing for pages and API endpoints
- Single deployment artifact for frontend + backend

# SvelteKit-Specific Guidelines
- Pages: +page.svelte files for routes
- API endpoints: +server.ts files with GET/POST/etc exports
- Layouts: +layout.svelte for shared UI structure
- Loading states: +page.ts for data loading
- Error pages: +error.svelte for error handling
- Use Svelte stores for cross-component state
- Reactive statements with $: for computed values
- Component files use .svelte extension
- Access Cloudflare bindings via platform.env

# Development Commands

## Standard Development
```bash
npm install               # Install dependencies
npm run dev               # Start development server (http://localhost:5173)
# OR
./build.sh --dev-start    # Start development server (background process)
./build.sh --dev-stop     # Stop development server
./build.sh --dev-restart  # Restart development server
./build.sh --dev-logs     # View server logs
./build.sh --dev-status   # Check server status
```

## Local Database Development
```bash
# First-time local setup
npm run dev:local-db      # Apply migrations and start dev server with D1 bindings
# OR
./build.sh --migrate-local   # Apply migrations to local database
npm run dev                  # Start dev server (now with local D1 access)

# Development workflow
npm run migrate:apply:local  # Apply new migrations to local DB
npm run migrate:list:local   # Check local migration status
npm run dev:reset-db         # Reset local DB and restart (fresh start)

# Direct build.sh commands
./build.sh --migrate-local      # Apply migrations to local database
./build.sh --migrate-status local  # Check local migration status
./build.sh --db-reset-local     # Reset local database (with confirmation)
```

## Enhanced Development Experience

**🚀 With Cloudflare Workers Vite Plugin:**
- ✅ **Real D1 bindings** work in local development
- ✅ **Hot module replacement** for both frontend and Worker code
- ✅ **Production-accurate runtime** using `workerd` locally
- ✅ **Test database operations** without deploying
- ✅ **Debug API endpoints** with actual Cloudflare bindings

# Build & Deployment Commands
```
./build.sh                   # Build the application
./build.sh --update-changelog # Update changelog from GitHub PRs
./build.sh --deploy-dev      # Build and deploy to development
./build.sh --deploy-prod     # Build and deploy to production
```

Note: Wrangler v4+ will show a warning about multiple environments. This is expected behavior and the scripts handle it correctly.

# Database Management

This project uses **Cloudflare D1's native migration system** with **Time Travel** for safe database operations:

## Migration Commands
```bash
# Create and apply migrations
./build.sh --migrate-create 'description'       # Create new migration file
./build.sh --migrate-local                      # Apply migrations to local database
./build.sh --migrate-dev                        # Apply migrations to development
./build.sh --migrate-prod                       # Apply migrations to production (with backup)

# Check status
./build.sh --migrate-status local               # Check local migration status
./build.sh --migrate-status dev                 # Check dev migration status
./build.sh --migrate-status prod                # Check prod migration status

# Local database management
./build.sh --db-reset-local                     # Reset local database (with confirmation)

# Production safety
./build.sh --migrate-backup-info                # View Time Travel backup info
./build.sh --migrate-rollback TIMESTAMP         # Emergency rollback (production only)
```

## NPM Script Shortcuts
```bash
# Local development
npm run migrate:apply:local     # Apply migrations to local database
npm run migrate:list:local      # List local migration status
npm run db:reset:local          # Reset local database files

# Remote environments
npm run migrate:apply:dev       # Apply migrations to dev environment
npm run migrate:apply:prod      # Apply migrations to prod environment
npm run migrate:list:dev        # List dev migration status
npm run migrate:list:prod       # List prod migration status
npm run db:backup-info          # View Time Travel backup info (prod only)
```

## Direct Wrangler Commands
```bash
# Create migrations
wrangler d1 migrations create DB "description_of_changes"

# Apply migrations
wrangler d1 migrations apply DB --local         # Local (works with Vite plugin)
wrangler d1 migrations apply DB --env dev       # Development environment
wrangler d1 migrations apply DB --env prod      # Production environment

# Check status
wrangler d1 migrations list DB --local          # Local
wrangler d1 migrations list DB --env dev        # Development
wrangler d1 migrations list DB --env prod       # Production

# Time Travel backup/recovery (prod only)
wrangler d1 time-travel info DB --env prod
wrangler d1 time-travel restore DB --env prod --timestamp=UNIX_TIMESTAMP
```

Migration files are automatically created in the `migrations/` directory and tracked in the `d1_migrations` table.

**⚠️ Safety First**: Production migrations automatically create Time Travel backups for easy rollback if needed.

## Local Development Workflow

**🎯 New Developer Setup:**
1. Clone repository and run `npm install`
2. Run `npm run dev:local-db` to set up local database and start dev server
3. Your API endpoints now work with real D1 bindings locally!

**📝 Daily Development:**
1. Create new migration: `./build.sh --migrate-create 'add_user_preferences'`
2. Edit the generated migration file in `migrations/`
3. Apply to local DB: `npm run migrate:apply:local`
4. Test your changes at `http://localhost:5173`
5. Deploy when ready: `./build.sh --deploy-dev`

**🔄 Iteration Cycle:**
- Code changes → Instant reload with HMR
- Database changes → Apply locally first, test, then deploy
- No more "deploy to test" cycles for basic functionality!

**🧹 Local Database Management:**
- Fresh start: `npm run dev:reset-db`
- Check migrations: `npm run migrate:list:local`
- Manual reset: `./build.sh --db-reset-local`

# Example Database Tables (customize as needed)
- users: User accounts and profiles
- sessions: User authentication sessions
- content: Dynamic content storage
- files: File metadata for R2 storage

# Deployment Restrictions
- NEVER use Cloudflare Pages deployment (`wrangler pages deploy`)
- ALWAYS use Cloudflare Workers deployment (`wrangler deploy`) exclusively
- The project uses Workers Sites for static assets, not Pages
