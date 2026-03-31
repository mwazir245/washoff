# Provider Service Catalog & Pricing Approval

## Overview

WashOff now uses a platform-managed product × service-type matrix instead of provider-defined free-text services.

The business model is unchanged:

- WashOff is not a marketplace
- hotels do not choose providers manually
- only approved providers with approved active offerings participate operationally

## Platform service model

### Fixed service types

- غسيل جاف
- كوي
- غسيل وكوي

### Standardized products

Products are seeded from the approved platform list and normalized for clean Arabic naming. Duplicate names are removed during normalization.

### Product × service matrix

Each matrix row represents one operational combination:

- `productId`
- `serviceTypeId`
- `pricingUnit`
- `suggestedPriceSar`
- `isAvailable`
- `active`

If the source pricing sheet had `-` for a combination, the row is created as unavailable/inactive and is not exposed operationally.

## Suggested pricing

The seeded pricing sheet is stored as suggested platform pricing only.

- It is visible to admin
- it may be shown to providers as a reference
- it is not forced as the provider's operational price

## Provider pricing lifecycle

Providers select only active platform-managed combinations and submit pricing per combination.

Lifecycle:

1. First submission creates a provider offering with:
   - `currentStatus = inactive`
   - `proposedStatus = pending_approval`
2. Admin approval moves the proposed price into:
   - `currentApprovedPriceSar`
   - `currentStatus = active`
3. If a provider edits an already approved price:
   - the existing approved price remains active
   - the new price becomes a pending proposal
4. If admin rejects a proposal:
   - the old approved price remains active
   - the proposal becomes `rejected`
   - `rejectionReasonAr` may be stored

## Admin workflows

### Platform catalog

Route:

- `/admin/services`

Admin can:

- view products
- view fixed service types
- review the matrix
- add products
- activate/deactivate products
- activate/deactivate matrix combinations
- adjust suggested pricing

### Provider pricing review

Route:

- `/admin/provider-pricing`

Admin can:

- review pending provider price proposals
- compare proposed vs suggested price
- compare proposed vs current approved price
- approve or reject proposals
- record an Arabic rejection reason

## Provider workflows

### Registration

Provider registration no longer accepts arbitrary free-text service names.

The provider services step now loads only active catalog combinations and submits pricing entries in matrix form.

### Dashboard management

Providers can later:

- view active approved prices
- view pending proposals
- see rejected proposals
- submit price changes for review
- add new offerings where the platform matrix allows them

## Hotel-facing behavior

Hotels see only standardized platform products and service types.

Operational service visibility is based on:

- active platform matrix rows
- available matrix rows
- provider offerings with:
  - `currentStatus = active`
  - an approved current price

Pending or rejected provider proposals do not affect hotel-facing pricing or service visibility.

## Matching integration

Matching philosophy and score weights are unchanged.

Only the capability source changed:

- provider capabilities are now derived from approved active provider offerings
- a provider is eligible only if they have an approved active offering for the requested matrix row
- pending/rejected proposals are ignored by matching

## Persistence

Main schema additions/refactors:

- `platform_products`
- enriched `services` rows to represent matrix combinations
- enriched `provider_capabilities` rows to store current approved price, proposed price, approval status, and review metadata

The same conceptual model is supported across:

- preview mode
- file mode
- DB mode

## Tests

Focused coverage now includes:

- product-name normalization
- unavailable matrix rows
- admin matrix activation/deactivation
- provider initial pricing submissions defaulting to pending approval
- rejection preserving the old approved price
- hotel-facing catalog ignoring pending-only offerings
- workflow protection against unapproved provider pricing participation
