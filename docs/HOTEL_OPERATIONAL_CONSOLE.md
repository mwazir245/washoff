# Hotel Operational Console

## Model

WashOff treats the hotel as an operational console user, not an end-customer shopper.

The hotel workflow is:

1. receive garments from the guest
2. create the platform order by room number
3. track provider execution
4. receive the completed order from the assigned provider
5. hand the order back to the guest

The hotel does not choose providers manually. Matching and assignment remain automatic.

## Order Identity

Hotel orders now use `roomNumber` as the primary operational identifier in the hotel flow.

The hotel order entry no longer depends on any guest-name style input.

## Order Entry

Hotel order entry uses a matrix based on the platform-managed catalog.

Rows:
- standardized products

Columns:
- `كوي`
- `غسيل وكوي`
- `غسيل جاف`

The visible order of service columns is fixed in the hotel experience and `غسيل جاف` always appears last.

The hotel enters quantities directly per valid product × service combination.

## Visible Service Filtering

The hotel sees only operationally available combinations.

A combination is visible only when:

- the platform matrix row is active
- the platform matrix row is available
- at least one provider has an approved active offering for that combination

Pending or rejected provider prices are not shown to the hotel and do not affect hotel order entry.

## Submission Shape

Hotel orders submit canonical catalog references only.

The payload shape is:

```ts
{
  roomNumber: string;
  items: Array<{
    serviceId: string;
    quantity: number;
  }>;
  pickupAt: string;
  notes?: string;
}
```

No legacy free-text services or legacy display labels are used in submission.

## Hotel Dashboard

The hotel dashboard is designed for operational volume and daily work.

It includes:

- KPI summary row
- table-based order management
- search
- status/provider/date filters
- pagination
- order details drawer

The hotel view intentionally hides:

- matching transparency
- provider scoring
- admin monitoring details
- commission display

## Order Details

The hotel order details drawer shows:

- order summary
- room number
- assigned provider
- item breakdown
- execution timeline
- final hotel action when available

## Execution Tracking

The hotel sees a readable lifecycle timeline based on stored status history:

- تم إنشاء الطلب
- تم الإسناد
- تم القبول
- تم جدولة الاستلام
- تم الاستلام
- جارٍ المعالجة
- فحص الجودة
- خرج للتسليم
- تم التسليم
- مكتمل

## Hotel Completion Confirmation

The hotel can confirm final completion only after the order reaches `Delivered`.

The hotel-facing action wording is:

- `تم التسليم للنزيل`

When confirmed:

- the order becomes `Completed`
- the existing lifecycle rules remain unchanged

## Scope Boundaries

This hotel console refactor does not change:

- matching philosophy
- assignment or reassignment rules
- onboarding / approval rules
- identity / auth behavior
- provider workflows
- admin workflows

The change is focused on hotel-side UX, data presentation, canonical catalog usage, and room-based operational order entry.
