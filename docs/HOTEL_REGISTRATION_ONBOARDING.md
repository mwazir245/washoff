# Hotel Registration Onboarding

## Overview
WashOff now uses a structured multi-step hotel onboarding flow designed for real operational review before admin approval.

The current hotel registration journey is:

1. Basic hotel information
2. Operational profile
3. Location and logistics
4. Documents
5. Account and contact information

The existing approval and activation lifecycle remains unchanged:

- hotel registration is submitted as `PendingApproval`
- admin reviews the onboarding data
- approval enables account activation
- activation is still required before operational access

## Required Fields

### Basic information
- `hotelName`
- `city`
- `hotelClassification`
- `roomCount`
- `taxRegistrationNumber`
- `commercialRegistrationNumber`

### Operational profile
- `serviceLevel`
- `operatingHours`
- `requiresDailyPickup`

### Location and logistics
- `addressText`
- `latitude`
- `longitude`
- `hasLoadingArea`

### Documents
- `commercialRegistrationFile`

### Contact / account
- `contactPersonName`
- `contactEmail`
- `contactPhone`

## Optional Fields
- `legalEntityName`
- `pickupLocation`
- `accessNotes`
- `delegationLetterFile`
- `notesAr`

## City Selection
City is no longer free text. The registration form now requires choosing from a curated Arabic list of major Saudi cities.

This improves review quality and keeps onboarding data consistent.

## Location Capture
Location now uses a map-based picker instead of manual coordinate entry.

Behavior:
- when the location step opens, the browser tries to detect the user's current location
- if permission is granted, the map centers on that location and uses it as the initial selected point
- the user can still change the point manually by clicking on the map
- if permission fails, the user can select the location manually on the map

Stored location data remains:
- `addressText`
- `latitude`
- `longitude`

Arabic helper text in the product:

> حدد موقع الفندق على الخريطة. سيتم استخدام الموقع لتسهيل التشغيل والاستلام.

## File Upload Rules
The registration flow supports two document types:

- Commercial registration attachment
- Delegation letter attachment

### Allowed formats
- PDF
- JPG / JPEG
- PNG

### Limits
- Maximum per file: `5MB`
- Maximum total registration documents size: `10MB`

### Validation
Validation is enforced at two levels:

- client-side validation in the hotel registration form
- server-side validation before storing and persisting references

The backend validates:

- file type compatibility
- binary signature for PDF / JPEG / PNG
- actual file size
- total combined upload size

## Delegation Letter
`delegationLetterFile` remains optional during initial registration.

Its purpose is to prove that the registering user is authorized by the hotel to use WashOff.

Arabic description used in the product:

> خطاب رسمي من الفندق يفوض المستخدم باستخدام منصة WashOff

Current delegation statuses:

- `not_provided`
- `pending_review`
- `approved`
- `rejected`

During this phase, delegation status is stored and visible for review while keeping room for stricter future enforcement without changing the current approval model.

## What Admin Sees During Review
Admin onboarding review is grouped into readable sections:

- Account and contact
- Basic hotel information
- Operational profile
- Location and logistics
- Documents and compliance

Admin can review:

- selected city
- legal entity name
- hotel classification and room count
- tax registration number
- commercial registration number
- service level and operating hours
- address and stored coordinates
- commercial registration attachment
- delegation letter attachment and delegation status
- contact details

Approval and rejection actions remain unchanged.

## What Stayed Unchanged
This onboarding refinement does **not** change:

- matching logic
- assignment logic
- reassignment logic
- worker behavior
- approval gating
- activation and identity lifecycle rules

It only refines hotel registration structure, validation, storage shape, and admin review quality.
