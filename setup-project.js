#!/usr/bin/env node

/**
 * Setup script to initialize a new project from the SvelteKit + Cloudflare template
 * Run this script after copying the template files to a new project
 */

import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupProject() {
  console.log('\n🚀 SvelteKit + Cloudflare Workers Project Setup\n');
  
  // Check if project.config.json already exists
  if (fs.existsSync('project.config.json')) {
    const overwrite = await question('project.config.json already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      process.exit(0);
    }
  }
  
  // Collect project information
  const projectName = await question('Project name (lowercase, hyphens): ') || 'my-app';
  const projectDescription = await question('Project description: ') || 'SvelteKit + Cloudflare Workers Application';
  const accountId = await question('Cloudflare Account ID: ') || '';
  const devWorkerName = await question(`Development worker name [${projectName}-dev]: `) || `${projectName}-dev`;
  const prodWorkerName = await question(`Production worker name [${projectName}]: `) || projectName;
  
  // Create project.config.json
  const config = {
    project: {
      name: projectName,
      description: projectDescription,
      version: "0.0.1",
      repository: ""
    },
    cloudflare: {
      account_id: accountId,
      workers: {
        dev_name: devWorkerName,
        prod_name: prodWorkerName,
        compatibility_date: "2025-01-01",
        compatibility_flags: ["nodejs_compat"]
      },
      routes: {
        dev: [],
        prod: []
      },
      databases: {
        d1: {
          dev: {
            binding: "DB",
            database_name: "",
            database_id: ""
          },
          prod: {
            binding: "DB",
            database_name: "",
            database_id: ""
          }
        }
      },
      storage: {
        r2: {
          dev: {
            binding: "BUCKET",
            bucket_name: ""
          },
          prod: {
            binding: "BUCKET",
            bucket_name: ""
          }
        },
        kv: {
          dev: {
            binding: "KV",
            namespace_id: ""
          },
          prod: {
            binding: "KV",
            namespace_id: ""
          }
        }
      }
    },
    development: {
      port: 5173,
      host: "localhost"
    },
    deployment: {
      environments: ["dev", "prod"],
      auto_minify: true
    }
  };
  
  // Write project.config.json
  fs.writeFileSync('project.config.json', JSON.stringify(config, null, 2));
  console.log('✅ Created project.config.json');
  
  // Generate wrangler.toml from template
  if (fs.existsSync('wrangler.template.toml')) {
    let wranglerContent = fs.readFileSync('wrangler.template.toml', 'utf8');
    
    // Replace placeholders
    wranglerContent = wranglerContent
      .replace(/{{DEV_WORKER_NAME}}/g, devWorkerName)
      .replace(/{{PROD_WORKER_NAME}}/g, prodWorkerName)
      .replace(/{{COMPATIBILITY_DATE}}/g, config.cloudflare.workers.compatibility_date)
      .replace(/{{ACCOUNT_ID}}/g, accountId);
    
    fs.writeFileSync('wrangler.toml', wranglerContent);
    console.log('✅ Generated wrangler.toml from template');
  }
  
  // Update package.json with project name
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.name = projectName;
    // Ensure latest wrangler version
    if (packageJson.devDependencies && packageJson.devDependencies.wrangler) {
      packageJson.devDependencies.wrangler = "^4.29.1";
    }
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, '\t'));
    console.log('✅ Updated package.json');
  }
  
  // Update CLAUDE.md
  if (fs.existsSync('CLAUDE.md')) {
    let claudeContent = fs.readFileSync('CLAUDE.md', 'utf8');
    claudeContent = claudeContent.replace('[PROJECT_NAME]', projectName);
    fs.writeFileSync('CLAUDE.md', claudeContent);
    console.log('✅ Updated CLAUDE.md');
  }
  
  console.log('\n✨ Project setup complete!\n');
  console.log('Next steps:');
  console.log('1. Run: npm install');
  console.log('2. Configure Cloudflare resources in wrangler.toml as needed');
  console.log('3. Run: npm run dev (for local development)');
  console.log('4. Run: ./build.sh --deploy-dev (to deploy to Cloudflare)');
  console.log('\n📚 Template files you can safely delete:');
  console.log('   - setup-project.js (this file)');
  console.log('   - wrangler.template.toml');
  console.log('   - project.config.example.json (if you created one)');
  
  rl.close();
}

setupProject().catch(console.error);