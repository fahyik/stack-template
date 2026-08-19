import { Mastra } from "@mastra/core/mastra";
import { MastraCompositeStore } from "@mastra/core/storage";
import {
  DefaultExporter,
  Observability,
  SensitiveDataFilter,
} from "@mastra/observability";
import { PostgresStore } from "@mastra/pg";
import { Pool } from "pg";

import { weatherAgent } from "./agents/weather-agent.js";
import { mastraLogger } from "./logger.js";
import { weatherTool } from "./tools/weather-tool.js";
import { weatherWorkflow } from "./workflows/weather-workflow.js";

// Pre-built pool: caps the burst of parallel TLS handshakes during Mastra's
// init() (every domain inits in parallel via Promise.all), gives cold-start
// handshakes time, and keeps connections alive across Cloud Run / NAT idle.
const pgPool = new Pool({
  host: process.env.MASTRA_DB_HOSTNAME || "db",
  port: parseInt(process.env.MASTRA_DB_PORT || "5432"),
  database: process.env.MASTRA_DB_NAME || "",
  user: process.env.MASTRA_DB_USERNAME || "",
  password: process.env.MASTRA_DB_PASSWORD || "",
  ssl: ["development", "test"].includes(process.env.NODE_ENV ?? "")
    ? false
    : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 45_000,
  keepAlive: true,
});

const pgStorage = new PostgresStore({
  id: "mastra-storage",
  pool: pgPool,
  schemaName: "mastra",
});

// DuckDB powers Mastra Studio's local Metrics dashboard, but its native
// binding has segfaulted on Cloud Run / Alpine. Load it only outside
// production via dynamic import so a static import can never reach the
// crashing native module in prod. The package itself sits in
// devDependencies and is stripped by `npm prune --omit=dev` in the
// production image.
const storage =
  process.env.NODE_ENV === "production"
    ? pgStorage
    : await (async () => {
        const { DuckDBStore } = await import("@mastra/duckdb");
        const duckDbStorage = new DuckDBStore({
          path: process.env.NODE_ENV === "test" ? ":memory:" : "mastra.duckdb",
        });
        // Legacy DuckDB observability tables (metric/log/score/feedback_events)
        // need signal-ID primary keys before ObservabilityStorageDuckDB.init()
        // will run. Idempotent: no-ops once migrated.
        await duckDbStorage.observability.migrateSpans();
        return new MastraCompositeStore({
          id: "composite-storage",
          default: pgStorage,
          domains: {
            observability: duckDbStorage.observability,
          },
        });
      })();

// Declare-first: every agent, tool and workflow must be registered here
// before anything can resolve it by name at runtime.
export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  tools: { weatherTool },
  agents: { weatherAgent },
  storage,
  logger: mastraLogger,
  observability: new Observability({
    configs: {
      default: {
        serviceName: process.env.npm_package_name ?? "api",
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});

export async function shutdownMastra(): Promise<void> {
  await mastra.shutdown();
  await pgPool.end();
}
