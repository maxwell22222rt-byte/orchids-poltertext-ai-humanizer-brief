# Automated Checker Payment System

## Overview

This system handles **automated payments to content checkers/validators** via M-Pesa. All phone numbers are stored and used in the **254 format** (2547XXXXXXXX) for seamless M-Pesa B2C integration.

## Database Schema

### Tables

#### 1. `checkers`
Stores checker account information with phone numbers in 254 format.

```sql
- id: UUID (primary key)
- name: VARCHAR(255)
- email: VARCHAR(255) UNIQUE
- phone_number: VARCHAR(13) -- Format: 2547XXXXXXXX (enforced by CHECK constraint)
- rate_per_task: DECIMAL(10, 2)
- is_active: BOOLEAN
- total_tasks_completed: INTEGER
- total_earned: DECIMAL(10, 2)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. `checker_payments`
Tracks all automated payments to checkers.

```sql
- id: UUID (primary key)
- checker_id: UUID (foreign key)
- amount: DECIMAL(10, 2)
- phone_number: VARCHAR(13) -- Always in 254 format
- reason: VARCHAR(500)
- tasks_completed: INTEGER
- status: VARCHAR(50) -- pending, success, failed
- transaction_id: VARCHAR(255)
- initiated_at: TIMESTAMP
- completed_at: TIMESTAMP
```

#### 3. `checker_tasks`
Individual tasks completed by checkers.

```sql
- id: UUID (primary key)
- checker_id: UUID (foreign key)
- task_type: VARCHAR(100)
- content_id: UUID
- payment_amount: DECIMAL(10, 2)
- completed_at: TIMESTAMP
- paid: BOOLEAN
- payment_id: UUID (foreign key to checker_payments)
```

## API Endpoints

### 1. Checker Management

#### Create Checker
```http
POST /api/checkers
Content-Type: application/json

{
  "name": "John Kamau",
  "email": "john@example.com",
  "phoneNumber": "0712345678", // Will be converted to 254712345678
  "rate_per_task": 15.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checker created successfully",
  "checker": {
    "id": "uuid",
    "name": "John Kamau",
    "email": "john@example.com",
    "phone_number": "254712345678", // Stored in 254 format
    "rate_per_task": 15.00,
    "is_active": true
  }
}
```

#### Get All Checkers
```http
GET /api/checkers
```

#### Get Specific Checker
```http
GET /api/checkers?id=<checker-id>
```

#### Update Checker
```http
PATCH /api/checkers
Content-Type: application/json

{
  "id": "checker-id",
  "phoneNumber": "0723456789", // Will be converted to 254723456789
  "rate_per_task": 20.00,
  "is_active": true
}
```

### 2. Payment Endpoints

#### Pay Single Checker
```http
POST /api/payment/mpesa
Content-Type: application/json

{
  "checkerId": "checker-uuid",
  "amount": 150.00,
  "reason": "Weekly payment for content validation",
  "tasksCompleted": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checker payment initiated",
  "data": {
    "paymentId": "payment-uuid",
    "checkerId": "checker-uuid",
    "checkerName": "John Kamau",
    "phoneNumber": "254712345678", // Fetched from account in 254 format
    "amount": 150.00,
    "tasksCompleted": 10,
    "status": "pending"
  }
}
```

#### Batch Payment
Process payments for multiple checkers at once.

```http
POST /api/checkers/pay-batch
Content-Type: application/json

