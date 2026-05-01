# SplitSmart API Documentation

**Base URL:** `http://localhost:5000/api`  
**Auth:** Bearer token in `Authorization` header  
**Format:** JSON

---

## Authentication

### POST /auth/register
Register a new user.

**Request Body:**
```json
{ "name": "Alice Kumar", "email": "alice@demo.com", "password": "password123" }
```
**Response `201`:**
```json
{ "token": "<jwt>", "user": { "id": "...", "name": "Alice Kumar", "email": "alice@demo.com", "avatar": "AK" } }
```

---

### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{ "email": "alice@demo.com", "password": "password123" }
```
**Response `200`:**
```json
{ "token": "<jwt>", "user": { "id": "...", "name": "Alice Kumar", "email": "alice@demo.com" } }
```
**Error `401`:** `{ "error": "Invalid credentials" }`

---

### GET /auth/me
Get the currently authenticated user.

**Headers:** `Authorization: Bearer <token>`  
**Response `200`:** `{ "user": { ... } }`

---

### GET /auth/users?q={query}
Search users by name or email (for adding to groups).

**Headers:** `Authorization: Bearer <token>`  
**Response `200`:** Array of user objects (without passwords)

---

## Groups

### GET /groups
Get all groups for the authenticated user.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Goa Trip 2025",
    "description": "Beach vacation",
    "category": "trip",
    "createdBy": "user-uuid",
    "members": [...],
    "totalExpenses": 36000,
    "expenseCount": 2
  }
]
```

---

### POST /groups
Create a new group.

**Request Body:**
```json
{
  "name": "Goa Trip 2025",
  "description": "Beach vacation with friends",
  "category": "trip",
  "memberIds": ["user-id-2", "user-id-3"]
}
```
**Response `201`:** Created group object with members

---

### GET /groups/:id
Get a specific group with all details and expenses.

**Response `200`:** Full group object including `expenses` array

---

### PUT /groups/:id
Update group details. Only creator can update.

**Request Body:** `{ "name": "...", "description": "...", "category": "..." }`  
**Response `200`:** Updated group object

---

### DELETE /groups/:id
Delete a group. Only creator can delete.

**Response `200`:** `{ "message": "Group deleted" }`

---

### POST /groups/:id/members
Add a new member to a group.

**Request Body:** `{ "userId": "user-uuid" }`  
**Response `201`:** `{ "message": "Member added" }`

---

### GET /groups/:id/balances
Compute balance summary and simplified debt settlement suggestions.

**Response `200`:**
```json
{
  "balances": [
    { "userId": "...", "name": "Alice", "avatar": "AK", "netBalance": 9000 },
    { "userId": "...", "name": "Bob", "avatar": "BS", "netBalance": -9000 }
  ],
  "debts": [
    { "from": "bob-id", "fromName": "Bob Sharma", "to": "alice-id", "toName": "Alice Kumar", "amount": 9000 }
  ]
}
```

---

## Expenses

### GET /expenses
List all expenses across all the user's groups.

**Response `200`:** Array of expense objects (enriched with payer name, group name, participant names)

---

### POST /expenses
Add a new expense.

**Request Body:**
```json
{
  "groupId": "group-uuid",
  "description": "Hotel booking",
  "amount": 12000,
  "category": "accommodation",
  "splitType": "equal",
  "date": "2025-04-20T00:00:00.000Z"
}
```
**Response `201`:** Created expense object with enriched participant data

---

### GET /expenses/:id
Get a single expense by ID.

**Response `200`:** Enriched expense object

---

### PUT /expenses/:id
Update an expense. Only the payer can update.

**Request Body:** `{ "description": "...", "amount": 0, "category": "...", "date": "..." }`  
**Response `200`:** Updated expense

---

### DELETE /expenses/:id
Delete an expense. Only the payer can delete.

**Response `200`:** `{ "message": "Expense deleted" }`

---

### POST /expenses/:id/settle
Mark a participant as settled for an expense.

**Request Body:** `{ "userId": "optional-user-id" }` (defaults to current user)  
**Response `200`:** Updated expense

---

## Settlements

### GET /settlements
List all settlement records involving the current user.

**Response `200`:** Array of settlement objects

---

### POST /settlements
Record a cash/UPI settlement payment.

**Request Body:**
```json
{
  "toUserId": "user-uuid",
  "groupId": "group-uuid",
  "amount": 3000,
  "note": "Paid via UPI"
}
```
**Response `201`:** Created settlement record

---

### GET /settlements/summary
Get overall balance summary for the current user across all groups.

**Response `200`:**
```json
{
  "totalOwed": 9000,
  "totalOwing": 1200,
  "netBalance": 7800
}
```

---

## Error Responses

| Status | Meaning                        |
|--------|-------------------------------|
| 400    | Bad request / validation error |
| 401    | Unauthorized (invalid/missing token) |
| 403    | Forbidden (not owner)          |
| 404    | Resource not found             |
| 409    | Conflict (duplicate)           |
| 500    | Internal server error          |

All errors return: `{ "error": "Human-readable message" }`

---

## Health Check

### GET /health
`{ "status": "ok", "app": "SplitSmart API", "version": "1.0.0" }`
