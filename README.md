# EZ-Westcor File Search

**Employee File Discovery System** - A proof of concept for making large file listings searchable and navigable, with employee-based organization and file preview capabilities.

## 🎯 Overview

EZ-Westcor File Search is a web-based proof of concept designed to demonstrate how to make large-scale file listings (32GB+ of data) searchable and accessible. The system indexes employee files from a structured files.txt listing and provides an intuitive interface for browsing, searching, and previewing documents.

### Key Features

- **👥 Employee Directory** - Browse files organized by employee with search functionality
- **🔍 File Search** - Real-time search across employee names, IDs, and file metadata
- **📁 File Browser** - Navigate through structured file collections by employee
- **👁️ File Preview** - Preview documents and files directly in the browser (planned)
- **📊 File Analytics** - Track file access patterns and search queries
- **📱 Responsive Design** - Modern, mobile-friendly interface built with Bootstrap 5

## 📋 File Organization Structure

Based on the files.txt format with employee-based file organization:

```
[Index] - [Employee ID] - [Employee Name] - [Category]/[File Path]

Examples:
0001 - AXV017147 - Carlos F Abdala-Cobos - 00/EMPTY - AXV017147 - 1 - Carlos F Abdala-Cobos.txt
0002 - AXV017147 - Carlos F Abdala-Cobos - 04/FILES - AXV017147 - Documents.pdf
```

### File Categories

- **00/EMPTY** - Placeholder or empty files
- **04/FILES** - Files with actual content (PDFs, documents, etc.)

## 🏗️ Architecture

- **Frontend**: SvelteKit 5 with reactive components and file-based routing
- **Backend**: Cloudflare Workers with integrated API endpoints
- **Database**: Cloudflare D1 (SQLite) for employee and file metadata storage
- **Storage**: File indexing system with search capabilities
- **Deployment**: Single deployment to Cloudflare Workers (not Pages)

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   ├── styles/             # Custom CSS and styling
│   └── server/             # Server-side utilities
├── routes/
│   ├── api/                # API endpoints for file data
│   └── +page.svelte        # Main employee directory interface
├── hooks.server.ts         # Server middleware
migrations/                 # Database schema for file indexing
static/                     # Static assets
wrangler.toml              # Cloudflare deployment configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)
- Wrangler CLI logged in

### Local Development

```bash
# Install dependencies
npm install

# Set up local database and start development server
npm run dev:local-db

# Or start development server after migrations are applied
npm run dev

# View at http://localhost:5173
```

### Database Setup

```bash
# Apply migrations to local database
npm run migrate:apply:local

# Check migration status
npm run migrate:list:local

# Reset local database (if needed)
npm run db:reset:local
```

### Deployment

```bash
# Deploy to development environment
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## 🗄️ Database Schema

The system uses a simplified schema designed for file indexing and search:

- **employees** - Employee directory with IDs and names
- **employee_files** - File listings with metadata and categories
- **file_categories** - File type classifications (00/EMPTY, 04/FILES, etc.)
- **file_search_index** - Full-text search indexing for file content
- **file_access_log** - Usage tracking and analytics
- **search_queries** - Search analytics and optimization

## 📊 Current Features

### ✅ Implemented
- Employee directory with search
- File category organization
- Mock data for development
- Responsive UI design
- Database schema for file indexing

### 🚧 Planned Features
- **File Import System** - Parse and import actual files.txt data
- **Advanced Search** - Search across file content and metadata
- **File Preview** - In-browser document and PDF preview
- **Bulk Operations** - Export search results and file lists
- **Performance Optimization** - Pagination and lazy loading for large datasets

## 🔧 Configuration

Key configuration files:

- `wrangler.toml` - Cloudflare Workers and database configuration
- `project.config.json` - Project metadata and settings
- `svelte.config.js` - SvelteKit framework configuration

### Environment Variables

Configure in `wrangler.toml`:

```toml
[env.dev.vars]
NODE_ENV = "dev"

[env.prod.vars]
NODE_ENV = "prod"
```

## 📈 Performance Considerations

- **Database Indexing** - Optimized indexes for employee and file searches
- **File Categorization** - Efficient organization by employee and file type
- **Search Optimization** - Full-text search capabilities for large datasets
- **Cloudflare Edge** - Global distribution for fast file access

## 🎨 User Interface

Built with:
- **SvelteKit 5** - Modern reactive framework
- **Bootstrap 5** - Responsive design system
- **Custom Styling** - Professional, clean interface
- **Progressive Enhancement** - Works without JavaScript

## 📝 Development Notes

This is a **proof of concept** designed to demonstrate:

1. **Scalability** - How to handle large file listings efficiently
2. **Search Performance** - Fast search across employee and file data
3. **User Experience** - Intuitive interface for file discovery
4. **Deployment** - Simple deployment to Cloudflare infrastructure

## 🤝 Contributing

This project is in active development. Key areas for contribution:

1. **File Parsing** - Implement files.txt import functionality
2. **Search Enhancement** - Advanced search and filtering
3. **File Preview** - Document preview capabilities
4. **Performance** - Optimization for large datasets

## 📄 License

See LICENSE.TXT for details.

## 🔗 Related Projects

- Original data source: files.txt (32GB employee file listing)
- Built with Cloudflare Workers and SvelteKit
- Database: Cloudflare D1 (SQLite)

---

**Status**: Proof of Concept | **Version**: 0.0.1 | **Last Updated**: November 2025