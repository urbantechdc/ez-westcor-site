# D1 Future Best Practices & Advanced Patterns

This document outlines advanced Cloudflare D1 best practices and production-ready patterns that can be implemented as your application scales. The current template includes basic D1 integration, but these enhancements provide enterprise-grade database management.

## 📊 Performance Monitoring & Alerting

### Real-Time Performance Tracking

**Implementation Status**: 🟡 Partially implemented (d1-utils.ts created)
**Effort**: Medium
**Production Impact**: High

```typescript
// Enhanced query monitoring with automatic alerting
export async function executeWithMonitoring<T>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<{ result: T; metrics: QueryMetrics }> {
  const startTime = performance.now();

  // Get execution plan for optimization insights
  const plan = await getQueryPlan(db, query, params);

  // Execute with retry logic
  const result = await executeWithRetry(() =>
    db.prepare(query).bind(...params).run()
  ) as T;

  const duration = performance.now() - startTime;

  const metrics = {
    duration,
    plan,
    retryCount: getLastRetryCount(),
    indexUsed: plan?.includes('USING INDEX'),
    tableScan: plan?.includes('SCAN')
  };

  // Automatic alerting for performance issues
  await checkPerformanceThresholds(metrics, query);

  return { result, metrics };
}
```

### Multi-Channel Alert System

**Alert Channels**: Slack, Email, SMS, Sentry, DataDog
**Severity Levels**: Info, Warning, Error, Critical
**Cooldown Logic**: Prevents alert spam

```typescript
interface AlertSystem {
  channels: {
    slack: { webhookUrl: string; enabled: boolean };
    sentry: { dsn: string; enabled: boolean };
    email: { apiKey: string; enabled: boolean };
    sms: { twilioConfig: TwilioConfig; enabled: boolean };
  };
  thresholds: {
    slowQueryMs: number;
    errorRate: number;
    retryRate: number;
    indexMissRate: number;
  };
}

// Example alert triggers
const ALERT_CONDITIONS = {
  slowQueries: (metrics) => metrics.avgDuration > 200,
  highErrors: (metrics) => metrics.errorRate > 0.05,
  missedIndexes: (metrics) => metrics.scanRate > 0.3,
  dbDegraded: (metrics) => metrics.retryRate > 0.1
};
```

### Production Monitoring Dashboard

**Metrics to Track**:
- Query execution times (P50, P95, P99)
- Error rates by query type
- Index utilization rates
- Retry attempt frequency
- Database connection health
- Table growth rates

## 🔄 Advanced Query Retry Logic

### Intelligent Retry Strategies

**Implementation Status**: ✅ Implemented (d1-utils.ts)
**Integration Status**: 🟡 Needs API integration

**Current Implementation**:
- ✅ Exponential backoff with jitter
- ✅ Retryable error detection
- ✅ Configurable max attempts
- ✅ Performance monitoring

**Integration Example**:
```typescript
// src/routes/api/users/+server.ts
import { executeWithRetry } from '$lib/server/d1-utils';

export const GET: RequestHandler = async ({ platform }) => {
  const db = platform?.env?.DB;

  const users = await executeWithRetry(() =>
    db.prepare("SELECT * FROM users WHERE active = ?").bind(true).all()
  );

  return json(users);
};
```

### Retry Patterns by Operation Type

```typescript
const RETRY_CONFIGS = {
  read: { maxAttempts: 5, baseDelay: 100 },
  write: { maxAttempts: 3, baseDelay: 200 },
  critical: { maxAttempts: 7, baseDelay: 50 }
};
```

## 🔍 Index Optimization

### Consistent Index Naming Convention

**Current**: Mixed naming patterns
**Best Practice**: `idx_[table]_[columns]` format

**Migration Example**:
```sql
-- Current (inconsistent)
CREATE INDEX users_email ON users(email);
CREATE INDEX user_created_idx ON users(created_at);

-- Best Practice (consistent)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_email_status ON users(email, status);
```

### Automated Index Analysis

```typescript
// Analyze query patterns and suggest indexes
export async function analyzeIndexNeeds(db: D1Database): Promise<IndexRecommendation[]> {
  const recommendations = [];

  // Find queries that perform table scans
  const scanQueries = await findTableScans(db);

  for (const query of scanQueries) {
    const suggestedIndex = analyzeWhereClause(query.sql);
    if (suggestedIndex) {
      recommendations.push({
        table: suggestedIndex.table,
        columns: suggestedIndex.columns,
        reason: `Query performs table scan: ${query.sql}`,
        impact: 'High'
      });
    }
  }

  return recommendations;
}
```

