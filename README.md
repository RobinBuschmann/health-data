# Health Data

Personal Health Record (PHR) aggregator built on FHIR. Ingests health data from
Apple Health exports, maps them to FHIR resources, and stores them in
[Medplum](https://www.medplum.com/). A React dashboard lets you upload exports
and visualise your health data.

## Prerequisites

- **Node.js** v22 or higher
- **npm** v10 or higher
- **Medplum** — a Medplum account with OAuth client credentials; set them in `.env`

## Getting started

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment**

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable                | Description                                          | Default                      |
| ----------------------- | ---------------------------------------------------- | ---------------------------- |
| `MEDPLUM_BASE_URL`      | Medplum server URL                                   | —                            |
| `MEDPLUM_CLIENT_ID`     | OAuth client ID (from **Project → Client Applications**) | —                        |
| `MEDPLUM_CLIENT_SECRET` | OAuth client secret                                  | —                            |
| `API_PORT`              | Port for the API server                              | `3000`                       |
| `API_URL`               | Full URL of the API server                           | `http://localhost:$API_PORT` |
| `WEB_PORT`              | Port for the web UI                                  | `3001`                       |
| `CORS_ORIGIN`           | Allowed CORS origin                                  | `http://localhost:$WEB_PORT` |

**3. Start dev servers**

```bash
npm run dev
```

- API: `http://localhost:3000`
- Web UI: `http://localhost:3001`

## Running tests

```bash
npm test
```

## Architecture

```
Browser → Web UI (React/Vite) → API (Fastify) → Medplum (FHIR)
```

Data flow for an Apple Health import:

1. User drops `export.zip` onto the upload zone in the dashboard.
2. The web UI POSTs the file to `POST /apple-health/import`.
3. The API extracts `export.xml` from the zip and streams it through a SAX parser.
4. The `<Me>` tag is used to create a FHIR **Patient** resource. Each `<Record>`
   tag is filtered to the supported metric types, mapped to a FHIR **Observation**
   with a LOINC code, and written to Medplum in batches of 100.
5. On success the web UI refetches the patient list and updates the dashboard.

## Packages

| Package        | Description                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/api` | Fastify backend — accepts health data uploads, maps them to FHIR resources, and writes them to Medplum |
| `packages/web` | React dashboard — drag-and-drop Apple Health import and heart rate chart                               |

### API routes

| Method | Path                   | Description                                                                                                             |
| ------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/apple-health/import` | Upload an Apple Health `export.zip`; returns `204` on success                                                           |
| `GET`  | `/patients`            | List all patients                                                                                                       |
| `GET`  | `/heart-rates`         | List heart rate observations — supports `patientId`, `from`, `to`, `sort` (`asc`/`desc`), `limit` (1–1000, default 100) |

### Supported Apple Health metrics

The following record types are imported and stored as FHIR Observations with
their corresponding LOINC codes:

| Apple Health type                                | LOINC   | Description              |
| ------------------------------------------------ | ------- | ------------------------ |
| `HKQuantityTypeIdentifierHeartRate`              | 8867-4  | Heart rate               |
| `HKQuantityTypeIdentifierRestingHeartRate`       | 40443-4 | Resting heart rate       |
| `HKQuantityTypeIdentifierStepCount`              | 55423-8 | Step count               |
| `HKQuantityTypeIdentifierBodyMass`               | 29463-7 | Body weight              |
| `HKQuantityTypeIdentifierHeight`                 | 8302-2  | Height                   |
| `HKQuantityTypeIdentifierBloodPressureSystolic`  | 8480-6  | Systolic blood pressure  |
| `HKQuantityTypeIdentifierBloodPressureDiastolic` | 8462-4  | Diastolic blood pressure |
| `HKQuantityTypeIdentifierOxygenSaturation`       | 59408-5 | Oxygen saturation        |
| `HKQuantityTypeIdentifierBodyTemperature`        | 8310-5  | Body temperature         |
| `HKQuantityTypeIdentifierBloodGlucose`           | 15074-8 | Blood glucose            |

## Design notes

### Dependency injection

The API uses a lightweight, zero-dependency DI container (`packages/api/src/common/inject/container.ts`) based on a lazy `Proxy`. Dependencies are resolved on first access and cached as singletons. The container is fully type-safe: if a required provider is missing, TypeScript reports a compile-time error naming the missing key rather than a generic type mismatch.

This container is a proof of concept adapted from a side project. In a production setting it would be replaced by a battle-tested library (e.g. `tsyringe`, `awilix`), but the factory-based pattern it establishes — every service and route handler is a plain function that receives its dependencies as arguments — would remain unchanged and keeps unit testing trivial.

### Apple Health import pipeline

The import is a streaming pipeline to avoid loading potentially large exports into memory:

```
zip stream → unzipper → XmlTagStream → attachPatientRef → filterSupportedRecords → createObservations
```

Each stage has a single responsibility:

- **`XmlTagStream`** — Node.js `Transform` stream that uses a SAX parser to emit typed objects for `<Me>` and `<Record>` tags
- **`attachPatientRef`** — creates the FHIR Patient from `<Me>`, enforces ordering (throws if a Record appears before Me), and attaches the patient reference to every Record
- **`filterSupportedRecords`** — drops Record tags whose type is not in the supported metrics allowlist
- **`createObservations`** — maps remaining records to FHIR Observations and writes them to Medplum in batches of 100

The whole pipeline is wired with Node's `stream.pipeline` for correct back-pressure and cleanup.

### FHIR as the storage model

All health data is stored as standard FHIR resources (Patient, Observation) with LOINC codes via Medplum. This means the data is immediately interoperable with any FHIR-compatible system and the API layer is thin — it maps and validates, but Medplum owns persistence and querying.

## Open tasks

These are known gaps that would need to be addressed before a production deployment.

**API client generation** — the web package currently duplicates API types by hand. The intended solution is to expose an OpenAPI spec from the Fastify routes (via `@fastify/swagger` + `fastify-zod-openapi`, which works directly with the existing Zod schemas) and generate a typed client from it using `openapi-typescript` + `openapi-fetch`. The API contract becomes the single source of truth; the frontend can extend generated types locally for any UI-specific fields.

**Authentication and authorisation** — the API currently relies entirely on Medplum's machine-to-machine client credentials. There is no per-user authentication or request-level authorisation. A production deployment would add an auth layer (e.g. JWT middleware on the Fastify routes) so that users can only access their own data.

**Pagination** — patient and heart rate queries have a hard upper limit of 1 000 results. Large datasets require cursor-based pagination on both the API routes and the Medplum queries.

**Batch write error recovery** — if a Medplum batch write fails partway through an import, there is no rollback or retry. A partial import leaves orphaned Observations without a corresponding Patient. A production implementation would need idempotent writes or transactional rollback.

**Rate limiting and request hardening** — no rate limiting, no explicit request-size cap beyond the multipart config, no brute-force protection.

**Observability** — Fastify's built-in logger is enabled but there is no structured log format, distributed tracing, or metrics. A production setup would add structured logging (e.g. Pino JSON), a tracing layer (e.g. OpenTelemetry), and health-check endpoints.

**OpenAPI / Swagger docs** — Fastify with Zod can generate interactive API docs almost for free once `@fastify/swagger` is added (see API client generation above).

## Tech stack

| Layer    | Key libraries                                                          |
| -------- | ---------------------------------------------------------------------- |
| API      | Fastify 5, `@medplum/core`, Zod, `@fastify/multipart`, saxes, unzipper |
| Web      | React 19, Vite 8, MUI 6, MUI X-Charts, TanStack Query 5                |
| Testing  | Vitest 4, React Testing Library, MSW 2                                 |
| Monorepo | npm workspaces, Lerna 9, TypeScript 5, ESLint 9, Prettier              |
