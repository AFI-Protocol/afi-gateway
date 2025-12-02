# TSSD Vault Readiness Report

**Date:** 2025-11-29  
**Scope:** AFI Protocol Multi-Repo Workspace  
**Purpose:** Assess current state and design implications for TSSD Vault implementation

---

## 1. Overview

### Executive Summary

The AFI Protocol codebase demonstrates **significant preparatory work** for the TSSD Vault (Time-Series Signal Data Vault), with well-defined interfaces, comprehensive documentation, and clear architectural vision. However, the implementation is currently in a **transitional state** between design and production deployment.

**Key Findings:**

1. **Strong Foundation**: The TSSD Vault specification (`afi-infra/docs/TSSD_VAULT_SPEC.md`) is comprehensive, well-documented, and production-ready from a design perspective. The `VaultedSignalRecord` type system in `afi-infra/src/tssd/types.ts` (234 lines) provides a complete lifecycle model (RAW → ENRICHED → ANALYZED → SCORED → MINTED → REPLAYED).

2. **Multiple Competing Implementations**: There are **at least 4 different signal/vault type definitions** across repos, indicating schema drift and lack of canonical source:
   - `afi-infra/src/tssd/types.ts` - Comprehensive `VaultedSignalRecord` (canonical design)
   - `afi-reactor/types/VaultedSignal.ts` - Minimal 10-line stub
   - `afi-reactor/src/core/VaultService.ts` - Stub with "not implemented" errors
   - `afi-core/schemas/universal_signal_schema.ts` - Zod-based signal schema (39 lines)
   - `afi-reactor/agents/persistence/VaultedSignalStore.ts` - MongoDB time-series implementation (58 lines)

3. **In-Memory vs. Persistent**: The canonical `InMemoryTSSDVaultClient` (afi-infra) is production-quality code for dev/test, but **no production MongoDB implementation exists yet**. Multiple MongoDB stubs exist in afi-reactor but are disconnected from the canonical afi-infra types.

4. **Clear Governance**: The vault schema in `afi-config/schemas/vault.schema.json` (147 lines) provides excellent configuration governance, supporting MongoDB, PostgreSQL, TimescaleDB, and InfluxDB engines with retention policies and indexing strategies.

### Readiness Assessment

**Design Maturity:** ✅ **EXCELLENT** (9/10)  
**Implementation Maturity:** ⚠️ **EARLY** (3/10)  
**Integration Readiness:** ⚠️ **FRAGMENTED** (4/10)  
**Production Readiness:** ❌ **NOT READY** (1/10)

The TSSD Vault is **architecturally sound** but requires **consolidation, implementation, and integration work** before production deployment.

---

## 2. Per-Repo Snapshot

### 2.1 afi-core

**What Exists:**

- **Signal Schemas (Zod-based):**
  - `schemas/universal_signal_schema.ts` (39 lines) - Minimal signal schema with `content` field required by SignalScorer
  - `schemas/universal_signal_schema.backup.ts` (143 lines) - More comprehensive schema with `RawSignalSchema`, `EnrichedSignalSchema`, `AnalyzedSignalSchema`, `ScoredSignalSchema`
  - Pipeline stage schemas exist but are **disconnected from afi-infra's VaultedSignalRecord**

- **Environment Variables:**
  - `.env` contains `MONGODB_URI=mongodb://localhost:27017/afi_tssd` (only 2 lines in file)
  - Suggests intent to use MongoDB for TSSD but no implementation wired

- **Codex:**
  - `.afi-codex.json` lists "signal-validation", "validator-registry", "poi-validation" as provided services
  - **No mention of TSSD Vault, storage, or persistence** in codex

**What's Missing:**

- No vault client integration
- No references to `VaultedSignalRecord` or `ITSSDVaultClient` from afi-infra
- No storage adapters or repository interfaces
- Signal schemas are **not aligned** with afi-infra's lifecycle stage model
- No mention of time-series storage or replay capabilities

**Implications:**

afi-core appears to be **schema-focused** (validation, scoring) but **not storage-aware**. The signal schemas here are simpler and more focused on real-time validation than historical lifecycle tracking.

---

### 2.2 afi-reactor

**What Exists:**

