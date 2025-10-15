# POS Cart API Documentation

## Overview

This document provides comprehensive API documentation for the POS Cart system, including endpoints for managing shopping carts and converting them to sales transactions.

**Base URL**: `http://localhost:3000`

**Authentication**: All cart endpoints require a valid authentication token in the header.

```
Authorization: Bearer <your-token>
```

---

## Table of Contents

1. [Cart Management](#cart-management)
   - [Get Current Cart](#get-current-cart)
   - [Add Item to Cart](#add-item-to-cart)
   - [Update Cart Item](#update-cart-item)
   - [Remove Item from Cart](#remove-item-from-cart)
   - [Clear Cart](#clear-cart)
   - [Update Cart Customer](#update-cart-customer)
2. [Cart to Sale Conversion](#cart-to-sale-conversion)
   - [Checkout - Convert Cart to Sale](#checkout---convert-cart-to-sale)
3. [Response Formats](#response-formats)
4. [Error Handling](#error-handling)

---

## Cart Management

### Get Current Cart

Retrieve the current cashier's active cart with all items.

**Endpoint**: `GET /cart`

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid-123",
    "cashierId": "cashier-account-id",
    "customerId": "customer-account-id",
    "subtotal": 150.00,
    "discountAmount": 15.00,
    "total": 135.00,
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "remarks": "Gift wrap requested",
    "createdAt": "2025-10-14T12:00:00Z",
    "updatedAt": "2025-10-14T12:15:00Z",
    "items": [
      {
        "id": "item-uuid-456",
        "itemId": "product-uuid-789",
        "itemName": "Coffee",
        "itemImage": "/images/coffee.jpg",
        "itemType": "INDIVIDUAL_PRODUCT",
        "quantity": 2,
        "unitPrice": 50.00,
        "subtotal": 100.00,
        "discountAmount": 10.00,
        "totalAfterDiscount": 90.00,
        "isIncluded": true,
        "createdAt": "2025-10-14T12:10:00Z"
      }
    ]
  }
}
```

**Notes**:
- Returns empty cart if no items have been added
- One cart per cashier (automatically created on first item add)

---

### Add Item to Cart

Add a new item or update quantity if item already exists in cart.

**Endpoint**: `POST /cart/items`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "itemId": "product-uuid-789",
  "quantity": 2,
  "discountType": "percentage",
  "discountPercentage": 10
}
```

**Request Fields**:
- `itemId` (required): UUID of the item from Item table
- `quantity` (required): Number of items to add (minimum: 1)
- `discountType` (optional): "percentage", "fixed", or "promo"
- `discountPercentage` (optional): Percentage discount (e.g., 10 for 10%)
- `discountAmount` (optional): Fixed discount amount

**Response**:
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cartItem": {
      "id": "cartitem-uuid-123",
      "cartId": "cart-uuid-456",
      "itemId": "product-uuid-789",
      "itemName": "Coffee",
      "itemImage": "/images/coffee.jpg",
      "quantity": 2,
      "unitPrice": 50.00,
      "subtotal": 100.00,
      "discountAmount": 10.00,
      "totalAfterDiscount": 90.00
    },
    "cart": {
      "subtotal": 100.00,
      "discountAmount": 10.00,
      "total": 90.00
    }
  }
}
```

**Behavior**:
- If item already exists in cart, quantity is updated
- Cart totals are automatically recalculated
- Item data (name, price, image) is fetched from Item table

---

### Add ITEM_GROUP to Cart

Add a combo/bundle item with its child items.

**Endpoint**: `POST /cart/items/group`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "groupItemId": "breakfast-combo-uuid",
  "quantity": 1,
  "childItems": [
    {
      "itemId": "coffee-uuid",
      "quantity": 1,
      "isIncluded": true
    },
    {
      "itemId": "toast-uuid",
      "quantity": 2,
      "isIncluded": true
    },
    {
      "itemId": "eggs-uuid",
      "quantity": 1,
      "isIncluded": false
    }
  ]
}
```

**Request Fields**:
- `groupItemId` (required): UUID of the ITEM_GROUP from Item table
- `quantity` (required): Number of combos to add
- `childItems` (required): Array of child items with quantity and isIncluded flag

**Response**:
```json
{
  "success": true,
  "message": "Item group added to cart successfully",
  "data": {
    "parentItem": {
      "id": "parent-cartitem-uuid",
      "itemName": "Breakfast Combo",
      "itemType": "ITEM_GROUP",
      "quantity": 1,
      "unitPrice": 150.00,
      "subtotal": 150.00,
      "totalAfterDiscount": 150.00
    },
    "childItems": [
      {
        "id": "child-cartitem-1",
        "itemName": "Coffee",
        "quantity": 1,
        "isIncluded": true
      },
      {
        "id": "child-cartitem-2",
        "itemName": "Toast",
        "quantity": 2,
        "isIncluded": true
      },
      {
        "id": "child-cartitem-3",
        "itemName": "Scrambled Eggs",
        "quantity": 1,
        "isIncluded": false
      }
    ]
  }
}
```

---

### Update Cart Item

Update quantity, discount, or isIncluded flag for an existing cart item.

**Endpoint**: `PUT /cart/items/:itemId`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters**:
- `itemId`: UUID of the cart item (not the product item)

**Request Body**:
```json
{
  "quantity": 3,
  "discountPercentage": 15,
  "isIncluded": true
}
```

**Request Fields** (all optional):
- `quantity`: New quantity
- `discountPercentage`: New discount percentage
- `discountAmount`: New fixed discount
- `isIncluded`: For ITEM_GROUP children - include/exclude item

**Response**:
```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    "cartItem": {
      "id": "cartitem-uuid-123",
      "quantity": 3,
      "subtotal": 150.00,
      "discountAmount": 22.50,
      "totalAfterDiscount": 127.50,
      "isIncluded": true
    },
    "cart": {
      "subtotal": 150.00,
      "discountAmount": 22.50,
      "total": 127.50
    }
  }
}
```

---

### Remove Item from Cart

Remove a specific item from the cart.

**Endpoint**: `DELETE /cart/items/:itemId`

**Headers**:
```
Authorization: Bearer <token>
```

**URL Parameters**:
- `itemId`: UUID of the cart item

**Response**:
```json
{
  "success": true,
  "message": "Item removed from cart successfully",
  "data": {
    "removedItemId": "cartitem-uuid-123",
    "cart": {
      "subtotal": 50.00,
      "discountAmount": 5.00,
      "total": 45.00,
      "itemsRemaining": 1
    }
  }
}
```

**Notes**:
- If removing an ITEM_GROUP parent, all child items are also removed (CASCADE)
- Cart totals are automatically recalculated

---

### Clear Cart

Remove all items from the cart.

**Endpoint**: `DELETE /cart`

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "itemsRemoved": 5
  }
}
```

**Notes**:
- Cart remains active but empty
- Ready to add new items for next customer

---

### Update Cart Customer

Associate a customer with the cart or update cart details.

**Endpoint**: `PUT /cart`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "customerId": "customer-account-uuid",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "remarks": "Birthday celebration - add candles"
}
```

**Request Fields** (all optional):
- `customerId`: Link to registered customer account
- `customerName`: Name for walk-in customers (used if no customerId)
- `customerEmail`: Email for receipt
- `remarks`: Special instructions or notes

**Response**:
```json
{
  "success": true,
  "message": "Cart updated successfully",
  "data": {
    "cart": {
      "id": "cart-uuid-123",
      "customerId": "customer-account-uuid",
      "customerName": "Jane Doe",
      "customerEmail": "jane@example.com",
      "remarks": "Birthday celebration - add candles",
      "updatedAt": "2025-10-14T12:30:00Z"
    }
  }
}
```

---

## Cart to Sale Conversion

### Checkout - Convert Cart to Sale

Convert the current cart to a completed sale transaction and clear the cart.

**Endpoint**: `POST /cart/checkout`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "laborerId": "laborer-account-uuid",
  "payments": [
    {
      "paymentMethod": "CASH",
      "amount": 100.00
    },
    {
      "paymentMethod": "GCASH",
      "amount": 50.00,
      "referenceNumber": "GC-TXN-123456"
    }
  ],
  "paymentAmount": 150.00,
  "changeAmount": 15.00
}
```

**Request Fields**:
- `laborerId` (optional): Laborer who performed service
- `payments` (required): Array of payment objects
  - `paymentMethod` (required): CASH, CREDIT_CARD, DEBIT_CARD, QR_CODE, GCASH, PAYMAYA, BANK_TRANSFER, CHECK
  - `amount` (required): Amount paid with this method
  - `referenceNumber` (optional): Transaction reference for digital payments
- `paymentAmount` (required): Total amount paid by customer
- `changeAmount` (optional): Change to return (calculated as paymentAmount - total)

**Response**:
```json
{
  "success": true,
  "message": "Checkout successful - Sale created",
  "data": {
    "sale": {
      "id": "sale-uuid-789",
      "saleNumber": "00000053",
      "subtotal": 150.00,
      "discountAmount": 15.00,
      "total": 135.00,
      "paymentAmount": 150.00,
      "changeAmount": 15.00,
      "cashierId": "cashier-account-uuid",
      "laborerId": "laborer-account-uuid",
      "customerId": "customer-account-uuid",
      "branchId": 1,
      "status": "PROCESSED",
      "cashierName": "John Doe",
      "laborerName": "Jane Smith",
      "customerName": "Alice Johnson",
      "branchName": "Main Branch",
      "createdAt": "2025-10-14T12:45:00Z"
    },
    "saleItems": [
      {
        "id": "saleitem-uuid-123",
        "itemName": "Coffee",
        "quantity": 2,
        "unitPrice": 50.00,
        "totalAfterDiscount": 90.00
      }
    ],
    "payments": [
      {
        "id": "payment-uuid-456",
        "paymentMethod": "CASH",
        "amount": 100.00
      },
      {
        "id": "payment-uuid-457",
        "paymentMethod": "GCASH",
        "amount": 50.00,
        "referenceNumber": "GC-TXN-123456"
      }
    ],
    "cartCleared": true
  }
}
```

**Process Flow**:
1. Validate cart has items
2. Validate payment amount >= cart total
3. Create Sale record with auto-generated saleNumber
4. Copy all CartItems to SaleItems
5. Create SalePayment records
6. Delete all CartItems (empty the cart)
7. Return sale details with receipt data

**Validation Rules**:
- Cart must have at least one item
- Sum of payment amounts must equal paymentAmount
- paymentAmount must be >= cart total
- If paymentAmount > total, changeAmount is required

**Notes**:
- Cart is automatically cleared after successful checkout
- Sale status is set to PROCESSED (payment received)
- Inventory can be deducted at this point (future feature)
- Receipt can be printed using the returned sale data

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description",
  "details": {
    "field": "validation error details"
  }
}
```

---

## Error Handling

### Common Error Codes

| HTTP Status | Error Message | Description |
|-------------|--------------|-------------|
| 400 | "Cart is empty" | Attempting checkout with no items |
| 400 | "Item not found" | ItemId doesn't exist in Item table |
| 400 | "Insufficient payment" | Payment amount less than total |
| 400 | "Invalid discount" | Discount percentage > 100 or negative |
| 401 | "Unauthorized" | Missing or invalid auth token |
| 404 | "Cart item not found" | CartItem doesn't exist |
| 500 | "Internal server error" | Database or server error |

### Example Error Response
```json
{
  "success": false,
  "error": "Cart is empty",
  "details": {
    "message": "Cannot checkout with an empty cart. Please add items first.",
    "code": "EMPTY_CART"
  }
}
```

---

## Best Practices

1. **Always Clear Cart After Sale**
   - Cart is automatically cleared on successful checkout
   - Verify cartCleared flag in response

2. **Handle Payment Validations**
   - Ensure sum of payment amounts equals paymentAmount
   - Calculate changeAmount correctly: `paymentAmount - total`

3. **ITEM_GROUP Handling**
   - Use `/cart/items/group` endpoint for combos
   - Allow customers to uncheck items with `isIncluded: false`

4. **Customer Information**
   - For registered customers: Use `customerId`
   - For walk-ins: Use `customerName` and optional `customerEmail`

5. **Split Payments**
   - Support multiple payment methods per transaction
   - Track reference numbers for digital payments

6. **Error Recovery**
   - If checkout fails, cart remains intact
   - Customer can retry or modify cart

---

## Example Workflow

### Complete Purchase Flow

```javascript
// 1. Get or create cart
GET /cart

// 2. Add items to cart
POST /cart/items
{
  "itemId": "coffee-uuid",
  "quantity": 2,
  "discountPercentage": 10
}

POST /cart/items/group
{
  "groupItemId": "breakfast-combo-uuid",
  "quantity": 1,
  "childItems": [...]
}

// 3. Update customer information
PUT /cart
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com"
}

// 4. Checkout
POST /cart/checkout
{
  "laborerId": "laborer-uuid",
  "payments": [
    { "paymentMethod": "CASH", "amount": 150.00 }
  ],
  "paymentAmount": 150.00,
  "changeAmount": 15.00
}

// 5. Cart is now empty, ready for next customer
GET /cart  // Returns empty cart
```

---

**Version**: 1.0
**Last Updated**: 2025-10-14
**Migration**: 20251014213700_add_cart_system
