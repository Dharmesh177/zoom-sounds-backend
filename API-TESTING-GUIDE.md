# API Testing Guide - Warranty Claim System

## Quick Test with Postman/Thunder Client

### 1. Test Serial Verification (First Time)

**GET** `http://localhost:3000/api/serialNumbers/verify/ZS-ABC123XYZ456`

Expected Response:
```json
{
  "claimed": false,
  "claimedWarranty": false,
  "warrantyExpireTime": {
    "totalDays": 365
  }
}
```

---

### 2. Initiate Warranty Claim (Send OTP)

**POST** `http://localhost:3000/api/serialNumbers/warranty/claim/initiate`

Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "serialNumber": "ZS-ABC123XYZ456",
  "customerName": "Test Customer",
  "email": "test@example.com",
  "phone": "9876543210"
}
```

Expected Response:
```json
{
  "status": "success",
  "message": "OTP sent successfully to your phone number"
}
```

**Note:** Check backend console logs for OTP in development mode.

---

### 3. Verify OTP and Complete Claim

**POST** `http://localhost:3000/api/serialNumbers/warranty/claim/verify`

Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "serialNumber": "ZS-ABC123XYZ456",
  "phone": "9876543210",
  "otp": "123456"
}
```

Expected Response:
```json
{
  "status": "success",
  "message": "Warranty claimed successfully!",
  "data": {
    "customer": { ... },
    "warranty": {
      "status": "active",
      "durationDays": 365
    }
  }
}
```

---

### 4. Verify Serial Again (After Claim)

**GET** `http://localhost:3000/api/serialNumbers/verify/ZS-ABC123XYZ456`

Expected Response:
```json
{
  "claimed": true,
  "claimedWarranty": true,
  "warrantyExpireTime": {
    "daysRemaining": 365,
    "isExpired": false
  },
  "customerInfo": { ... }
}
```

---

### 5. Get Warranty Details

**GET** `http://localhost:3000/api/serialNumbers/warranty/ZS-ABC123XYZ456`

Expected Response:
```json
{
  "claimed": true,
  "data": {
    "warranty": {
      "status": "active",
      "daysRemaining": 365
    }
  }
}
```

---

### 6. Resend OTP (if needed)

**POST** `http://localhost:3000/api/serialNumbers/warranty/claim/resend-otp`

Body:
```json
{
  "serialNumber": "ZS-ABC123XYZ456",
  "phone": "9876543210"
}
```

---

### 7. Get All Customer Warranties (Admin Only)

**GET** `http://localhost:3000/api/serialNumbers/warranty-claims/all`

Headers:
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

Query Parameters (all optional):
```
?page=1              // Page number (default: 1)
&limit=10            // Records per page (default: 10, max: 100)
&status=active       // Filter by status: active, expired, cancelled
&email=john@test.com // Filter by customer email
&phone=9876543210    // Filter by phone number
```

**Example Requests:**

Default (first 10 records):
```
GET http://localhost:3000/api/serialNumbers/warranty-claims/all
```

With pagination:
```
GET http://localhost:3000/api/serialNumbers/warranty-claims/all?page=2&limit=20
```

Filter active warranties:
```
GET http://localhost:3000/api/serialNumbers/warranty-claims/all?status=active
```

Search by email:
```
GET http://localhost:3000/api/serialNumbers/warranty-claims/all?email=john
```

Expected Response:
```json
{
  "status": "success",
  "results": 10,
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 47,
    "recordsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": [
    {
      "_id": "65abc123...",
      "customer": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210"
      },
      "warranty": {
        "status": "active",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2025-01-01T00:00:00.000Z",
        "daysRemaining": 245,
        "isExpired": false
      },
      "product": {
        "name": "Premium DJ System",
        "category": "DJ Equipment",
        "warranty": 365,
        "price": 50000
      },
      "serialNumber": {
        "serialNumber": "ZS-ABC123XYZ456",
        "isVerified": true
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Test Error Scenarios

### Invalid Phone Number
```json
{
  "phone": "1234567890"  // Should start with 6-9
}
```
Expected: 400 error

### Invalid OTP (3 times)
Try with wrong OTP 3 times → Should block further attempts

### Expired OTP
Wait 10 minutes after requesting OTP → Should get expiry error

### Already Claimed
Try to claim same serial number again → Should get error

---

## Development Mode Testing

Add to `snsService.js` for testing without AWS:

```javascript
// At the top of sendOTPViaSNS function
if (process.env.NODE_ENV === 'development') {
  console.log(`📱 [DEV MODE] OTP for ${phone}: ${otp}`);
  return { MessageId: 'dev-test-' + Date.now() };
}
```

Then check console logs for OTP instead of receiving SMS.

---

## cURL Commands

### Initiate Claim
```bash
curl -X POST http://localhost:3000/api/serialNumbers/warranty/claim/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "serialNumber": "ZS-ABC123XYZ456",
    "customerName": "Test Customer",
    "email": "test@example.com",
    "phone": "9876543210"
  }'
```

### Verify OTP
```bash
curl -X POST http://localhost:3000/api/serialNumbers/warranty/claim/verify \
  -H "Content-Type: application/json" \
  -d '{
    "serialNumber": "ZS-ABC123XYZ456",
    "phone": "9876543210",
    "otp": "123456"
  }'
```

---

## MongoDB Queries for Testing

```javascript
// Check OTP records
db.otps.find().pretty()

// Check warranty claims
db.customerwarranties.find().pretty()

// Check serial number status
db.serialnumbers.find({ serialNumber: "ZS-ABC123XYZ456" }).pretty()

// Clean up test data
db.otps.deleteMany({ phone: "9876543210" })
db.customerwarranties.deleteMany({ phone: "9876543210" })
db.serialnumbers.updateOne(
  { serialNumber: "ZS-ABC123XYZ456" },
  { $set: { claimedWarranty: false, claimedAt: null } }
)
```
