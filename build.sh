#!/bin/bash
set -e

# Configuration
CONFIG_FILE="project.config.json"
PID_FILE=".dev-server.pid"

# Check for config file (except for dev commands which don't need it)
if [[ ! "$1" =~ ^(--dev-|--help)$ ]] && [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: $CONFIG_FILE not found. Please create it from project.config.example.json"
  exit 1
fi

# Load configuration if needed
if [ -f "$CONFIG_FILE" ]; then
  PROJECT_NAME=$(node -e "console.log(require('./$CONFIG_FILE').project.name)" 2>/dev/null || echo "app")
fi

# Development server functions
start_dev_server() {
  echo "Starting development server..."
  
  if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
      echo "Server is already running with PID: $OLD_PID"
      exit 1
    else
      rm "$PID_FILE"
    fi
  fi
  
  # Start the server in background
  npm run dev > dev-server.log 2>&1 &
  SERVER_PID=$!
  echo $SERVER_PID > "$PID_FILE"
  
  echo "Server started with PID: $SERVER_PID"
  echo "Access the application at http://localhost:5173"
  echo "Logs are being written to dev-server.log"
  echo "Use './build.sh --dev-logs' to view logs"
}

stop_dev_server() {
  if [ ! -f "$PID_FILE" ]; then
    echo "Server is not running"
    return 0
  fi
  
  PID=$(cat "$PID_FILE")
  echo "Stopping server with PID: $PID"
  
  if kill "$PID" 2>/dev/null; then
    rm "$PID_FILE"
    echo "Server stopped"
  else
    echo "Failed to stop server (process may have already ended)"
    rm -f "$PID_FILE"
  fi
}

restart_dev_server() {
  echo "Restarting server..."
  stop_dev_server
  sleep 1
  start_dev_server
}

show_dev_logs() {
  if [ ! -f "dev-server.log" ]; then
    echo "No log file found. Start the server first with './build.sh --dev-start'"
    exit 1
  fi
  
  echo "Showing server logs (Ctrl+C to exit)..."
  tail -f dev-server.log
}

dev_status() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
      echo "✅ Development server is running (PID: $PID)"
      echo "   URL: http://localhost:5173"
    else
      echo "⚠️  PID file exists but server is not running"
      rm "$PID_FILE"
    fi
  else
    echo "❌ Development server is not running"
  fi
}

# Build function
build_app() {
  echo "Building $PROJECT_NAME..."
  echo "Building SvelteKit app..."
  npm run build
  echo "Build output created in .svelte-kit/cloudflare/"
  echo "Build complete."
}

# Linting functions
lint_code() {
  echo "🔍 Running ESLint on codebase..."
  npm run lint
  echo "✅ Linting complete."
}

lint_and_format() {
  echo "🔍 Running ESLint with auto-fix..."
  npm run lint:fix
  echo "🎨 Running Prettier formatting..."
  npm run format
  echo "✅ Linting and formatting complete."
}

check_formatting() {
  echo "🔍 Checking code formatting..."
  npm run format:check
  echo "✅ Format check complete."
}