## ⚡ PRAGMA Optimize Integration

### Automatic Database Optimization

**Implementation**: Add to migration workflow and scheduled maintenance

```bash
# Enhanced migration commands
./build.sh --migrate-prod-optimized  # Applies migrations + runs PRAGMA optimize
./build.sh --optimize-db [env]       # Standalone optimization command
```

**Build Script Enhancement**:
```bash
# Add to build.sh
--migrate-prod-optimized)
  echo "Creating backup before production migration with optimization..."
  BACKUP_TIME=$(date +%s)
  echo "Backup timestamp: $BACKUP_TIME"
  npx wrangler d1 time-travel info DB --env production
  echo ""
  echo "Applying migrations to production database..."
  npx wrangler d1 migrations apply DB --env production --remote
  echo "Optimizing database performance..."
  npx wrangler d1 execute DB --env production --remote --command "PRAGMA optimize;"
  echo "✅ Migration and optimization completed"
  ;;
```

**Scheduled Optimization** (via Cron Triggers):
```typescript
// Scheduled function to run weekly
export async function scheduledOptimize(env: Env) {
  console.log('Running scheduled database optimization...');

  await env.DB.prepare("PRAGMA optimize").run();

  // Log optimization results
  const stats = await getDatabaseStats(env.DB);
  console.log(`Database optimized - Tables: ${stats.tables}, Indexes: ${stats.indexes}`);
}
```

## 📦 Batch Operations

### High-Performance Bulk Operations

**Current**: Single-record operations
**Enhancement**: Efficient batch processing

```typescript
// Batch insert with optimal chunking
export async function batchUpsert<T extends Record<string, any>>(
  db: D1Database,
  tableName: string,
  records: T[],
  options: {
    batchSize?: number;
    onConflict?: 'ignore' | 'replace' | 'update';
    progressCallback?: (completed: number, total: number) => void;
  } = {}
): Promise<BatchResult> {
  const { batchSize = 50, onConflict = 'ignore', progressCallback } = options;

  const results: BatchResult = {
    inserted: 0,
    updated: 0,
    errors: [],
    duration: 0
  };

  const startTime = performance.now();

  // Process in optimal batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    try {
      const statements = batch.map(record => {
        const columns = Object.keys(record);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(record);

        let sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

        if (onConflict === 'ignore') {
          sql += ' ON CONFLICT DO NOTHING';
        } else if (onConflict === 'replace') {
          sql += ' ON CONFLICT DO UPDATE SET ' +
            columns.map(col => `${col} = excluded.${col}`).join(', ');
        }

        return db.prepare(sql).bind(...values);
      });

      const batchResults = await executeWithRetry(() => db.batch(statements));

      // Process results
      batchResults.forEach(result => {
        if (result.success) {
          if (result.meta?.changes > 0) {
            results.inserted += result.meta.changes;
          }
        } else {
          results.errors.push(`Batch error: ${result.error}`);
        }
      });

      // Progress callback
      if (progressCallback) {
        progressCallback(i + batch.length, records.length);
      }

    } catch (error) {
      results.errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`);
    }
  }

  results.duration = performance.now() - startTime;
  return results;
}
```

## 🛡️ Enhanced Error Handling

### Error Classification System

```typescript
enum D1ErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  CONSTRAINT = 'constraint',
  SYNTAX = 'syntax',
  CAPACITY = 'capacity',
  UNKNOWN = 'unknown'
}

export function classifyD1Error(error: unknown): D1ErrorType {
  const errorMsg = String(error).toLowerCase();

  if (errorMsg.includes('network') || errorMsg.includes('connection')) {
    return D1ErrorType.NETWORK;
  }

  if (errorMsg.includes('timeout') || errorMsg.includes('too slow')) {
    return D1ErrorType.TIMEOUT;
  }

  if (errorMsg.includes('unique') || errorMsg.includes('foreign key')) {
    return D1ErrorType.CONSTRAINT;
  }

  if (errorMsg.includes('syntax') || errorMsg.includes('parse')) {
    return D1ErrorType.SYNTAX;
  }

  if (errorMsg.includes('too many') || errorMsg.includes('rate limit')) {
    return D1ErrorType.CAPACITY;
  }

  return D1ErrorType.UNKNOWN;
}