- **Multiple Vault Implementations (Fragmented):**
  - `src/core/VaultService.ts` (43 lines) - Stub class with "not implemented" errors
  - `types/VaultedSignal.ts` (10 lines) - Minimal interface (signalId, score, timestamp, meta)
  - `agents/persistence/VaultedSignalStore.ts` (58 lines) - **Real MongoDB time-series implementation** using `mongodb` package
  - `plugins/tssd-vault-service.ts` (32 lines) - Simple MongoDB insert plugin

- **Replay Infrastructure:**
  - `ops/runner/replay-vault-signals.ts` (50 lines) - Calls `VaultService.queryVault()` and `VaultService.replaySignal()` (both throw "not implemented")
  - Script exists but **not functional** due to stub VaultService

- **DAG Configuration:**
  - `codex/dag.codex.json` (294 lines) - 15-node DAG with generators, analyzers, scorers
  - **No explicit vault/storage nodes** in DAG
  - No references to TSSD persistence in pipeline

- **MongoDB Usage:**
  - `agents/persistence/VaultedSignalStore.ts` creates MongoDB time-series collection `tssd_vault` with:
    - `timeField: 'timestamp'`
    - `metaField: 'meta'`
    - `granularity: 'minutes'`
  - Uses `MONGODB_URI` env var (defaults to `mongodb://localhost:27017`)
  - Database name: `afi_protocol`
  - Collection name: `tssd_vault`

- **Package Dependencies:**
  - `package.json` includes `mongodb: ^6.18.0` and `@types/mongodb: ^4.0.6`
  - ESM-first (`"type": "module"`)
  - Node target: ES2022

**What's Missing:**

- **No integration with afi-infra's canonical types** (`VaultedSignalRecord`, `ITSSDVaultClient`)
- VaultService is a stub, not a real implementation
- No connection between DAG pipeline and vault storage
- No lifecycle stage tracking (RAW → ENRICHED → ANALYZED → SCORED → MINTED → REPLAYED)
- Replay scripts exist but are non-functional

**Implications:**

afi-reactor has **multiple competing vault implementations** that are **not aligned**. The MongoDB time-series code in `agents/persistence/` is functional but uses a different schema than afi-infra's canonical design. This suggests **parallel development** without consolidation.

---

### 2.3 afi-infra

**What Exists:**

- **Canonical TSSD Vault Implementation:**
  - `docs/TSSD_VAULT_SPEC.md` (166 lines) - **Comprehensive specification** covering:
    - Purpose and lifecycle stages (RAW → ENRICHED → ANALYZED → SCORED → MINTED → REPLAYED)
    - Public vs. proprietary data separation
    - Training flags and model use cases
    - On-chain receipt integration
    - Future MongoDB implementation notes
  - `src/tssd/types.ts` (234 lines) - **Production-ready type definitions:**
    - `VaultedSignalRecord` - Canonical record structure
    - `SignalIdentity` - Global identification (signalId, epochId, market, timeframe, analystId, etc.)
    - Lifecycle snapshots: `RawSignalSnapshot`, `EnrichmentSnapshot`, `AnalysisSnapshot`, `ScoreSnapshot`, `MintSnapshot`, `OutcomeSnapshot`
    - `PublicSurfaceView` - Safe for receipts/explorers
    - `ProprietaryDetailView` - Analyst's private edge
    - `TrainingFlags` - Model training controls
  - `src/tssd/TSSDVaultClient.ts` (163 lines) - **Interface + in-memory implementation:**
    - `ITSSDVaultClient` interface with `upsert()`, `getBySignalId()`, `query()`, `listForTraining()`
    - `InMemoryTSSDVaultClient` - Fully functional dev/test implementation
    - `TSSDVaultQuery` - Filtering by analystId, strategyId, epochId, market, tags
  - `src/tssd/index.ts` (6 lines) - Clean public exports

- **Codex Governance:**
  - `.afi-codex.json` (92 lines) - Excellent module documentation:
    - Declares `afi-infra/tssd-vault` as "canonical_signal_vault"
    - Lists all exported types and interfaces
    - Notes: `inMemoryImplementation: true`, `mongoBackedPlanned: true`
    - Documentation reference: `docs/TSSD_VAULT_SPEC.md`

