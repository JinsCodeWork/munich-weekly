# Frontend Refactor Plan Summary

Class: Historical
Owner: Frontend maintainer
Superseded by: [Refactor Baseline](../refactor-baseline.md),
[Frontend Architecture](../frontend-architecture.md), and current frontend code.

## Purpose

This file summarizes the May 2026 frontend refactor plan. The detailed
step-by-step execution notes are intentionally not retained here; shipped work
should be understood from the current code, commits, and live reference docs.

## Original Goals

- Reduce duplicate UI, hook, and inline page logic.
- Keep visible behavior and API contracts stable.
- Move repeated admin and submission UI toward shared components.
- Keep risky contracts such as `fetchAPI`, auth state, and gallery DTOs stable.

## Useful Remaining Lessons

1. Treat [Refactor Baseline](../refactor-baseline.md) as the historical guardrail
   record for frontend contract preservation.
2. Prefer small, verifiable frontend refactors over broad rewrites.
3. Do not change API contracts while cleaning UI or hooks unless the API change
   is explicitly planned and documented.
4. Keep frontend API layer changes aligned with [API Reference](../api.md) and
   generated `docs/api.json`.

## Current References

- [Frontend Overview](../frontend-overview.md)
- [Frontend Architecture](../frontend-architecture.md)
- [UI Component Library](../ui-components.md)
- [Style System](../style-system.md)
- [Refactor Baseline](../refactor-baseline.md)
