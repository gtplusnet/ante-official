# Sales & POS Schema Documentation

## Overview

This document provides comprehensive documentation for the Sales/POS (Point of Sale) system schema, including detailed explanations of each table, column, and their relationships.

---

## Schema Diagram

```
Account (Employee/Customer)
  ├─ LaborerData (Service provider)
  └─ CashierData (POS operator)

Branch (Project)
  ├─ LaborerData[]
  ├─ CashierData[]
  └─ Sale[]

Sale (Transaction)
  ├─ SaleItem[] (Items in transaction)
  ├─ SalePayment[] (Payment records)
  └─ Relationships:
      ├─ CashierData (who processed)
      ├─ LaborerData (who performed service)
      ├─ Account (customer)
      └─ Branch (location)

Item (Product/Service)
  └─ SaleItem[] (Sales history)
```

---

## Table: LaborerData

**Purpose**: Manages laborers (service providers) who can be assigned to sales transactions.

**Pattern**: Similar to CashierData - links an Account to a Branch with laborer-specific data.

### Columns

#### `accountId` (String, Unique, Primary Key)
- **Purpose**: Links to the Account table to identify which employee is a laborer
- **When to use**: When creating a new laborer from an existing employee account
- **How to populate**: Select an Account.id from the Account table
- **Example**: `"acc-uuid-123"`
- **Required**: Yes
- **Notes**: One account can only be one laborer (unique constraint)

#### `branchId` (Int, Foreign Key)
- **Purpose**: Assigns the laborer to a specific branch/location
- **When to use**: When creating a laborer, specify which branch they work at
- **How to populate**: Select a Project.id where Project.status = 'BRANCH'
- **Example**: `1`
- **Required**: Yes
- **Notes**: Laborers work at specific branches

#### `isActive` (Boolean)
- **Purpose**: Controls whether the laborer is currently active
- **When to use**: When disabling a laborer without deleting the record
- **How to populate**: Set to `true` when creating, `false` when deactivating
- **Default**: `true`
- **Example**: `true`
- **Notes**: Use this for soft deletes instead of removing records

#### `createdAt` (DateTime)
- **Purpose**: Timestamp when the laborer record was created
- **When to use**: Automatically set by database
- **How to populate**: Auto-generated on insert
- **Example**: `2025-10-14T12:00:00Z`
- **Notes**: Read-only, useful for auditing

#### `updatedAt` (DateTime)
- **Purpose**: Timestamp when the laborer record was last modified
- **When to use**: Automatically updated by database
- **How to populate**: Auto-generated on update
- **Example**: `2025-10-14T15:30:00Z`
- **Notes**: Read-only, tracks last modification

### Relationships

- **account**: Gets laborer's name, email, image from Account table
- **branch**: Gets branch name and details from Project table
- **sales**: All sales where this laborer was assigned

### Common Queries

```typescript
// Add a new laborer
await prisma.laborerData.create({
  data: {
    accountId: "account-uuid",
    branchId: 1,
    isActive: true
  }
})

// Get all active laborers for a branch
await prisma.laborerData.findMany({
  where: {
    branchId: 1,
    isActive: true
  },
  include: {
    account: true  // Get name, email, image
  }
})
```

---

## Table: Sale

**Purpose**: Main transaction record that stores all sales/transactions in the POS system.

### Columns

#### `id` (String, UUID, Primary Key)
- **Purpose**: Unique identifier for each sale
- **When to use**: Auto-generated for every new sale
- **How to populate**: Use Prisma's `@default(uuid())`
- **Example**: `"sale-abc-123-def-456"`
- **Required**: Yes
- **Notes**: Use this ID for all references to the sale

#### `saleNumber` (String, Unique)
- **Purpose**: Human-readable sequential transaction number
- **When to use**: Display to customers and cashiers for easy reference
- **How to populate**:
  1. Query: `SELECT MAX(saleNumber) FROM Sale`
  2. Parse number, increment by 1
  3. Format: `"00000001"`, `"00000052"`, etc.
