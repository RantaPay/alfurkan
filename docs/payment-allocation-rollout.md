# Fee allocation rollout

The application now applies current-term payments to their fee categories. Books,
uniform, sportswear, and prior-term debt cannot settle the tuition balance. SR/YR
rates are tuition rates; other configured fee components stay separate. Receipt
totals still record all money collected, including miscellaneous and debt payments.

## Existing production database

No database update has been executed as part of preparing this change. Before
deploying this application version, apply the reviewed additive SQL patch using
the existing production deployment procedure:

```sh
npx prisma db execute --file prisma/patches/20261028_receipt_item_charge_snapshots.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/patches/20261028_receipt_item_payment_term.sql --schema prisma/schema.prisma
```

These patches add three nullable columns to `ReceiptItem`. They contain no UPDATE, DELETE,
DROP, truncation, reset, or seed command. Existing rows remain unchanged. The SQL
can also be applied by the database administrator directly. The project previously
used `db push`, so this patch does not introduce an incomplete Prisma migration
history or require a database reset/baseline.

Deploy the application only after the columns exist. `prisma generate` generates
the local client and does not apply the database patch.

## Historical records

No bulk balance repair or receipt rewrite is performed. New payments and voids use
active receipts from the current term/session, allocating their stored line items
by category. Itemless historical receipts retain their original tuition meaning.
Original receipt totals, numbers, and audit entries are preserved. New receipt
items snapshot their category's bill and balance at issuance. A previous-term
debt line records the amount collected for that debt and never clears current
tuition; it does not create a new debt charge for the student.

## Isolated validation

```sh
node --import tsx --test src/lib/fee-ledger.test.ts src/lib/payment-period.test.ts
npx tsc --noEmit
```

These checks do not connect to the database.

## Selecting a payment period

The receipt modal defaults to the school's active term and permits 1st Term,
2nd Term, 3rd Term, or Whole Session within the active academic session. Future
term payments do not settle the current term. Whole Session uses three term
tuition bills at the configured rate and allocates tuition to outstanding terms
in order. Other items on an annual receipt remain assigned to the active term;
their configured charges are counted once in the annual view. Each new line
stores its payment term, so allocations survive later payments and cancellations.
Existing receipt lines inherit their original receipt term without a backfill.

If the first patch has already been applied, only the second command is needed
for the period selector. No database patch is applied automatically by the app.