{
  "checkerIds": ["id1", "id2"], // Optional: specific checkers
  "minTasksCompleted": 5 // Optional: minimum tasks to qualify
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 10 payments, 0 failed",
  "totalCheckers": 10,
  "successfulPayments": 10,
  "failedPayments": 0,
  "payments": [
    {
      "checkerId": "uuid",
      "checkerName": "John Kamau",
      "phoneNumber": "254712345678",
      "amount": 150.00,
      "tasksCompleted": 10,
      "paymentId": "payment-uuid",
      "status": "success"
    }
  ]
}
```

#### Get Pending Payments Summary
```http
GET /api/checkers/pay-batch
```

**Response:**
```json
{
  "pendingPayments": [
    {
      "checkerId": "uuid",
      "checkerName": "John Kamau",
      "phoneNumber": "254712345678",
      "isActive": true,
      "taskCount": 10,
      "totalAmount": 150.00
    }
  ],
  "totalCheckers": 5,
  "grandTotal": 750.00
}
```

## Phone Number Format

### Automatic Conversion

The system automatically converts various phone number formats to the standard **254 format**:

| Input Format | Converted To |
|-------------|--------------|
| `0712345678` | `254712345678` |
| `712345678` | `254712345678` |
| `+254712345678` | `254712345678` |
| `254712345678` | `254712345678` |
| `0712 345 678` | `254712345678` |

### Database Enforcement

Phone numbers in the `checkers` table are enforced by a CHECK constraint:
```sql
CHECK (phone_number ~ '^254[712]\d{8}$')
```

This ensures:
- Must start with `254`
- Next digit must be `7` (Safaricom), `1` (Airtel), or `2` (Telkom)
- Must be exactly 12 digits long

### Supported Networks

- **Safaricom**: `2547XXXXXXXX`
- **Airtel**: `2541XXXXXXXX`
- **Telkom**: `2542XXXXXXXX`

## Usage Examples

### Example 1: Add New Checker
```bash
curl -X POST https://your-domain.com/api/checkers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mary Wanjiku",
    "email": "mary@example.com",
    "phoneNumber": "0723456789",
    "rate_per_task": 20.00
  }'
```

### Example 2: Pay Specific Checker
```bash
curl -X POST https://your-domain.com/api/payment/mpesa \
  -H "Content-Type: application/json" \
  -d '{
    "checkerId": "checker-uuid",
    "amount": 300.00,
    "reason": "Monthly payment",
    "tasksCompleted": 20
  }'
```

### Example 3: Batch Payment for All Eligible Checkers
```bash
curl -X POST https://your-domain.com/api/checkers/pay-batch \
  -H "Content-Type: application/json" \
  -d '{
    "minTasksCompleted": 5
  }'
```

## Automated Payment Flow

1. **Checker completes tasks** → Tasks recorded in `checker_tasks` table
2. **System triggers batch payment** → Fetches all unpaid tasks
3. **Fetches checker accounts** → Phone numbers retrieved in **254 format**
4. **Groups by checker** → Calculates total amount per checker
5. **Initiates M-Pesa B2C** → Sends payment to `254XXXXXXXXX`
6. **Records payment** → Saves to `checker_payments` table
7. **Marks tasks as paid** → Updates `checker_tasks.paid = true`
8. **M-Pesa callback** → Updates payment status to `success`/`failed`
9. **Updates checker stats** → Increments `total_earned` and `total_tasks_completed`

## Database Setup

Run the SQL schema:

```bash
psql -U your_user -d your_database -f database/schema.sql
```

Or in Supabase:
1. Go to SQL Editor
2. Paste contents of `database/schema.sql`
3. Click "Run"

## Integration with M-Pesa B2C

To integrate with actual M-Pesa B2C API, update the payment endpoint with:

```typescript
// In src/app/api/payment/mpesa/route.ts

// Replace TODO section with actual M-Pesa B2C call
const mpesaResponse = await fetch('https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    InitiatorName: process.env.MPESA_INITIATOR_NAME,
    SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    CommandID: 'BusinessPayment',
    Amount: amount,
    PartyA: process.env.MPESA_SHORTCODE,
    PartyB: phoneNumber, // Already in 254 format
    Remarks: reason,
    QueueTimeOutURL: `${process.env.APP_URL}/api/payment/mpesa/timeout`,
    ResultURL: `${process.env.APP_URL}/api/payment/mpesa/callback`,
    Occasion: reason
  })
});
```

## Security Notes

1. **Phone validation** happens on both client and server
2. **Database constraints** enforce 254 format
3. **Active checker check** ensures only active accounts get paid
4. **Transaction logging** tracks all payment attempts
5. **Idempotency** prevents duplicate payments

## Monitoring & Analytics

Use the provided view for payment summaries:

```sql
SELECT * FROM checker_payment_summary;
```

Returns:
- Total payments per checker
- Total amount paid
- Pending amounts
- Last payment date
- Phone numbers (in 254 format)

---

## Support

For M-Pesa integration support:
- [Safaricom Daraja API](https://developer.safaricom.co.ke/)
- [M-Pesa B2C Documentation](https://developer.safaricom.co.ke/APIs/BusinessToCustomer)