# Main command handling
case "$1" in
  # Development server commands
  --dev-start)
    start_dev_server
    ;;
  --dev-stop)
    stop_dev_server
    ;;
  --dev-restart)
    restart_dev_server
    ;;
  --dev-logs)
    show_dev_logs
    ;;
  --dev-status)
    dev_status
    ;;
    
  # Build command
  --build|"")
    build_app
    ;;

  # Linting commands
  --lint)
    lint_code
    ;;
  --lint-fix)
    lint_and_format
    ;;
  --format-check)
    check_formatting
    ;;

  # Update changelog
  --update-changelog)
    CHANGELOG_ENABLED=$(node -e "console.log(require('./$CONFIG_FILE').project.changelog?.enabled || false)")
    
    if [ "$CHANGELOG_ENABLED" != "true" ]; then
      echo "Changelog is not enabled in $CONFIG_FILE"
      echo "Set project.changelog.enabled to true and configure github_repo to enable"
      exit 0
    fi
    
    GITHUB_REPO=$(node -e "console.log(require('./$CONFIG_FILE').project.changelog?.github_repo || '')")
    BASE_VERSION=$(node -e "console.log(require('./$CONFIG_FILE').project.changelog?.base_version || '0')")
    
    if [ -z "$GITHUB_REPO" ]; then
      echo "Error: GitHub repository not configured in $CONFIG_FILE"
      exit 1
    fi
    
    echo "Updating Changelog from GitHub..."
    
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
      echo "Error: GitHub CLI (gh) is not installed. Please install it to update the changelog."
      echo "Visit: https://cli.github.com/"
      exit 1
    fi
    
    # Check GitHub authentication
    echo "Checking GitHub authentication..."
    GH_STATUS=$(gh auth status 2>&1 || true)
    if echo "$GH_STATUS" | grep -q "not logged into"; then
      echo "Error: Not authenticated with GitHub. Please run 'gh auth login' first."
      exit 1
    fi
    
    echo "Fetching PRs from $GITHUB_REPO..."
    
    # Fetch PR data as JSON (all merged PRs)
    PR_DATA=$(gh pr list -s merged --json number,title,mergedAt,headRefName --repo "$GITHUB_REPO" -L 1000)
    
    # Count the PRs and generate build version
    PR_COUNT=$(echo "$PR_DATA" | jq '. | length')
    BUILD_VERSION="${BASE_VERSION}.$(printf "%02d" $PR_COUNT)"
    
    # Update build version in config
    echo "Updating build version to $BUILD_VERSION (based on $PR_COUNT PRs)..."
    
    # Create version.json file
    mkdir -p public/data
    echo "{
  \"version\": \"$BUILD_VERSION\",
  \"semantic_version\": \"$(node -e "console.log(require('./$CONFIG_FILE').project.version)")\",
  \"prCount\": $PR_COUNT,
  \"baseVersion\": \"$BASE_VERSION\",
  \"lastUpdated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
}" > public/data/version.json
    
    # Save PR data as JSON for Svelte component
    mkdir -p src/lib
    echo "$PR_DATA" > src/lib/changelog-data.json
    
    echo "Changelog updated successfully."
    ;;
    
  # Database migration commands
  --migrate-create)
    if [ -z "$2" ]; then
      echo "Error: Migration description required"
      echo "Usage: ./build.sh --migrate-create 'description of changes'"
      exit 1
    fi
    echo "Creating migration: $2"
    npx wrangler d1 migrations create DB "$2"
    ;;

  --migrate-local)
    echo "Applying migrations to local database..."
    npx wrangler d1 migrations apply DB --local
    echo "Local database ready for development"
    ;;

  --migrate-dev)
    echo "Applying migrations to development environment..."
    npx wrangler d1 migrations apply DB --env dev
    ;;

  --migrate-prod)
    echo "Creating backup before production migration..."
    BACKUP_TIME=$(date +%s)
    echo "Backup timestamp: $BACKUP_TIME (save this for rollback if needed)"
    npx wrangler d1 time-travel info DB --env prod
    echo ""
    echo "Applying migrations to production database..."
    npx wrangler d1 migrations apply DB --env prod --remote
    ;;

  --migrate-status)
    ENV=${2:-dev}
    if [ "$ENV" = "local" ]; then
      echo "Local migration status:"
      npx wrangler d1 migrations list DB --local
    elif [ "$ENV" = "prod" ]; then
      echo "Production migration status:"
      npx wrangler d1 migrations list DB --env prod
    else
      echo "Development migration status:"
      npx wrangler d1 migrations list DB --env dev
    fi
    ;;

  --db-reset-local)
    echo "⚠️  WARNING: This will delete your local database!"
    echo "Continue? (y/N)"
    read -r confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
      echo "Resetting local database..."
      rm -rf .wrangler/state/v3/d1
      echo "Local database reset. Run './build.sh --migrate-local' to recreate."
    else
      echo "Database reset cancelled"
    fi
    ;;

  --migrate-rollback)
    if [ -z "$2" ]; then
      echo "Error: Timestamp required for rollback"
      echo "Usage: ./build.sh --migrate-rollback UNIX_TIMESTAMP"
      echo "Use --migrate-backup-info to find available timestamps"
      exit 1
    fi
    echo "⚠️  WARNING: This will restore the production database to timestamp $2"
    echo "⚠️  All data changes after this timestamp will be lost!"
    echo "Continue? (y/N)"
    read -r confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
      npx wrangler d1 time-travel restore DB --env prod --timestamp="$2"
    else
      echo "Rollback cancelled"
    fi
    ;;

  --migrate-backup-info)
    echo "Current database backup information:"
    npx wrangler d1 time-travel info DB --env prod
    ;;

  # Deployment commands
  --deploy-dev)
    build_app
    echo "Deploying to development environment..."
    npx wrangler deploy --env dev
    ;;

  --deploy-prod)
    build_app
    echo "Deploying to production environment..."
    npx wrangler deploy --env prod
    ;;
    
  # Help
  --help|*)
    echo "Usage: ./build.sh [COMMAND]"
    echo ""
    echo "Development Server Commands:"
    echo "  --dev-start          Start the development server"
    echo "  --dev-stop           Stop the development server"
    echo "  --dev-restart        Restart the development server"
    echo "  --dev-logs           View development server logs"
    echo "  --dev-status         Check if development server is running"
    echo ""
    echo "Build Commands:"
    echo "  --build              Build the application (default if no command)"
    echo "  --update-changelog   Update changelog from GitHub PRs (if enabled)"
    echo ""
    echo "Code Quality Commands:"
    echo "  --lint               Run ESLint to check for code issues"
    echo "  --lint-fix           Run ESLint with auto-fix and format code"
    echo "  --format-check       Check code formatting without making changes"
    echo ""
    echo "Database Migration Commands:"
    echo "  --migrate-create 'desc'         Create a new migration file"
    echo "  --migrate-local                 Apply pending migrations to local database"
    echo "  --migrate-dev                   Apply pending migrations to dev environment"
    echo "  --migrate-prod                  Apply pending migrations to prod environment (with backup)"
    echo "  --migrate-status [local|dev|prod] Show migration status (default: dev)"
    echo "  --migrate-backup-info           Show Time Travel backup information (prod only)"
    echo "  --migrate-rollback TIMESTAMP    Rollback prod DB to timestamp (DANGEROUS)"
    echo "  --db-reset-local                Reset local database (deletes all local data)"
    echo ""
    echo "Deployment Commands:"
    echo "  --deploy-dev         Build and deploy to development environment"
    echo "  --deploy-prod        Build and deploy to production environment"
    echo ""
    echo "Examples:"
    echo "  ./build.sh                            # Build the application"
    echo "  ./build.sh --dev-start                # Start dev server"
    echo "  ./build.sh --lint                     # Check code quality"
    echo "  ./build.sh --lint-fix                 # Fix code issues and format"
    echo "  ./build.sh --migrate-create 'users'   # Create migration"
    echo "  ./build.sh --migrate-local            # Apply migrations to local DB"
    echo "  ./build.sh --migrate-dev              # Apply migrations to dev"
    echo "  ./build.sh --migrate-status local     # Check local migration status"
    echo "  ./build.sh --db-reset-local           # Reset local database"
    echo "  ./build.sh --deploy-dev               # Build and deploy to dev"
    ;;
esac