- **Example**: `"00000052"`
- **Required**: Yes
- **Notes**: Never reuse numbers, even for voided sales. Always pad with zeros (8 digits)

#### `subtotal` (Float)
- **Purpose**: Total before discounts
- **When to use**: Store the original price sum of all items
- **How to populate**: Sum of all `SaleItem.subtotal`
- **Example**: `150.00`
- **Required**: Yes
- **Formula**: `SUM(item.quantity * item.unitPrice)`

#### `discountAmount` (Float)
- **Purpose**: Total discount applied to the sale
- **When to use**: When offering discounts at sale level or item level
- **How to populate**: Sum of all item discounts + sale-level discount
- **Default**: `0`
- **Example**: `15.00`
- **Formula**: `subtotal - total`

#### `total` (Float)
- **Purpose**: Final amount to be paid after discounts
- **When to use**: This is the amount customer must pay
- **How to populate**: `subtotal - discountAmount`
- **Example**: `135.00`
- **Required**: Yes
- **Formula**: `subtotal - discountAmount`

#### `paymentAmount` (Float)
- **Purpose**: Total amount paid by customer (sum of all payments)
- **When to use**: Record how much customer actually paid
- **How to populate**: Sum of all `SalePayment.amount`
- **Example**: `150.00`
- **Required**: Yes
- **Notes**: Can be greater than total (customer gives more than needed)

#### `changeAmount` (Float)
- **Purpose**: Money to return to customer
- **When to use**: When paymentAmount > total
- **How to populate**: `paymentAmount - total`
- **Default**: `0`
- **Example**: `15.00`
- **Formula**: `paymentAmount - total`

#### `cashierId` (String, Foreign Key)
- **Purpose**: Identifies which cashier processed this sale
- **When to use**: Link to currently logged-in cashier
- **How to populate**: Get from `CashierData.accountId` of logged-in user
- **Example**: `"cashier-acc-uuid"`
- **Required**: Yes
- **Notes**: References CashierData.accountId (not Account.id directly)

#### `laborerId` (String, Nullable, Foreign Key)
- **Purpose**: Identifies which laborer performed the service
- **When to use**: For service-based sales where a specific person does the work
- **How to populate**: Select from LaborerData at same branch
- **Example**: `"laborer-acc-uuid"` or `null`
- **Required**: No
- **Notes**: Null for non-service sales. References LaborerData.accountId

#### `customerId` (String, Nullable, Foreign Key)
- **Purpose**: Identifies the customer (if registered)
- **When to use**: For registered customers, loyalty programs, repeat buyers
- **How to populate**:
  - Registered customer: Select from Account
  - Walk-in: Leave null
- **Example**: `"customer-acc-uuid"` or `null`
- **Required**: No
- **Notes**: Null for walk-in customers

#### `branchId` (Int, Foreign Key)
- **Purpose**: Identifies where the sale occurred
- **When to use**: Link to branch/location of transaction
- **How to populate**: Get from cashier's branch or user's current location
- **Example**: `1`
- **Required**: Yes
- **Notes**: References Project.id where status = 'BRANCH'

#### `status` (SaleStatus Enum)
- **Purpose**: Current state of the transaction
- **When to use**: Track transaction lifecycle
- **Values**:
  - `PENDING`: Cart not yet paid
  - `PROCESSED`: Payment received, not yet fulfilled
  - `COMPLETED`: Payment received and fulfilled
  - `VOID`: Transaction cancelled
  - `REFUNDED`: Money returned to customer
- **Default**: `PENDING`
- **Example**: `"PROCESSED"`
- **Required**: Yes

#### `isClaimed` (Boolean)
- **Purpose**: Indicates if customer has received their items/service
- **When to use**: For pickup services, order fulfillment
- **How to populate**: Set to `false` initially, `true` when customer picks up
- **Default**: `false`
- **Example**: `false`
- **Notes**: Useful for "order ready for pickup" workflows

