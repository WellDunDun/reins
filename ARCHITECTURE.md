# Architecture — porto-v2

## Domain Map

<!-- List your business domains here. Each domain follows the layered architecture. -->

| Domain | Description | Quality Grade |
|--------|-------------|---------------|
| Core | Core business logic | — |
| Auth | Authentication and authorization | — |
| UI | User interface components | — |

## Layered Architecture

Each domain follows a strict layer ordering. Dependencies flow forward only.

```
Utils
  |
  v
Business Domain
  +-- Types --> Config --> Repo --> Service --> Runtime --> UI
  |
  +-- Providers (cross-cutting: auth, connectors, telemetry, feature flags)
        |
        v
      App Wiring + UI
```

### Layer Definitions

| Layer | Responsibility | May Import From |
|-------|---------------|-----------------|
| Types | Data shapes, enums, interfaces | Utils |
| Config | Configuration loading, validation | Types, Utils |
| Repo | Data access, storage | Config, Types, Utils |
| Service | Business logic orchestration | Repo, Config, Types, Utils |
| Runtime | Process lifecycle, scheduling | Service, Config, Types, Utils |
| UI | User-facing presentation | Runtime, Service, Types, Utils |
| Providers | Cross-cutting adapters | Any layer (explicit interface) |

### Enforcement

These rules are enforced mechanically:
- [ ] Custom linter for import direction (TODO: implement)
- [ ] Structural tests for layer violations (TODO: implement)
- [ ] CI gate that fails on violations (TODO: implement)

## Package Structure

```
src/
  domains/
    [domain-name]/
      types/
      config/
      repo/
      service/
      runtime/
      ui/
      providers/
  utils/
  shared/
```