**What's Missing:**

- **No MongoDB implementation** (only in-memory)
- No actual deployment or service wrapper
- No REST API or gRPC interface for remote access
- No caching layer
- No access control or authentication
- No encryption for proprietary detail

**Implications:**

afi-infra is the **canonical home** for TSSD Vault types and interfaces. The design is **production-ready**, but the implementation is **dev/test only**. This is the **source of truth** that other repos should depend on.

---

### 2.4 afi-ops

**What Exists:**

- **Deployment Documentation:**
  - `docs/RUNBOOK_LOCAL_DEV.md` (296 lines) - Local development runbook
    - Mentions MongoDB requirement: `docker run -d -p 27017:27017 --name afi-mongo mongo:7`
    - Service startup order: afi-infra → afi-plugins → afi-reactor → afi-core
    - Notes T.S.S.D. Vault as part of afi-infra initialization
  - `docs/SLO_OVERVIEW.md` - Service level objectives
  - `docs/OPS_CHECKLISTS.md` - Operational checklists

- **Environment Variables:**
  - `.env.example` (4 lines):
    ```
    AFI_ENV=local
    DB_URI=mongodb://localhost:27017/afi
    AGENT_KEY=your-agent-key-here
    ```

- **Codex:**
  - `.afi-codex.json` (131 lines) - Operations toolkit
    - Lists MongoDB as external dependency (port 27017, required: true)
    - Managed services: afi-core (port 3000), afi-reactor (port 3001), afi-infra (no port)
    - Phase 1 constraints: scaffolding only, no real infra calls

**What's Missing:**

- No migration scripts for TSSD Vault schema
- No database seeding or cleanup scripts
- No smoke tests for vault operations
- No CI/CD integration for vault deployment

**Implications:**

afi-ops acknowledges MongoDB and TSSD Vault but has **no operational tooling** for vault management yet. This is expected for Phase 1 scaffolding.

---

### 2.5 afi-config

**What Exists:**

- **Vault Configuration Schema:**
  - `schemas/vault.schema.json` (147 lines) - **Excellent JSON Schema** for vault configuration:
    - Supports multiple engines: mongodb, postgresql, timescaledb, influxdb
    - Collection names: `signals` (default), `replays`, `metadata`
    - Retention policy configuration (enabled, retentionDays, archiveEnabled, archiveLocation)
    - Indexing configuration (signalId, timestamp, stage, custom indexes)
    - Replication configuration (enabled, replicas)
    - Signal schema reference: `afi.usignal.v1` (default)

- **Codex:**
  - `.afi-codex.json` (58 lines) - Config schema library
    - Provides: `vaultSchema`, `configSchemas`, `validationUtilities`
    - Consumers: afi-core, afi-reactor, afi-infra, afi-plugins, afi-ops, afi-token

**What's Missing:**

- No vault configuration templates (only schema)
- No validation utilities for vault configs
- No examples of vault.schema.json usage

**Implications:**

afi-config provides **governance** for vault configuration but no **implementation guidance**. The schema is well-designed and supports multiple database backends.

---

### 2.6 afi-skills

**What Exists:**

- **Vault Replay Skill:**
  - `skills/provenance/vault-replay-determinism.md` (183 lines) - **Comprehensive skill definition:**
    - Purpose: Verify deterministic replay of historical epochs
    - Inputs: epoch_id, original_outputs, replay_config
    - Outputs: determinism_result, diff_report
    - Allowed tools: `codex:replay`, `tssd:read`
    - Risk level: medium, determinism_required: true
    - Golden cases: `evals/provenance/vault-replay-determinism/golden_cases.json`

- **Codex:**
  - `.afi-codex.json` (32 lines) - Skill library
    - Provides: agent-skills, skill-library, skill-schemas
    - Consumers: afi-core, afi-reactor, afi-factory

**What's Missing:**

- No implementation of vault-replay-determinism skill (only spec)
- No other vault-related skills (e.g., vault-query, vault-audit, vault-export)

**Implications:**