#### `isVoid` (Boolean)
- **Purpose**: Marks if transaction was cancelled
- **When to use**: When cancelling a sale before or after payment
- **How to populate**: Set to `true` when voiding, requires `voidReason`
- **Default**: `false`
- **Example**: `false`
- **Notes**: Voided sales should not be deleted, keep for audit trail

#### `voidReason` (String, Nullable)
- **Purpose**: Explains why the sale was voided
- **When to use**: Required when `isVoid = true`
- **How to populate**: Free text from cashier or manager
- **Example**: `"Customer changed mind"` or `"Payment error"`
- **Required**: Only if `isVoid = true`

#### `voidById` (String, Nullable, Foreign Key)
- **Purpose**: Tracks who voided the transaction
- **When to use**: Accountability for void actions
- **How to populate**: Account.id of person who clicked void button
- **Example**: `"manager-acc-uuid"`
- **Required**: Only if `isVoid = true`
- **Notes**: Usually a manager or supervisor

#### `voidedAt` (DateTime, Nullable)
- **Purpose**: Timestamp when transaction was voided
- **When to use**: Audit trail for void actions
- **How to populate**: Auto-set when `isVoid` changes to `true`
- **Example**: `2025-10-14T16:45:00Z`
- **Required**: Only if `isVoid = true`

#### `cashierName` (String)
- **Purpose**: Denormalized cashier name for fast queries
- **When to use**: Display cashier name without joining Account table
- **How to populate**: Copy from `Account.firstName + " " + Account.lastName`
- **Example**: `"John Doe"`
- **Required**: Yes
- **Notes**: Denormalized for performance, update if account name changes

#### `laborerName` (String, Nullable)
- **Purpose**: Denormalized laborer name for fast queries
- **When to use**: Display laborer name in receipts/reports
- **How to populate**: Copy from laborer's Account full name
- **Example**: `"Jane Smith"` or `null`
- **Required**: No

#### `customerName` (String, Nullable)
- **Purpose**: Denormalized customer name
- **When to use**:
  - Registered customer: Auto-fill from Account
  - Walk-in: Allow manual entry or leave null
- **Example**: `"Alice Johnson"` or `"Walk-in Customer"` or `null`
- **Required**: No

#### `customerEmail` (String, Nullable)
- **Purpose**: Customer email for receipts/follow-ups
- **When to use**:
  - Registered: Auto-fill from Account
  - Walk-in: Optional manual entry
- **Example**: `"alice@example.com"` or `null`
- **Required**: No

#### `branchName` (String)
- **Purpose**: Denormalized branch name for reports
- **When to use**: Display branch name without joining Project table
- **How to populate**: Copy from `Project.name`
- **Example**: `"Main Branch"`
- **Required**: Yes
- **Notes**: Denormalized for performance

#### `remarks` (String, Nullable)
- **Purpose**: Free-text notes about the transaction
- **When to use**: Special instructions, notes, comments
- **How to populate**: Free text from cashier
- **Example**: `"Customer requested gift wrap"` or `null`
- **Required**: No

#### `pointsEarned` (Float)
- **Purpose**: Loyalty points earned from this purchase
- **When to use**: For loyalty/rewards programs
- **How to populate**: Calculate based on total (e.g., 1% of total)
- **Default**: `0`
- **Example**: `1.35`
- **Notes**: Only for registered customers

#### `createdAt` (DateTime)
- **Purpose**: Transaction timestamp
- **When to use**: Auto-generated on sale creation
- **Example**: `2025-10-14T12:30:00Z`
- **Required**: Yes (auto)
- **Notes**: This is the "transaction date/time"

#### `updatedAt` (DateTime)
- **Purpose**: Last modification timestamp
- **When to use**: Auto-generated on any update
- **Example**: `2025-10-14T12:35:00Z`
- **Required**: Yes (auto)

### Relationships

- **cashier**: Links to CashierData (who processed)
- **laborer**: Links to LaborerData (who performed service)
- **customer**: Links to Account (buyer)
- **branch**: Links to Project (location)
- **voidedBy**: Links to Account (who voided)
- **items**: All items in this sale
- **payments**: All payments for this sale

