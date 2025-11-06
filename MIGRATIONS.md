# Database Migrations with D1 Time Travel

## Current Migration Status

| Database | Status | Last Migration | Time Travel Enabled |
|----------|--------|----------------|-------------------|
| Development | Not Started | - | ✅ |
| Production | Not Started | - | ✅ |
| Local | Not Started | - | ❌ (Local only) |

**Next Steps**: Create initial migration for your application schema.

## Migration System

This project uses **Cloudflare D1's native migration system** enhanced with **D1 Time Travel** for safety:

- **D1 Native Migrations**: Built into wrangler CLI, automatic tracking in `d1_migrations` table
- **D1 Time Travel**: Automatic bookmarks for backup/recovery (30-day retention)
- **Safe Migration Workflow**: Create backups before applying changes

### D1 Time Travel Benefits
- Automatic point-in-time recovery up to 30 days
- Zero-cost backup history
- Instant rollback capability for failed migrations
- Protection against human errors during schema changes

### Safe Migration Workflow

1. **Create a backup bookmark** (Production only)
   ```bash
   wrangler d1 time-travel info DB --env production
   # Note the current timestamp for potential rollback
   ```

2. **Create a new migration**
   ```bash
   wrangler d1 migrations create DB "description_of_changes"
   ```

3. **Edit the migration file**
   - Files are created in `migrations/` directory
   - Use standard SQL DDL statements
   - Add `PRAGMA defer_foreign_keys = true;` if needed for constraints

4. **Test in development first**
   ```bash
   wrangler d1 migrations apply DB
   ```

5. **Verify the changes**
   ```bash
   wrangler d1 migrations list DB
   ```

6. **Apply to production**
   ```bash
   wrangler d1 migrations apply DB --env production --remote
   ```

7. **Update this document**
   - Document the new migration status above

### Migration File Structure

D1 migrations are simple SQL files created in the `migrations/` directory:

```sql
-- This migration creates the initial user table
-- Created by: wrangler d1 migrations create DB "create_users_table"

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

**Key Points:**
- No version numbers needed - D1 handles sequencing automatically
- No custom tracking code - D1 manages this in the `d1_migrations` table
- Use `IF NOT EXISTS` for safe, repeatable migrations
- Standard SQL DDL/DML statements

### Emergency Recovery

If a migration fails or causes issues:

1. **Check Time Travel bookmarks**
   ```bash
   wrangler d1 time-travel info DB --env production
   ```

2. **Restore to previous state** (if needed)
   ```bash
   wrangler d1 time-travel restore DB --env production --timestamp=UNIX_TIMESTAMP
   ```

3. **Create a fix migration**
   ```bash
   wrangler d1 migrations create DB "fix_failed_migration"
   ```

## Migration History

D1 automatically tracks all applied migrations. To view migration history:

```bash
# List applied and pending migrations
wrangler d1 migrations list DB --env production

# View the d1_migrations table directly
wrangler d1 execute DB --env production --remote --command "SELECT * FROM d1_migrations ORDER BY applied_at;"
```

## Example Initial Schema

Your first migrations might create:

### Core Application Tables
- `users` - User accounts and authentication
- `sessions` - User session management
- `content` - Dynamic application content
- `files` - File metadata for R2 storage integration

### Example Initial Migration
```sql
-- Migration: Create core application tables
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

## Troubleshooting

### Checking Migration Status

```bash
# Check which migrations are pending
wrangler d1 migrations list DB --env production

# View current database schema
wrangler d1 execute DB --env production --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### Recovery from Failed Migrations

1. **Check Time Travel history**
   ```bash
   wrangler d1 time-travel info DB --env production --timestamp=$(date -d '1 hour ago' +%s)
   ```

2. **Restore if necessary**
   ```bash
   wrangler d1 time-travel restore DB --env production --timestamp=BACKUP_TIMESTAMP
   ```

3. **Create corrective migration**
   ```bash
   wrangler d1 migrations create DB "fix_schema_issue"
   ```

## Database Setup

### 1. Enable D1 Database in wrangler.toml

Uncomment and configure the database bindings:

```toml
# Development environment
[[d1_databases]]
binding = "DB"
database_name = "your-app-db-dev"
database_id = "your-dev-database-id"

# Production environment
[[env.production.d1_databases]]
binding = "DB"
database_name = "your-app-db-prod"
database_id = "your-prod-database-id"
```

### 2. Create D1 Databases

```bash
# Create development database
wrangler d1 create your-app-db-dev

# Create production database
wrangler d1 create your-app-db-prod
```

### 3. Update wrangler.toml with Database IDs

Copy the database IDs from the create commands into your wrangler.toml file.

## Quick Reference Commands

```bash
# Migration Management
wrangler d1 migrations create DB "migration_description"
wrangler d1 migrations list DB [--env production]
wrangler d1 migrations apply DB [--env production --remote]

# Time Travel & Recovery
wrangler d1 time-travel info DB [--env production]
wrangler d1 time-travel restore DB --env production --timestamp=TIMESTAMP

# Database Queries
wrangler d1 execute DB --command "SELECT * FROM users LIMIT 5;"
wrangler d1 execute DB --env production --remote --command "PRAGMA table_info(users);"

# Database Management
wrangler d1 create database-name
wrangler d1 delete database-name
wrangler d1 list
```

## Database Naming Convention

- Development: `[project-name]-db-dev`
- Production: `[project-name]-db-prod`
- Local: Not applicable (D1 requires remote databases)
