# Provider Registration Onboarding

## Overview

Provider registration in WashOff is now a structured Arabic-first onboarding flow designed for
real operational review without changing the current approval or assignment model.

The provider still:

- submits a registration request
- remains `PendingApproval`
- does not participate in matching before admin approval
- still requires account activation after approval

## Registration Steps

1. **Basic Information**
   - laundry name
   - legal entity name
   - commercial registration number
   - tax registration number
   - city
   - business phone
   - business email
2. **Location**
   - map-based location selection
   - address text
   - stored latitude and longitude
3. **Services & Capacity**
   - supported services
   - optional additional services text
   - daily capacity in kg
   - pickup / execution / delivery SLA timing in hours
   - working days
   - working hours
4. **Documents**
   - commercial registration attachment
5. **Account Setup**
   - bank name
   - IBAN
   - bank account holder
   - account full name
   - account phone
   - account email

## File Rules

- supported formats: `PDF`, `JPG`, `PNG`
- max single file size: `5MB`
- commercial registration attachment is required
- file type and size are validated on both client and server

## Location Handling

- the location step uses a map picker
- the browser attempts to detect the current location automatically
- the user can adjust the marker manually on the map
- stored values remain:
  - `latitude`
  - `longitude`
  - `addressText`

## Admin Review

Admin onboarding review for providers now displays grouped sections for:

- entity information
- location and operating profile
- services and bank details
- commercial registration document

This keeps the existing approval workflow unchanged while making provider review more complete
and operationally useful.