### Common Scenarios

#### Creating a Simple Sale
```typescript
await prisma.sale.create({
  data: {
    saleNumber: "00000053",
    subtotal: 100,
    total: 100,
    paymentAmount: 100,
    changeAmount: 0,
    cashierId: "cashier-uuid",
    branchId: 1,
    cashierName: "John Doe",
    branchName: "Main Branch",
    status: "PROCESSED",
    items: {
      create: [
        {
          itemId: "item-uuid",
          itemName: "Coffee",
          quantity: 2,
          unitPrice: 50,
          subtotal: 100,
          totalAfterDiscount: 100
        }
      ]
    },
    payments: {
      create: [
        {
          paymentMethod: "CASH",
          amount: 100
        }
      ]
    }
  }
})
```

#### Voiding a Sale
```typescript
await prisma.sale.update({
  where: { id: "sale-uuid" },
  data: {
    isVoid: true,
    voidReason: "Customer cancelled order",
    voidById: "manager-uuid",
    voidedAt: new Date(),
    status: "VOID"
  }
})
```

---

## Table: SaleItem

**Purpose**: Individual items/products in a sale. Supports ITEM_GROUP with parent-child relationships.

### Columns

#### `id` (String, UUID, Primary Key)
- **Purpose**: Unique identifier for each item in a sale
- **When to use**: Auto-generated for each item added
- **Example**: `"saleitem-abc-123"`
- **Required**: Yes

#### `saleId` (String, Foreign Key)
- **Purpose**: Links to the parent Sale
- **When to use**: Always required to associate item with sale
- **How to populate**: Sale.id from the transaction
- **Example**: `"sale-abc-123"`
- **Required**: Yes

#### `itemId` (String, Nullable, Foreign Key)
- **Purpose**: References the Item master data
- **When to use**:
  - For catalog items: Set to Item.id
  - For custom/ad-hoc items: Leave null
- **Example**: `"item-xyz-789"` or `null`
- **Required**: No
- **Notes**: Null allows custom items not in catalog

#### `parentSaleItemId` (String, Nullable, Foreign Key)
- **Purpose**: Creates parent-child relationship for ITEM_GROUP
- **When to use**:
  - Parent item (group): Leave null
  - Child item (in group): Set to parent's SaleItem.id
- **Example**: `null` (parent) or `"parent-saleitem-id"` (child)
- **Required**: No
- **Notes**: This enables ITEM_GROUP expansion

#### `itemName` (String)
- **Purpose**: Display name of the item
- **When to use**: Always required for display in receipt
- **How to populate**: Copy from Item.name or user input
- **Example**: `"Breakfast Combo"` or `"Coffee"`
- **Required**: Yes

#### `itemImage` (String, Nullable)
- **Purpose**: Image URL for the item
- **When to use**: Display item images in POS/receipts
- **How to populate**: Copy from Item or custom URL
- **Example**: `"/images/coffee.jpg"` or `null`
- **Required**: No

#### `itemType` (ItemType Enum)
- **Purpose**: Indicates if item is individual or a group
- **Values**:
  - `INDIVIDUAL_PRODUCT`: Single item
  - `ITEM_GROUP`: Bundle/combo with child items
- **When to use**:
  - Set to `ITEM_GROUP` for parent
  - Set to `INDIVIDUAL_PRODUCT` for children and standalone items
- **Default**: `INDIVIDUAL_PRODUCT`
- **Example**: `"ITEM_GROUP"`
- **Required**: Yes

#### `quantity` (Int)
- **Purpose**: Number of items purchased
- **When to use**: Always required
- **How to populate**: User input from POS
- **Example**: `2`
- **Required**: Yes
- **Notes**: Must be >= 1

#### `unitPrice` (Float)
- **Purpose**: Price per unit
- **When to use**: Always required
- **How to populate**: From Item.sellingPrice or user input
- **Example**: `50.00`
- **Required**: Yes
- **Notes**: For group children, often 0 (included in group price)

