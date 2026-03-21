# Platform Settings

## Overview
Phase 17 adds an admin-only settings surface at `/admin/settings` for safe platform configuration.

The page is designed for:
- visible platform identity
- support contact details
- safe registration controls
- runtime visibility
- settings audit review

It is explicitly **not** designed for infrastructure secrets. Database URLs, SMTP passwords, OAuth secrets, and other sensitive runtime credentials remain managed through environment variables.

## Route
- `/admin/settings`

## Data model
The implementation adds:
- `platform_settings`
- `platform_settings_audit`

The primary editable fields are:
- `site_name_ar`
- `site_name_en`
- `site_tagline_ar`
- `site_tagline_en`
- `mail_from_name_ar`
- `mail_from_email`
- `support_email`
- `support_phone`
- `registration_enabled`
- `hotel_registration_enabled`
- `provider_registration_enabled`
- `require_admin_approval_for_hotels`
- `require_admin_approval_for_providers`

## Runtime visibility
The settings page also shows a runtime snapshot returned by the backend, including:
- active environment
- persistence mode
- database target label
- mail mode
- worker enabled state
- request-time sweep state
- auth mode
- public application URL

This runtime block is read-only.

## API
- `GET /api/platform/admin/settings`
- `PATCH /api/platform/admin/settings`
- `GET /api/platform/admin/settings/runtime`
- `GET /api/platform/admin/settings/audit`

All endpoints are admin-only.

## Audit behavior
Every settings update records an audit entry with:
- changed key
- old value snapshot
- new value snapshot
- actor
- timestamp
- optional Arabic note

## Safety rules
Editable from the UI:
- branding identity
- sender identity
- support contact details
- safe registration flags

Not editable from the UI:
- database connection secrets
- SMTP credentials
- OAuth secrets
- internal API keys

## Fallback behavior
If platform settings do not exist yet, the backend seeds a default row automatically when the admin settings or content features are accessed.
