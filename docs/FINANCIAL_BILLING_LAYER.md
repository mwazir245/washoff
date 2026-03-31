# Financial Billing Layer

Phase 19 adds a finance layer to WashOff without changing the core product model. The platform still assigns providers automatically, hotels do not pay providers directly, and provider settlements remain platform-managed.

## Scope

- Daily hotel invoices
- Daily provider settlement statements
- VAT-aware calculations at 15%
- Admin finance visibility and finance actions
- Hotel/provider finance visibility with role separation

## Finance Trigger

Finance generation starts only when an order reaches `Completed`.

At completion time the system:

1. locks hotel-side financial snapshots on the order
2. locks provider-side financial snapshots on the order
3. links the order to the hotel's daily invoice for that completion date
4. links the order to the provider's daily settlement statement for that completion date

The flow is idempotent-safe. A completed order cannot be added twice to the same daily finance document.

## Pricing Sources

### Hotel pricing

Hotel billing uses hotel-facing platform pricing. This is treated as ex-VAT pricing and is the source of truth for hotel invoices.

### Provider pricing

Provider settlements use the provider's approved active offering price. This is treated as ex-VAT pricing and is the source of truth for provider statements.

These two pricing sources are intentionally separated. The platform may derive internal margin, but that difference is not exposed to hotels or providers.

## VAT Treatment

- VAT rate: `15%`
- Stored prices are treated as `EX VAT`
- `vatAmount = subtotalExVat * 0.15`
- `totalIncVat = subtotalExVat + vatAmount`
- Rounding strategy: amounts are normalized to two decimal places at line level and aggregate level

The same VAT treatment is applied consistently to:

- order-level hotel snapshots
- order-level provider snapshots
- hotel daily invoices
- provider daily settlement statements

## Order-Level Financial Snapshot

Each completed order stores immutable financial snapshots for both directions:

### Hotel side

- line-level quantities and hotel unit prices
- `hotelSubtotalExVat`
- `hotelVatAmount`
- `hotelTotalIncVat`

### Provider side

- line-level quantities and provider unit prices
- `providerSubtotalExVat`
- `providerVatAmount`
- `providerTotalIncVat`

### Linking fields

- `hotelInvoiceId`
- `providerStatementId`
- `billedAt`
- `settledAt`

These snapshots ensure future pricing changes do not affect historic completed orders.

## Hotel Daily Invoice

Each hotel receives one daily invoice per date containing all completed orders for that day.

### Header fields

- `invoiceNumber`
- `hotelId`
- `invoiceDate`
- `currencyCode`
- `status`
- `orderCount`
- `subtotalExVat`
- `vatAmount`
- `totalIncVat`
- `issuedAt`
- `collectedAt`
- `collectedByAccountId`

### Statuses

- `Issued`
- `Collected`

### Line-level linkage

Each invoice line links back to a single order and stores:

- `orderId`
- `roomNumber`
- `orderSubtotalExVat`
- `orderVatAmount`
- `orderTotalIncVat`

## Provider Daily Settlement Statement

Each provider receives one daily settlement statement per date containing all completed orders for that day.

### Header fields

- `statementNumber`
- `providerId`
- `statementDate`
- `currencyCode`
- `status`
- `orderCount`
- `subtotalExVat`
- `vatAmount`
- `totalIncVat`
- `paidAt`
- `paidByAccountId`

### Statuses

- `PendingPayment`
- `Paid`

### Line-level linkage

Each statement line links back to a single order and stores:

- `orderId`
- `roomNumber`
- `providerSubtotalExVat`
- `providerVatAmount`
- `providerTotalIncVat`

## Role-Based Visibility

### Hotel users

Hotel users can:

- view daily hotel invoices
- open invoice details
- trace invoices back to included orders and room numbers
- see subtotal, VAT, total, and collection status

Hotel users cannot see:

- provider settlement values
- provider unit prices
- platform margin

### Provider users

Provider users can:

- view daily settlement statements
- open statement details
- trace statements back to included orders and room numbers
- see subtotal, VAT, total, and payment status

Provider users cannot see:

- hotel invoice values
- hotel pricing
- platform margin

### Admin users

Admin users can:

- view finance summary KPIs
- list hotel invoices
- list provider statements
- filter by party, status, and date
- open invoice and statement details
- mark hotel invoices as collected
- mark provider statements as paid
- trace each order to both financial documents

## Admin Finance Operations

Admin finance routes:

- `/admin/finance`

The finance area provides:

- hotel invoice list and details
- provider statement list and details
- finance KPIs:
  - today hotel invoice total
  - today provider statement total
  - gross margin ex VAT
  - output VAT total
  - input VAT total
  - net VAT position

## What Remains for Future Phases

- PDF invoice and statement generation
- Saudi ZATCA integration
- online payment gateways
- richer collection methods and reconciliation
- advanced settlement cycles beyond daily statements
- accounting exports and ledger integrations

## Business Model Integrity

Phase 19 does not change:

- matching logic
- assignment or reassignment logic
- onboarding or approval rules
- account identity flow
- execution lifecycle logic
- the non-marketplace WashOff model