#### `subtotal` (Float)
- **Purpose**: Total before discount
- **When to use**: Calculated field
- **How to populate**: `quantity * unitPrice`
- **Example**: `100.00`
- **Required**: Yes
- **Formula**: `quantity * unitPrice`

#### `discountType` (String, Nullable)
- **Purpose**: Type of discount applied
- **When to use**: When discount is applied to this item
- **How to populate**:
  - `"percentage"`: Percentage-based
  - `"fixed"`: Fixed amount
  - `"promo"`: Promotional discount
  - `null`: No discount
- **Example**: `"percentage"` or `null`
- **Required**: No

#### `discountPercentage` (Float, Nullable)
- **Purpose**: Discount percentage (if applicable)
- **When to use**: When `discountType = "percentage"`
- **How to populate**: User input (e.g., 10 for 10%)
- **Example**: `10.0` or `null`
- **Required**: Only if `discountType = "percentage"`
- **Notes**: Store as decimal (10 = 10%, not 0.1)

#### `discountAmount` (Float)
- **Purpose**: Actual discount amount in currency
- **When to use**: Always calculate when discount applied
- **How to populate**:
  - Percentage: `subtotal * (discountPercentage / 100)`
  - Fixed: Direct input
- **Default**: `0`
- **Example**: `10.00`
- **Formula**: Based on discountType

#### `totalAfterDiscount` (Float)
- **Purpose**: Final price for this item
- **When to use**: Always required
- **How to populate**: `subtotal - discountAmount`
- **Example**: `90.00`
- **Required**: Yes
- **Formula**: `subtotal - discountAmount`

#### `isIncluded` (Boolean)
- **Purpose**: For ITEM_GROUP children - tracks if item is included in order
- **When to use**:
  - Parent item: Always `true`
  - Individual items: Always `true`
  - Group children: `true` if checked, `false` if unchecked
- **Default**: `true`
- **Example**: `false` (customer unchecked scrambled eggs from breakfast combo)
- **Required**: Yes
- **Notes**: Allows customers to remove items from combos

#### `createdAt` (DateTime)
- **Purpose**: Timestamp when item was added to sale
- **When to use**: Auto-generated
- **Example**: `2025-10-14T12:30:05Z`
- **Required**: Yes (auto)

### Relationships

- **sale**: Parent Sale transaction
- **item**: Master Item data (if linked)
- **parentItem**: Parent SaleItem for ITEM_GROUP
- **childItems**: Child SaleItems in group

### ITEM_GROUP Logic

#### Example: Breakfast Combo

**Database Structure:**
```
SaleItem 1 (Parent):
  - id: "si-001"
  - saleId: "sale-123"
  - itemName: "Breakfast Combo"
  - itemType: "ITEM_GROUP"
  - parentSaleItemId: null
  - quantity: 1
  - unitPrice: 150
  - subtotal: 150
  - totalAfterDiscount: 150
  - isIncluded: true

SaleItem 2 (Child):
  - id: "si-002"
  - saleId: "sale-123"
  - itemName: "Coffee"
  - itemType: "INDIVIDUAL_PRODUCT"
  - parentSaleItemId: "si-001"
  - quantity: 1
  - unitPrice: 0
  - isIncluded: true

SaleItem 3 (Child):
  - id: "si-003"
  - saleId: "sale-123"
  - itemName: "Toast"
  - itemType: "INDIVIDUAL_PRODUCT"
  - parentSaleItemId: "si-001"
  - quantity: 2
  - unitPrice: 0
  - isIncluded: true

SaleItem 4 (Child):
  - id: "si-004"
  - saleId: "sale-123"
  - itemName: "Scrambled Egg"
  - itemType: "INDIVIDUAL_PRODUCT"
  - parentSaleItemId: "si-001"
  - quantity: 1
  - unitPrice: 0
  - isIncluded: false  ← Customer unchecked this
```

