# Payment Integration Guide

## M-Pesa Phone Number Format

The payment system automatically formats phone numbers to the Kenyan M-Pesa standard format: **2547XXXXXXXX**

### Supported Input Formats

The system accepts various phone number formats and converts them to the standard format:

| Input Format | Example | Converted To |
|-------------|---------|--------------|
| Local (0-prefix) | `0712345678` | `254712345678` |
| Local (no 0) | `712345678` | `254712345678` |
| International (+) | `+254712345678` | `254712345678` |
| Country code | `254712345678` | `254712345678` |
| With spaces | `0712 345 678` | `254712345678` |
| With hyphens | `0712-345-678` | `254712345678` |

### Supported Networks

- **Safaricom** (7XX): `2547XXXXXXXX`
- **Airtel** (1XX): `2541XXXXXXXX`
- **Telkom** (2XX): `2542XXXXXXXX`

### API Usage

#### 1. Import the utilities

```typescript
import { 
  formatKenyanPhoneNumber, 
  isValidKenyanPhone, 
  initiatePayment 
} from '@/lib/mpesa';
```

#### 2. Format a phone number

```typescript
const phoneNumber = "0712345678";
const formatted = formatKenyanPhoneNumber(phoneNumber);
// Result: "254712345678"
```

#### 3. Validate a phone number

```typescript
const isValid = isValidKenyanPhone("0712345678");
// Result: true
```

#### 4. Initiate a payment

```typescript
const result = await initiatePayment({
  phoneNumber: "0712345678",
  amount: 100,
  accountReference: "Pro Plan",
  transactionDesc: "Monthly Subscription"
});

if (result.success) {
  console.log("Payment initiated:", result.data);
} else {
  console.error("Payment failed:", result.error);
}
```

### API Endpoint

**POST** `/api/payment/mpesa`

#### Request Body

```json
{
  "phoneNumber": "0712345678",
  "amount": 100,
  "accountReference": "Pro Plan",
  "transactionDesc": "Monthly Subscription"
}
```

#### Response (Success)

```json
{
  "success": true,
  "message": "Payment request initiated",
  "data": {
    "phoneNumber": "254712345678",
    "amount": 100,
    "accountReference": "Pro Plan",
    "transactionDesc": "Monthly Subscription"
  }
}
```

#### Response (Error)

```json
{
  "error": "Invalid phone number format. Must be a valid Kenyan mobile number."
}
```

### Using the Payment Modal Component

```tsx
import { PaymentModal } from "@/components/PaymentModal";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Subscribe Now
      </Button>

      <PaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        amount={1499}
        planName="Pro"
      />
    </>
  );
}
```

### Testing

Run the phone number format tests:

```bash
# If using TypeScript/Node
npx ts-node tests/test-phone-format.ts

# Or with a test runner
npm test tests/test-phone-format.ts
```

### Error Handling

The system validates phone numbers and returns clear error messages:

- **Invalid prefix**: "Invalid Kenyan phone number. Must start with 7, 1, or 2..."
- **Wrong length**: Numbers must be exactly 9 digits (after removing prefix)
- **Invalid characters**: Only digits are allowed (spaces and hyphens are automatically removed)

### Security Notes

1. Phone numbers are validated on both client and server side
2. All requests require proper format before processing
3. Amount validation ensures positive values only
4. Server-side validation prevents malformed requests

### Integration Steps

1. **Set up environment variables** (for actual M-Pesa integration):
   ```env
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_SHORTCODE=your_shortcode
   MPESA_PASSKEY=your_passkey
   MPESA_CALLBACK_URL=your_callback_url
   ```

2. **Update the API route** with actual M-Pesa credentials and logic
3. **Test with M-Pesa sandbox** before going live
4. **Implement callback handler** for transaction status updates

### Example: Complete Payment Flow

```typescript
// 1. User clicks payment button
<Button onClick={() => setShowPayment(true)}>
  Pay KES 1,499
</Button>

// 2. Payment modal opens with phone input
<PaymentModal
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  amount={1499}
  planName="Pro"
/>

// 3. User enters phone: "0712345678"
// 4. System formats to: "254712345678"
// 5. Payment request sent to M-Pesa API
// 6. User receives STK push on their phone
// 7. User enters M-Pesa PIN
// 8. Transaction completes
```

---

## Additional Resources

- [Safaricom M-Pesa API Documentation](https://developer.safaricom.co.ke/)
- [M-Pesa Sandbox Testing](https://developer.safaricom.co.ke/test_credentials)
- [Daraja API Reference](https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate)