afi-skills defines **provenance and replay requirements** for the vault but has **no implementations**. The skill spec assumes `tssd:read` tool exists (it doesn't yet).

---

### 2.7 afi-token

**What Exists:**

- **On-Chain Signal References:**
  - `src/AFIMintCoordinator.sol` - Uses `signalId` (bytes32) and `epochId` (uint256) in mint events
  - `src/TestCoreToken.sol` - `mintEmissions()` function takes `signalId` and `epoch` parameters
  - Emits `EmissionsMinted(to, amount, signalId, epoch, extraData)` event

- **Codex:**
  - `.afi-codex.json` (32 lines) - Token contracts
    - Provides: afi-token-contract, xerc20-implementation, emissions-logic
    - Foundry-based Solidity project, 58 tests passing

**What's Missing:**

- No off-chain vault integration (expected - contracts are on-chain only)
- No receipt metadata linking to vault records

**Implications:**

afi-token uses `signalId` and `epochId` as **breadcrumbs** to link on-chain receipts to off-chain vault records. This aligns with the TSSD Vault spec's "vault is the brain, receipt is the breadcrumb" model.

---

### 2.8 afi-factory

**What Exists:**

- **Codex:**
  - `.afi-codex.json` (32 lines) - Agent templates and versioning
    - Provides: agent-templates, agent-versioning, agent-spawning
    - Status: Phase 1 scaffolding, droid_ready: false

**What's Missing:**

- No vault-related agent templates
- No storage or persistence patterns

**Implications:**

afi-factory is **not involved** in vault design or implementation. This is expected.

---

## 3. TSSD-Relevant Artifacts

### 3.1 Key Schemas

| File Path | Lines | Description | Status |
|-----------|-------|-------------|--------|
| `afi-infra/src/tssd/types.ts` | 234 | **Canonical** VaultedSignalRecord, lifecycle snapshots, public/proprietary separation | ✅ Production-ready design |
| `afi-config/schemas/vault.schema.json` | 147 | Vault configuration schema (multi-engine, retention, indexing) | ✅ Production-ready |
| `afi-core/schemas/universal_signal_schema.ts` | 39 | Minimal Zod signal schema for validation | ⚠️ Not aligned with vault types |
| `afi-core/schemas/universal_signal_schema.backup.ts` | 143 | Comprehensive Zod schemas (Raw/Enriched/Analyzed/Scored) | ⚠️ Backup file, not canonical |
| `afi-reactor/types/VaultedSignal.ts` | 10 | Minimal stub (signalId, score, timestamp, meta) | ❌ Stub, not production-ready |

**Recommendation:** Consolidate on `afi-infra/src/tssd/types.ts` as the **single source of truth**. Deprecate or align other schemas.

---

### 3.2 Environment Variables

| Variable | Repos | Default | Usage |
|----------|-------|---------|-------|
| `MONGODB_URI` | afi-core, afi-reactor | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_URI` | afi-reactor | `mongodb://localhost:27017` | Alternate MongoDB connection string |
| `DB_URI` | afi-ops | `mongodb://localhost:27017/afi` | Generic database URI |

**Issues:**
- **Inconsistent naming**: `MONGODB_URI` vs `MONGO_URI` vs `DB_URI`
- **No database name in some defaults**: `afi-core/.env` uses `mongodb://localhost:27017/afi_tssd`, others don't specify database

**Recommendation:** Standardize on `MONGODB_URI` with explicit database name (e.g., `mongodb://localhost:27017/afi_tssd`).

---

### 3.3 Database Collections

| Collection Name | Repo | Database | Purpose | Time-Series? |
|-----------------|------|----------|---------|--------------|
| `tssd_vault` | afi-reactor | `afi_protocol` | Vaulted signal records | ✅ Yes (minutes granularity) |
| `tssd_signals` | afi-reactor | `afi` | Simple signal storage | ❌ No |
| `signals` | afi-config | (configurable) | Default collection name in vault.schema.json | ⚠️ Configurable |

**Issues:**
- **Naming inconsistency**: `tssd_vault` vs `tssd_signals` vs `signals`
- **Database inconsistency**: `afi_protocol` vs `afi` vs `afi_tssd`

**Recommendation:** Standardize on `tssd_vault` collection in `afi_tssd` database with time-series support.

---

### 3.4 Adapters & Interfaces

| File Path | Lines | Purpose | Reusability |
|-----------|-------|---------|-------------|
| `afi-infra/src/tssd/TSSDVaultClient.ts` | 163 | **ITSSDVaultClient interface** + InMemoryTSSDVaultClient | ✅ General, reusable interface |
| `afi-reactor/agents/persistence/VaultedSignalStore.ts` | 58 | MongoDB time-series insert function | ⚠️ Tightly bound to afi-reactor's VaultedSignal type |
| `afi-reactor/src/core/VaultService.ts` | 43 | Stub class with static methods | ❌ Stub, not reusable |
| `afi-reactor/plugins/tssd-vault-service.ts` | 32 | Simple MongoDB insert plugin | ⚠️ Plugin-specific, not general |

**Recommendation:**
- **Reuse `ITSSDVaultClient`** from afi-infra as the canonical interface
- **Implement `MongoTSSDVaultClient`** in afi-infra that implements `ITSSDVaultClient`
- **Deprecate** afi-reactor's VaultService stub and VaultedSignalStore (or refactor to use afi-infra types)

---

## 4. Design Implications for TSSD Vault

### 4.1 Natural Home for TSSD Vault

**Recommendation: afi-infra**

**Rationale:**
1. **Already the canonical source**: `afi-infra/src/tssd/` contains the most comprehensive types and documentation
2. **Codex alignment**: `.afi-codex.json` explicitly declares `afi-infra/tssd-vault` as "canonical_signal_vault"
3. **Separation of concerns**: afi-infra is infrastructure, not business logic (afi-reactor) or validation (afi-core)
4. **Dependency direction**: afi-reactor and afi-core can depend on afi-infra without circular dependencies

**Implementation Plan:**
1. Implement `MongoTSSDVaultClient` in `afi-infra/src/tssd/MongoTSSDVaultClient.ts`
2. Export from `afi-infra/src/tssd/index.ts`
3. Update afi-reactor to import and use `ITSSDVaultClient` from afi-infra
4. Deprecate afi-reactor's VaultService and VaultedSignalStore

---

### 4.2 Gotchas and Constraints

#### 4.2.1 TypeScript Configuration Differences

| Repo | strict | moduleResolution | Target | Notes |
|------|--------|------------------|--------|-------|
| afi-core | ✅ true | Bundler | ES2022 | Strictest config, noUnusedLocals, noUnusedParameters |
| afi-reactor | ❌ false | node | ES2022 | Loose config, allows `any` types |
| afi-infra | (not examined) | (not examined) | (not examined) | Likely similar to afi-core |

**Implication:** Code written in afi-infra with strict TypeScript may not compile in afi-reactor without fixes. Need to ensure afi-reactor's tsconfig is compatible.

---

#### 4.2.2 ESM vs CJS

**All repos use ESM** (`"type": "module"` in package.json). This is **good** for consistency but requires:
- All imports must use `.js` extensions (even for `.ts` files)
- No `require()` calls
- `ts-node` must use `esm: true` mode

**No issues expected** as long as all repos maintain ESM-first approach.

---

#### 4.2.3 MongoDB Version Compatibility

- **afi-reactor** uses `mongodb: ^6.18.0` (latest)
- **Time-series collections** require MongoDB 5.0+ (supported)
- **No version conflicts** expected

---

#### 4.2.4 Schema Drift and Naming Collisions

**Critical Issues:**

1. **VaultedSignal vs VaultedSignalRecord**:
   - afi-reactor uses `VaultedSignal` (10 lines, minimal)
   - afi-infra uses `VaultedSignalRecord` (comprehensive)
   - **Collision risk**: If both are imported, which one is used?

2. **Signal lifecycle stages**:
   - afi-core backup schema: `RawSignalSchema`, `EnrichedSignalSchema`, `AnalyzedSignalSchema`, `ScoredSignalSchema`
   - afi-infra types: `RawSignalSnapshot`, `EnrichmentSnapshot`, `AnalysisSnapshot`, `ScoreSnapshot`
   - **Naming mismatch**: "Signal" vs "Snapshot", "Enriched" vs "Enrichment"

3. **signalId type**:
   - afi-infra: `signalId: string` (TypeScript)
   - afi-token: `signalId: bytes32` (Solidity)
   - **Type mismatch**: Need conversion between string and bytes32

**Recommendations:**
- **Deprecate** afi-reactor's `VaultedSignal` type
- **Align** afi-core schemas with afi-infra snapshot types
- **Document** signalId conversion between TypeScript (string) and Solidity (bytes32)

---

#### 4.2.5 Deployment Expectations

**Current State:**
- **No microservices architecture** (yet)
- **No containerization** (except MongoDB via Docker)
- **No Kubernetes** (yet)
- **Local development only** (Phase 1 scaffolding)

**Future State (Implied by afi-ops docs):**
- **Service-oriented**: afi-core, afi-reactor, afi-infra as separate services
- **MongoDB as external dependency** (port 27017)
- **No mention of vault as standalone service** (likely embedded in afi-infra or afi-reactor)

**Implication:** TSSD Vault will likely be a **library** (not a service) initially, embedded in afi-reactor or afi-infra. Future microservices architecture may require REST/gRPC API.

---

#### 4.2.6 Testing & CI Patterns

**Current State:**
- **afi-reactor** has 3 test files:
  - `test/executePipeline.test.ts`
  - `test/dagSimulation.test.ts`
  - `test/vaultInsert.test.ts` (placeholder only, 2 lines)
- **afi-token** has 58 passing Foundry tests
- **No integration tests** for vault operations
- **No CI/CD** for vault deployment

**Implication:** Need to add:
- Unit tests for `MongoTSSDVaultClient`
- Integration tests for vault + DAG pipeline
- Smoke tests for vault operations (similar to afi-eliza-gateway's offline telemetry smoke test)

---

## 5. Open Questions / TODOs

### 5.1 Database Selection

**Q1: MongoDB vs. PostgreSQL vs. TimescaleDB vs. InfluxDB?**

- **Current state**: MongoDB is assumed (env vars, code stubs)
- **afi-config vault.schema.json** supports all 4 engines
- **Considerations**:
  - MongoDB: Native time-series collections (5.0+), flexible schema, good for unstructured data
  - PostgreSQL + TimescaleDB: Better for structured data, SQL queries, ACID guarantees
  - InfluxDB: Purpose-built for time-series, excellent compression, limited query flexibility
- **Recommendation**: Start with **MongoDB** (already in use), evaluate TimescaleDB for production if SQL queries are needed

---

### 5.2 Collection Strategy

**Q2: Single collection vs. per-stage collections?**

- **Option A: Single collection** (`tssd_vault`)
  - All lifecycle stages in one document (afi-infra's `VaultedSignalRecord` model)
  - Pros: Atomic updates, single source of truth, simpler queries
  - Cons: Large documents, potential performance issues with many stages

- **Option B: Per-stage collections** (`tssd_raw`, `tssd_enriched`, `tssd_analyzed`, etc.)
  - Separate collections for each lifecycle stage
  - Pros: Smaller documents, easier to scale, stage-specific indexing
  - Cons: Complex joins, potential consistency issues, harder to query full lifecycle

- **Recommendation**: **Single collection** (Option A) for MVP, evaluate per-stage collections if performance becomes an issue

---

### 5.3 Retention Policy

**Q3: How long should vault data be retained?**

- **Current state**: `afi-config/schemas/vault.schema.json` has `retentionPolicy` config but no defaults
- **Considerations**:
  - **Training data**: May need years of historical data
  - **Audit trail**: Regulatory requirements may dictate retention
  - **Storage costs**: Time-series data grows quickly
  - **Archival**: Cold storage for old data (S3, Glacier)
- **Recommendation**: Define retention tiers:
  - **Hot** (0-30 days): Full data in MongoDB
  - **Warm** (30-365 days): Compressed data in MongoDB
  - **Cold** (365+ days): Archived to S3/Glacier, queryable via separate service

---

### 5.4 Replay Semantics

**Q4: What does "replay" mean for TSSD Vault?**

- **Current state**: `afi-reactor/ops/runner/replay-vault-signals.ts` exists but is non-functional
- **Possible interpretations**:
  - **Re-execute pipeline**: Re-run RAW → ENRICHED → ANALYZED → SCORED with same inputs
  - **Outcome evaluation**: Compare predicted vs. actual outcomes (REPLAYED stage)
  - **Determinism check**: Verify bit-for-bit identical results (afi-skills vault-replay-determinism)
- **Recommendation**: Support **all three** with different replay modes:
  - `replay --mode=re-execute` - Re-run pipeline
  - `replay --mode=evaluate` - Compare outcomes
  - `replay --mode=determinism` - Verify determinism

---

### 5.5 Public vs. Proprietary Data Separation

**Q5: How is proprietary data protected?**

- **Current state**: `afi-infra/src/tssd/types.ts` has `ProprietaryDetailView` but no encryption
- **Considerations**:
  - **Encryption at rest**: MongoDB encryption, field-level encryption
  - **Access control**: Role-based access control (RBAC) for proprietary fields
  - **Anonymization**: Remove PII before training
- **Recommendation**: Implement **field-level encryption** for `proprietaryDetail` using MongoDB's Client-Side Field Level Encryption (CSFLE)

---

### 5.6 Training Data Export

**Q6: How is training data exported for model training?**

- **Current state**: `ITSSDVaultClient.listForTraining()` exists but no export format defined
- **Considerations**:
  - **Format**: JSON, CSV, Parquet, TFRecord
  - **Anonymization**: Remove analyst IDs, proprietary notes
  - **Sampling**: Random sampling, stratified sampling, time-based sampling
- **Recommendation**: Support **multiple export formats**:
  - JSON for ad-hoc analysis
  - Parquet for large-scale training (efficient compression, columnar storage)
  - CSV for compatibility with legacy tools

---

### 5.7 Schema Versioning

**Q7: How are schema changes handled?**

- **Current state**: `afi-config/schemas/vault.schema.json` has `signalSchema: "afi.usignal.v1"` but no versioning strategy
- **Considerations**:
  - **Backward compatibility**: Old records must be readable
  - **Migration**: How to migrate old records to new schema
  - **Validation**: Reject records that don't match schema
- **Recommendation**: Implement **schema versioning**:
  - Store schema version in each `VaultedSignalRecord` (e.g., `schemaVersion: "1.0.0"`)
  - Support multiple schema versions simultaneously
  - Provide migration scripts for major version changes

---

### 5.8 Indexing Strategy

**Q8: What indexes are needed for efficient queries?**

- **Current state**: `afi-config/schemas/vault.schema.json` mentions indexing but no specific indexes defined
- **Common queries** (inferred from `ITSSDVaultClient` interface):
  - `getBySignalId(signalId)` - Unique index on `signalId`
  - `query({ epochId })` - Index on `epochId`
  - `query({ analystId })` - Index on `analystId`
  - `query({ market, timeframe })` - Compound index on `market`, `timeframe`
  - `listForTraining({ tags })` - Index on `publicSurface.tags`
- **Recommendation**: Create indexes:
  - **Unique**: `signalId`
  - **Single-field**: `epochId`, `analystId`, `strategyId`, `market`, `createdAt`, `updatedAt`
  - **Compound**: `(market, timeframe)`, `(epochId, analystId)`
  - **Array**: `publicSurface.tags`

---

### 5.9 Concurrency and Locking

**Q9: How are concurrent updates handled?**

- **Current state**: No locking or concurrency control in `InMemoryTSSDVaultClient`
- **Scenarios**:
  - Multiple DAG nodes updating same signal at different stages
  - Replay updating REPLAYED stage while pipeline is still running
- **Recommendation**: Use **optimistic locking** with `updatedAt` timestamp:
  - Check `updatedAt` before update
  - Reject update if `updatedAt` has changed (conflict)
  - Retry with exponential backoff

---

### 5.10 Monitoring and Observability

**Q10: How is vault health monitored?**

- **Current state**: No monitoring or observability
- **Metrics needed**:
  - **Throughput**: Signals/second inserted, queried
  - **Latency**: p50, p95, p99 for upsert, query
  - **Storage**: Database size, collection size, index size
  - **Errors**: Failed inserts, query timeouts, schema validation errors
- **Recommendation**: Integrate with **Prometheus + Grafana**:
  - Expose metrics endpoint from vault client
  - Create Grafana dashboard for vault health
  - Set up alerts for high latency, errors, storage growth

---

## 6. Summary and Next Steps

### 6.1 Key Takeaways

1. **Strong design foundation**: afi-infra has excellent TSSD Vault types and documentation
2. **Fragmented implementation**: Multiple competing implementations across repos need consolidation
3. **Schema drift**: Signal schemas in afi-core, afi-reactor, afi-infra are not aligned
4. **No production persistence**: Only in-memory implementation exists, MongoDB stubs are incomplete
5. **Clear governance**: afi-config provides excellent configuration schema for multi-engine support

### 6.2 Recommended Implementation Roadmap

**Phase 1: Consolidation (1-2 weeks)**
1. ✅ Adopt `afi-infra/src/tssd/types.ts` as canonical schema
2. ✅ Deprecate afi-reactor's `VaultedSignal` type
3. ✅ Align afi-core signal schemas with afi-infra lifecycle stages
4. ✅ Standardize environment variables (`MONGODB_URI`, database: `afi_tssd`, collection: `tssd_vault`)

**Phase 2: MongoDB Implementation (2-3 weeks)**
1. ✅ Implement `MongoTSSDVaultClient` in afi-infra
2. ✅ Add unit tests for `MongoTSSDVaultClient`
3. ✅ Add integration tests with afi-reactor DAG pipeline
4. ✅ Create MongoDB indexes (signalId, epochId, analystId, market, tags)
5. ✅ Implement time-series collection with proper granularity

**Phase 3: Integration (1-2 weeks)**
1. ✅ Wire `MongoTSSDVaultClient` into afi-reactor DAG pipeline
2. ✅ Add vault storage nodes to DAG (after SCORED stage)
3. ✅ Implement replay functionality in `VaultService`
4. ✅ Add smoke tests for vault operations

**Phase 4: Production Hardening (2-3 weeks)**
1. ✅ Implement field-level encryption for proprietary data
2. ✅ Add retention policy enforcement
3. ✅ Implement schema versioning
4. ✅ Add monitoring and observability (Prometheus metrics)
5. ✅ Create operational runbooks for vault management

**Phase 5: Advanced Features (3-4 weeks)**
1. ✅ Implement training data export (JSON, Parquet, CSV)
2. ✅ Add archival to S3/Glacier for cold storage
3. ✅ Implement deterministic replay validation
4. ✅ Add REST/gRPC API for remote access (if microservices architecture is adopted)

---

## 7. Appendix: File Inventory

### Files Examined (by repo)

**afi-core** (6 files):
- `.afi-codex.json`, `.env`, `package.json`, `tsconfig.json`
- `schemas/universal_signal_schema.ts`, `schemas/universal_signal_schema.backup.ts`

**afi-reactor** (12 files):
- `.afi-codex.json`, `package.json`, `tsconfig.json`
- `src/core/VaultService.ts`, `types/VaultedSignal.ts`
- `agents/persistence/VaultedSignalStore.ts`, `plugins/tssd-vault-service.ts`
- `ops/runner/replay-vault-signals.ts`, `codex/dag.codex.json`
- `test/vaultInsert.test.ts`, `test/executePipeline.test.ts`, `test/dagSimulation.test.ts`

**afi-infra** (5 files):
- `.afi-codex.json`
- `docs/TSSD_VAULT_SPEC.md`
- `src/tssd/types.ts`, `src/tssd/TSSDVaultClient.ts`, `src/tssd/index.ts`

**afi-ops** (3 files):
- `.afi-codex.json`, `.env.example`
- `docs/RUNBOOK_LOCAL_DEV.md`

**afi-config** (2 files):
- `.afi-codex.json`
- `schemas/vault.schema.json`

**afi-skills** (2 files):
- `.afi-codex.json`
- `skills/provenance/vault-replay-determinism.md`

**afi-token** (3 files):
- `.afi-codex.json`
- `src/AFIMintCoordinator.sol`, `src/TestCoreToken.sol`

**afi-factory** (1 file):
- `.afi-codex.json`

**Total: 34 files examined**

---

**End of Report**

