# SvelteKit + Cloudflare Workers Template

This is a reusable template for rapidly building SvelteKit applications deployed to Cloudflare Workers.

## Template Files

### Core Configuration Files
These files should be copied to any new project:

- `CLAUDE.md` - Project documentation template for Claude AI
- `MIGRATIONS.md` - Database migration documentation template
- `build.sh` - Unified build, dev server, and deployment script
- `wrangler.template.toml` - Cloudflare configuration template
- `project.config.example.json` - Example configuration file
- `setup-project.js` - Interactive setup script

### How to Use This Template

1. **Copy template files to your new project:**
   ```bash
   # Create new project directory
   mkdir my-new-project
   cd my-new-project
   
   # Copy template files
   cp -r /path/to/template/* .
   ```

2. **Run the setup script:**
   ```bash
   node setup-project.js
   ```
   This will:
   - Create `project.config.json` with your project settings
   - Generate `wrangler.toml` from the template
   - Update `package.json` with your project name
   - Update `CLAUDE.md` with your project name

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Configure Cloudflare resources (optional):**
   - Edit `wrangler.toml` to add D1, R2, or KV bindings
   - Update `project.config.json` with resource IDs

5. **Start developing:**
   ```bash
   ./build.sh --dev-start
   ```

## Configuration Management

All project-specific configuration is centralized in `project.config.json`:

```json
{
  "project": {
    "name": "your-project-name",
    "description": "Your project description"
  },
  "cloudflare": {
    "account_id": "your-account-id",
    "workers": {
      "dev_name": "project-dev",
      "prod_name": "project"
    }
  }
}
```

## Scripts

### Unified Build Script (`build.sh`)
All functionality is consolidated in a single script that:
- Manages the development server
- Builds the application
- Handles deployments
- Updates changelog from GitHub

**Development Server:**
```bash
./build.sh --dev-start    # Start dev server
./build.sh --dev-stop     # Stop dev server
./build.sh --dev-restart  # Restart dev server
./build.sh --dev-logs     # View server logs
./build.sh --dev-status   # Check server status
```

**Build & Deploy:**
```bash
./build.sh                   # Build application
./build.sh --update-changelog # Update from GitHub PRs
./build.sh --deploy-dev      # Build & deploy to dev
./build.sh --deploy-prod     # Build & deploy to prod
```

## Template Structure

```
template/
├── Configuration
│   ├── project.config.json         # Project configuration (generated)
│   ├── project.config.example.json # Example configuration
│   ├── wrangler.toml              # Cloudflare config (generated)
│   └── wrangler.template.toml    # Cloudflare config template
│
├── Documentation
│   ├── CLAUDE.md                  # AI assistant documentation
│   ├── MIGRATIONS.md              # Database migration guide
│   └── README.md                  # Project documentation
│
├── Scripts
│   ├── build.sh                   # Unified build, dev, and deploy script
│   └── setup-project.js           # Initial setup script
│
└── Application
    ├── src/                       # SvelteKit application
    │   ├── routes/               # Pages and API routes
    │   ├── lib/                  # Components and utilities
    │   └── hooks.server.ts       # Server hooks
    ├── static/                    # Static assets
    └── package.json              # Node dependencies
```

## Cloudflare Services

The template is pre-configured to support:

- **D1 Database**: Serverless SQLite
- **R2 Storage**: Object storage
- **KV**: Key-value storage
- **Workers**: Edge compute

Configure these in `wrangler.toml` by uncommenting the relevant sections.

## Customization

1. **Environment Variables**: Add to `wrangler.toml` `[vars]` section
2. **Custom Domains**: Configure in `wrangler.toml` `[[routes]]` section
3. **Database Schema**: Follow the migration guide in `MIGRATIONS.md`
4. **API Routes**: Add `+server.ts` files in `src/routes/api/`
5. **Pages**: Add `+page.svelte` files in `src/routes/`

## Deployment Workflow

1. **Development**:
   ```bash
   ./build.sh --dev-start         # Start local dev server
   ./build.sh --deploy-dev        # Deploy to dev environment
   ```

2. **Production**:
   ```bash
   ./build.sh --deploy-prod       # Deploy to production
   ```

## Clean Up

After setup, you can remove these template files:
- `setup-project.js`
- `wrangler.template.toml`
- `project.config.example.json`
- `TEMPLATE_README.md`
- `runDev.js` (if it still exists - functionality now in build.sh)

## Notes

- The template uses Cloudflare Workers (not Pages)
- Single deployment includes both frontend and backend
- Configuration is centralized for easy project portability
- All scripts read from `project.config.json` for consistency