# SplitSmart – Database Schema

> Current implementation uses an in-memory store (Node.js arrays).
> Schema below maps directly to a relational (PostgreSQL) equivalent for production.

---

## Users

| Column      | Type        | Constraints              |
|-------------|-------------|--------------------------|
| id          | UUID        | PK, DEFAULT gen_random_uuid() |
| name        | VARCHAR(100)| NOT NULL                 |
| email       | VARCHAR(255)| NOT NULL, UNIQUE         |
| password    | VARCHAR(255)| NOT NULL (bcrypt hash)   |
| avatar      | VARCHAR(5)  | Initials e.g. "AK"       |
| created_at  | TIMESTAMP   | DEFAULT NOW()            |

---

## Groups

| Column      | Type        | Constraints              |
|-------------|-------------|--------------------------|
| id          | UUID        | PK                       |
| name        | VARCHAR(100)| NOT NULL                 |
| description | TEXT        |                          |
| category    | VARCHAR(50) | trip/home/food/event/work/other |
| created_by  | UUID        | FK → users.id            |
| created_at  | TIMESTAMP   | DEFAULT NOW()            |

---

## GroupMembers (Join table)

| Column      | Type      | Constraints              |
|-------------|-----------|--------------------------|
| id          | UUID      | PK                       |
| group_id    | UUID      | FK → groups.id, NOT NULL |
| user_id     | UUID      | FK → users.id, NOT NULL  |
| joined_at   | TIMESTAMP | DEFAULT NOW()            |
|             |           | UNIQUE(group_id, user_id)|

---

## Expenses

| Column      | Type         | Constraints              |
|-------------|--------------|--------------------------|
| id          | UUID         | PK                       |
| group_id    | UUID         | FK → groups.id           |
| description | VARCHAR(255) | NOT NULL                 |
| amount      | DECIMAL(12,2)| NOT NULL                 |
| currency    | VARCHAR(5)   | DEFAULT 'INR'            |
| category    | VARCHAR(50)  |                          |
| paid_by     | UUID         | FK → users.id            |
| split_type  | VARCHAR(20)  | 'equal' / 'custom'       |
| date        | TIMESTAMP    |                          |
| created_at  | TIMESTAMP    | DEFAULT NOW()            |

---

## ExpenseParticipants

| Column      | Type         | Constraints              |
|-------------|--------------|--------------------------|
| id          | UUID         | PK                       |
| expense_id  | UUID         | FK → expenses.id         |
| user_id     | UUID         | FK → users.id            |
| share       | DECIMAL(12,2)| NOT NULL                 |
| settled     | BOOLEAN      | DEFAULT false            |

---

## Settlements

| Column        | Type         | Constraints              |
|---------------|--------------|--------------------------|
| id            | UUID         | PK                       |
| from_user_id  | UUID         | FK → users.id            |
| to_user_id    | UUID         | FK → users.id            |
| group_id      | UUID         | FK → groups.id           |
| amount        | DECIMAL(12,2)| NOT NULL                 |
| currency      | VARCHAR(5)   | DEFAULT 'INR'            |
| note          | TEXT         |                          |
| created_at    | TIMESTAMP    | DEFAULT NOW()            |

---

## Entity Relationship

```
Users ──< GroupMembers >── Groups
           |
           Users

Groups ──< Expenses ──< ExpenseParticipants >── Users
                |
              paidBy → Users

Users ──< Settlements (from/to)
```

---

## Indexes (Recommended for Production)

```sql
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_expense_participants_expense ON expense_participants(expense_id);
CREATE INDEX idx_settlements_from ON settlements(from_user_id);
CREATE INDEX idx_settlements_to ON settlements(to_user_id);
```