#### Query Example
```typescript
// Get sale with grouped items
const sale = await prisma.sale.findUnique({
  where: { id: 'sale-123' },
  include: {
    items: {
      where: {
        parentSaleItemId: null  // Only top-level items
      },
      include: {
        childItems: true  // Include children
      }
    }
  }
})

// Result:
sale.items[0] = {
  itemName: "Breakfast Combo",
  childItems: [
    { itemName: "Coffee", isIncluded: true },
    { itemName: "Toast", isIncluded: true },
    { itemName: "Scrambled Egg", isIncluded: false }
  ]
}
```

---

## Table: SalePayment

**Purpose**: Records payment transactions for a sale. Supports split payments (multiple payment methods for one sale).

### Columns

#### `id` (String, UUID, Primary Key)
- **Purpose**: Unique identifier for payment record
- **When to use**: Auto-generated for each payment
- **Example**: `"payment-abc-123"`
- **Required**: Yes

#### `saleId` (String, Foreign Key)
- **Purpose**: Links to the parent Sale
- **When to use**: Required for every payment
- **How to populate**: Sale.id from the transaction
- **Example**: `"sale-abc-123"`
- **Required**: Yes

#### `paymentMethod` (PaymentMethod Enum)
- **Purpose**: Indicates how customer paid
- **Values**:
  - `CASH`: Physical cash
  - `CREDIT_CARD`: Credit card payment
  - `DEBIT_CARD`: Debit card payment
  - `QR_CODE`: QR code payment (generic)
  - `GCASH`: GCash e-wallet
  - `PAYMAYA`: PayMaya e-wallet
  - `BANK_TRANSFER`: Direct bank transfer
  - `CHECK`: Check payment
- **When to use**: Always required to track payment method
- **Example**: `"CASH"`
- **Required**: Yes

#### `amount` (Float)
- **Purpose**: Amount paid with this payment method
- **When to use**: Required for every payment
- **How to populate**:
  - Single payment: Full sale total
  - Split payment: Partial amount
- **Example**: `100.00`
- **Required**: Yes
- **Notes**: Sum of all payment amounts should equal Sale.paymentAmount

#### `referenceNumber` (String, Nullable)
- **Purpose**: External transaction reference
- **When to use**:
  - For digital payments (QR, bank transfer): Store transaction ID
  - For credit/debit: Store approval code
  - For cash: Leave null
- **How to populate**: From payment gateway or manual entry
- **Example**: `"GC-TXN-123456"` or `null`
- **Required**: No
- **Notes**: Useful for reconciliation and refunds

#### `createdAt` (DateTime)
- **Purpose**: Timestamp when payment was recorded
- **When to use**: Auto-generated
- **Example**: `2025-10-14T12:30:15Z`
- **Required**: Yes (auto)
- **Notes**: Can have multiple payments at different times

### Relationships

- **sale**: Parent Sale transaction

### Split Payment Example

**Scenario**: Customer buys 150 worth, pays:
- 100 cash
- 50 GCash

**Database Records:**
```
SalePayment 1:
  - saleId: "sale-123"
  - paymentMethod: "CASH"
  - amount: 100
  - referenceNumber: null

SalePayment 2:
  - saleId: "sale-123"
  - paymentMethod: "GCASH"
  - amount: 50
  - referenceNumber: "GC-TXN-789456"
```

**Sale Record:**
```
Sale:
  - id: "sale-123"
  - total: 150
  - paymentAmount: 150 (100 + 50)
  - changeAmount: 0
```

### Query Example
```typescript
// Get sale with payments
const sale = await prisma.sale.findUnique({
  where: { id: 'sale-123' },
  include: {
    payments: true
  }
})

// Calculate total paid
const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0)
```

---

## Enums

### SaleStatus

**Purpose**: Tracks the lifecycle state of a sale transaction.

**Values:**
- **PENDING**: Sale is in cart, not yet paid
  - Use when: Building the cart, before checkout
  - Example: Customer is adding items to cart

- **PROCESSED**: Payment received, waiting for fulfillment
  - Use when: Payment complete, items not yet given/service not yet done
  - Example: Customer paid, waiting to receive items

