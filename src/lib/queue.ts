import { Client } from '@upstash/qstash';

const isQStashConfigured = !!process.env.QSTASH_TOKEN;
const qstashClient = isQStashConfigured
  ? new Client({ token: process.env.QSTASH_TOKEN || '' })
  : null;

type JobHandler = (payload: any) => Promise<void>;
const handlers = new Map<string, JobHandler>();

/**
 * Register a handler for a specific job name.
 * Registered handlers will be executed when a job is processed.
 */
export function registerJobHandler(jobName: string, handler: JobHandler) {
  handlers.set(jobName, handler);
}

/**
 * Execute a job immediately.
 * Used by the webhook/worker route.
 */
export async function executeJob(jobName: string, payload: any): Promise<void> {
  const handler = handlers.get(jobName);
  if (!handler) {
    throw new Error(`No job handler registered for job: ${jobName}`);
  }
  await handler(payload);
}

/**
 * Enqueue a background job.
 * If QStash is configured, it will schedule an HTTP POST call to our worker route.
 * Otherwise, it falls back to an async in-memory fire-and-forget execution for development.
 */
export async function enqueueJob(jobName: string, payload: any): Promise<void> {
  if (isQStashConfigured && qstashClient) {
    const workerUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/queue-worker`;
    try {
      await qstashClient.publishJSON({
        url: workerUrl,
        body: { jobName, payload },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return;
    } catch (err) {
      console.error(`QStash publish failed, falling back to local background execution:`, err);
    }
  }

  // Local fallback
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Queue] Enqueued job: ${jobName} (local background execution)`);
  }
  
  // Fire-and-forget background execution
  (async () => {
    // Small delay to simulate async queue behavior
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      await executeJob(jobName, payload);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Queue] Completed job: ${jobName}`);
      }
    } catch (err) {
      console.error(`[Queue] Error executing job ${jobName}:`, err);
    }
  })();
}
