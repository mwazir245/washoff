# Platform Content Management

## Overview
Phase 18 adds an admin-only content management surface at `/admin/content`.

The goal is to let admin users update supported UI copy in Arabic and English without changing code, while keeping a safe fallback to default in-code values.

## Route
- `/admin/content`

## Supported model
The implementation adds:
- `platform_content_entries`
- `platform_content_audit`

Each managed content entry stores:
- page key
- section key
- content key
- composite key
- Arabic value
- English value
- content type
- active flag
- updated by
- updated at

## Current managed page groups
The first supported catalog covers:
- `landing`
- `auth_login`
- `onboarding_hotel`
- `onboarding_provider`
- `admin_dashboard`
- `admin_onboarding`
- `admin_settings`
- `admin_content`

This is an incremental content-management layer, not a claim that every string in the product is already DB-managed.

## Runtime behavior
Runtime page copy is resolved like this:
1. load managed content entries for the page and selected language
2. apply active overrides from the database
3. fall back to default in-code text for any missing key

This makes the feature safe to roll out gradually.

## API
- `GET /api/platform/admin/content`
- `PATCH /api/platform/admin/content/:id`
- `GET /api/platform/admin/content-audit`
- `GET /api/platform/content?page=<pageKey>&language=<ar|en>`

Admin routes are protected.
The public content read endpoint is intentionally read-only so supported pages can render managed copy without requiring authentication.

## Audit behavior
Each content update records:
- old Arabic value
- old English value
- new Arabic value
- new English value
- actor
- timestamp
- optional Arabic note

## Language behavior
The platform language selector currently supports:
- Arabic
- English

Managed content resolves to the selected language first, then falls back safely when a translated override is missing.

## Known scope
This phase establishes the content-management architecture and wires it into key pages. It does not mean every operational/domain string in the platform has already been externalized.
