/**
 * TypeScript API Observability (TAO) — lightweight local implementation.
 *
 * Provides the TAO surface described in docs/tao.md (logs, metrics, traces)
 * without an external backend dependency. It emits structured JSON logs,
 * in-process metrics, and correlates work under a W3C-style trace context so
 * routes can be instrumented consistently across the API.
 *
 * Configuration is environment driven:
 *   TAO_SERVICE_NAME   (default: "octocat-supply-api")
 *   TAO_ENVIRONMENT    (default: process.env.NODE_ENV || "development")
 *   TAO_LOG_LEVEL      (default: "info")  one of debug|info|warn|error
 */

import { randomBytes } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface TAOConfig {
  serviceName: string;
  environment: string;
  logLevel: LogLevel;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const config: TAOConfig = {
  serviceName: process.env.TAO_SERVICE_NAME || 'octocat-supply-api',
  environment: process.env.TAO_ENVIRONMENT || process.env.NODE_ENV || 'development',
  logLevel: (process.env.TAO_LOG_LEVEL as LogLevel) || 'info',
};

/** Initialize/override TAO configuration. Safe to call once at startup. */
export function initTAO(overrides: Partial<TAOConfig> = {}): TAOConfig {
  Object.assign(config, overrides);
  return { ...config };
}

/* -------------------------------------------------------------------------- */
/* Trace context                                                              */
/* -------------------------------------------------------------------------- */

export interface TraceContext {
  traceId: string;
  spanId: string;
}

// A minimal ambient current-span holder. Express handlers are async but run to
// completion within a single logical span, so a module-level current context
// (set/reset around each span) is sufficient for correlation in this API.
let currentContext: TraceContext | undefined;

function newId(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}

export function getTraceContext(): TraceContext | undefined {
  return currentContext;
}

/** Serialize the active trace context into W3C `traceparent` headers. */
export function withContext(context: TraceContext | undefined = currentContext): Record<string, string> {
  if (!context) return {};
  return { traceparent: `00-${context.traceId}-${context.spanId}-01` };
}

/* -------------------------------------------------------------------------- */
/* Metrics                                                                    */
/* -------------------------------------------------------------------------- */

type Labels = Record<string, string | number>;

function labelKey(labels: Labels): string {
  return Object.keys(labels)
    .sort()
    .map((k) => `${k}=${labels[k]}`)
    .join(',');
}

class Counter {
  private readonly values = new Map<string, number>();
  constructor(public readonly name: string) {}
  inc(labels: Labels = {}, amount = 1): void {
    const key = labelKey(labels);
    this.values.set(key, (this.values.get(key) || 0) + amount);
  }
  get(labels: Labels = {}): number {
    return this.values.get(labelKey(labels)) || 0;
  }
}

class Histogram {
  private readonly counts = new Map<string, number>();
  private readonly sums = new Map<string, number>();
  constructor(public readonly name: string) {}
  observe(value: number, labels: Labels = {}): void {
    const key = labelKey(labels);
    this.counts.set(key, (this.counts.get(key) || 0) + 1);
    this.sums.set(key, (this.sums.get(key) || 0) + value);
  }
  average(labels: Labels = {}): number {
    const key = labelKey(labels);
    const count = this.counts.get(key) || 0;
    return count === 0 ? 0 : (this.sums.get(key) || 0) / count;
  }
}

export const MetricRegistry = {
  counters: new Map<string, Counter>(),
  histograms: new Map<string, Histogram>(),
  counter(opts: { name: string }): Counter {
    let c = this.counters.get(opts.name);
    if (!c) {
      c = new Counter(opts.name);
      this.counters.set(opts.name, c);
    }
    return c;
  },
  histogram(opts: { name: string }): Histogram {
    let h = this.histograms.get(opts.name);
    if (!h) {
      h = new Histogram(opts.name);
      this.histograms.set(opts.name, h);
    }
    return h;
  },
};

/* -------------------------------------------------------------------------- */
/* Structured logging                                                         */
/* -------------------------------------------------------------------------- */

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

function emit(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[config.logLevel]) return;
  const ctx = getTraceContext();
  const record = {
    timestamp: new Date().toISOString(),
    level,
    service: config.serviceName,
    environment: config.environment,
    message,
    ...(ctx ? { traceId: ctx.traceId, spanId: ctx.spanId } : {}),
    ...meta,
  };
  const line = JSON.stringify(record);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger: Logger = {
  debug: (m, meta) => emit('debug', m, meta),
  info: (m, meta) => emit('info', m, meta),
  warn: (m, meta) => emit('warn', m, meta),
  error: (m, meta) => emit('error', m, meta),
};

/* -------------------------------------------------------------------------- */
/* Spans                                                                      */
/* -------------------------------------------------------------------------- */

const requestCounter = MetricRegistry.counter({ name: 'api_requests_total' });
const errorCounter = MetricRegistry.counter({ name: 'api_errors_total' });
const latency = MetricRegistry.histogram({ name: 'api_request_duration_ms' });

/**
 * Run `fn` inside a named span: establishes a trace context, emits start/finish
 * logs, and records request-count, error-count, and latency metrics labelled by
 * operation. The active context is restored afterwards so spans can nest.
 */
export async function withSpan<T>(
  operation: string,
  fn: (context: TraceContext) => Promise<T>,
  labels: Labels = {},
): Promise<T> {
  const parent = currentContext;
  const context: TraceContext = {
    traceId: parent?.traceId || newId(16),
    spanId: newId(8),
  };
  currentContext = context;

  const start = Date.now();
  const metricLabels = { operation, ...labels };
  requestCounter.inc(metricLabels);
  logger.debug('span.start', { operation });

  try {
    const result = await fn(context);
    latency.observe(Date.now() - start, metricLabels);
    logger.debug('span.finish', { operation, durationMs: Date.now() - start });
    return result;
  } catch (error) {
    errorCounter.inc(metricLabels);
    latency.observe(Date.now() - start, metricLabels);
    logger.error('span.error', {
      operation,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    currentContext = parent;
  }
}

/* -------------------------------------------------------------------------- */
/* Express integration                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Auto-instrumentation middleware: wraps each request in a span named after the
 * HTTP method + route, logging completion with status code and duration.
 */
export function observe() {
  return function observeMiddleware(req: Request, res: Response, next: NextFunction): void {
    const operation = `${req.method} ${req.baseUrl || ''}${req.path}`;
    void withSpan(
      operation,
      () =>
        new Promise<void>((resolve) => {
          const start = Date.now();
          res.on('finish', () => {
            logger.info('http.request', {
              method: req.method,
              path: req.originalUrl,
              statusCode: res.statusCode,
              durationMs: Date.now() - start,
            });
            resolve();
          });
          next();
        }),
      { method: req.method },
    );
  };
}