// Enhanced error handling with classification
export async function executeWithEnhancedErrorHandling<T>(
  operation: () => Promise<T>,
  context: { query?: string; table?: string; operation?: string }
): Promise<T> {
  try {
    return await executeWithRetry(operation);
  } catch (error) {
    const errorType = classifyD1Error(error);
    const enhancedError = new D1Error(error, errorType, context);

    // Log structured error data
    console.error('D1 Error Details:', {
      type: errorType,
      context,
      retryable: shouldRetry(error, 1),
      timestamp: new Date().toISOString()
    });

    // Send to monitoring systems
    await reportError(enhancedError);

    throw enhancedError;
  }
}
```

## 🚀 Connection Management

### Connection Pool Simulation

```typescript
// D1 doesn't have traditional connections, but we can simulate
// connection health monitoring and failover patterns
export class D1ConnectionManager {
  private healthCheck = new Map<string, { lastCheck: number; healthy: boolean }>();

  async getHealthyDatabase(
    primary: D1Database,
    fallback?: D1Database
  ): Promise<D1Database> {
    const primaryHealthy = await this.checkHealth('primary', primary);

    if (primaryHealthy) {
      return primary;
    }

    if (fallback) {
      const fallbackHealthy = await this.checkHealth('fallback', fallback);
      if (fallbackHealthy) {
        console.warn('Using fallback database - primary unhealthy');
        return fallback;
      }
    }

    throw new Error('No healthy database connections available');
  }

  private async checkHealth(name: string, db: D1Database): Promise<boolean> {
    const now = Date.now();
    const cached = this.healthCheck.get(name);

    // Use cached result if fresh (30 seconds)
    if (cached && (now - cached.lastCheck) < 30000) {
      return cached.healthy;
    }

    try {
      await db.prepare('SELECT 1').first();
      this.healthCheck.set(name, { lastCheck: now, healthy: true });
      return true;
    } catch {
      this.healthCheck.set(name, { lastCheck: now, healthy: false });
      return false;
    }
  }
}
```

## 📈 Advanced Analytics

### Query Performance Analytics

```typescript
// Track query patterns and performance over time
export class D1Analytics {
  async trackQuery(
    query: string,
    duration: number,
    success: boolean,
    metadata: QueryMetadata
  ): Promise<void> {
    const analytics = {
      queryHash: hashQuery(query),
      duration,
      success,
      timestamp: Date.now(),
      table: metadata.table,
      operation: metadata.operation,
      indexUsed: metadata.indexUsed
    };

    // Store in KV for aggregation
    await this.storeAnalytics(analytics);
  }

  async getSlowQueries(limit = 10): Promise<SlowQuery[]> {
    // Aggregate and return slowest queries
    return this.aggregateSlowQueries(limit);
  }

  async getIndexEfficiency(): Promise<IndexReport> {
    // Analyze index usage patterns
    return this.analyzeIndexUsage();
  }
}
```

## 🔧 Implementation Roadmap

### Phase 1: Foundation (1-2 weeks)
- ✅ Query retry utilities (completed)
- 🟡 Integrate retry logic into API endpoints
- 🟡 Update index naming conventions
- 🟡 Add PRAGMA optimize to migrations

### Phase 2: Monitoring (2-3 weeks)
- 🔴 Implement performance monitoring
- 🔴 Set up basic alerting (Slack/email)
- 🔴 Create monitoring dashboard endpoint
- 🔴 Add query plan analysis

### Phase 3: Advanced Features (3-4 weeks)
- 🔴 Batch operation utilities
- 🔴 Enhanced error handling
- 🔴 Multi-channel alerting
- 🔴 Analytics and reporting

### Phase 4: Production Hardening (2-3 weeks)
- 🔴 Connection health management
- 🔴 Automated index recommendations
- 🔴 Advanced monitoring integrations
- 🔴 Performance optimization automation

## 📚 References

- [Cloudflare D1 Best Practices](https://developers.cloudflare.com/d1/best-practices/)
- [D1 Query Best Practices](https://developers.cloudflare.com/d1/best-practices/query-d1/)
- [D1 Retry Strategies](https://developers.cloudflare.com/d1/best-practices/retry-queries/)
- [D1 Index Guidelines](https://developers.cloudflare.com/d1/best-practices/use-indexes/)
- [SQLite Optimization](https://sqlite.org/optoverview.html)

---

**Status Legend:**
- ✅ Completed
- 🟡 Partially implemented
- 🔴 Not implemented
- 📋 Planned

This document serves as a roadmap for evolving the basic D1 integration into a production-ready, enterprise-grade database solution.