- **COMPLETED**: Payment received AND fulfilled
  - Use when: Transaction complete, items given/service done
  - Example: Customer has received everything

- **VOID**: Transaction cancelled
  - Use when: Sale was cancelled (with or without payment)
  - Example: Customer changed mind, payment error

- **REFUNDED**: Money returned to customer
  - Use when: Customer returned items and got money back
  - Example: Product defective, customer got refund

**Workflow:**
```
PENDING → PROCESSED → COMPLETED
   ↓           ↓
 VOID      REFUNDED
```

### PaymentMethod

**Purpose**: Categorizes how customer paid for the transaction.

**Values:**
- **CASH**: Physical cash payment
  - Most common
  - Requires exact change calculation

- **CREDIT_CARD**: Credit card payment
  - Store card approval code in referenceNumber

- **DEBIT_CARD**: Debit card payment
  - Store card approval code in referenceNumber

- **QR_CODE**: Generic QR code payment
  - Use for unknown/generic QR payments

- **GCASH**: GCash e-wallet
  - Specific for GCash transactions
  - Store GCash reference number

- **PAYMAYA**: PayMaya e-wallet
  - Specific for PayMaya transactions
  - Store PayMaya reference number

- **BANK_TRANSFER**: Direct bank transfer
  - Store bank transaction reference

- **CHECK**: Check payment
  - Store check number in referenceNumber

---

## Common Queries

### Get Sales for Today
```typescript
const today = new Date()
today.setHours(0,0,0,0)

const sales = await prisma.sale.findMany({
  where: {
    branchId: 1,
    createdAt: {
      gte: today
    },
    isVoid: false
  },
  include: {
    items: true,
    payments: true
  }
})
```

### Get Sales by Cashier
```typescript
const sales = await prisma.sale.findMany({
  where: {
    cashierId: "cashier-uuid",
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  },
  include: {
    items: true
  }
})
```

### Get Sale with All Details
```typescript
const sale = await prisma.sale.findUnique({
  where: { id: "sale-uuid" },
  include: {
    cashier: {
      include: {
        account: true
      }
    },
    laborer: {
      include: {
        account: true
      }
    },
    customer: true,
    branch: true,
    items: {
      include: {
        item: true,
        childItems: true
      }
    },
    payments: true
  }
})
```

### Get Unchecked Items from ITEM_GROUP
```typescript
const uncheckedItems = await prisma.saleItem.findMany({
  where: {
    saleId: "sale-uuid",
    parentSaleItemId: {
      not: null  // Only group children
    },
    isIncluded: false  // Unchecked
  }
})
```

---

## Best Practices

1. **Never Delete Sales**: Use `isVoid` flag instead
2. **Denormalize Wisely**: Store names for performance, but update if source changes
3. **Audit Trail**: Keep voidedBy, voidedAt, voidReason for all voids
4. **Split Payments**: Always use SalePayment table, even for single payment
5. **ITEM_GROUP**: Always expand groups into parent + children for flexibility
6. **Sequential Numbers**: Ensure saleNumber never has gaps or duplicates
7. **Customer Data**: Allow walk-ins (null customerId) but capture name if possible
8. **Payment Verification**: Sum(SalePayment.amount) should equal Sale.paymentAmount
9. **Change Calculation**: Always verify paymentAmount >= total before saving
10. **Status Workflow**: Follow proper status transitions (PENDING → PROCESSED → COMPLETED)

---

## Migration Notes

When importing from MongoDB:
1. Convert ObjectIds to UUIDs/integers
2. Map old `sale_id` to new `saleNumber`
3. Flatten nested `service_list` to SaleItem records
4. Extract `laborer` array to laborerId field (use first laborer)
5. Convert `payment_method` string to PaymentMethod enum
6. Create SalePayment record for each sale
7. Set appropriate SaleStatus based on old status
8. Populate denormalized fields (cashierName, etc.)

---

**Last Updated**: 2025-10-14
**Version**: 1.0
**Schema Migration**: `20251014145657_add_laborer_and_sales`
