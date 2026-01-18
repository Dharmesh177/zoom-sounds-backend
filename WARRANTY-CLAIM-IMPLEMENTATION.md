# Warranty Claim System - Implementation Guide

## Overview
This system allows customers to claim warranty for products by scanning QR codes. The flow includes OTP verification via AWS SNS.

## Database Schema

### 1. SerialNumber Model (Updated)
**New Fields Added:**
- `claimedWarranty`: Boolean - Tracks if warranty has been claimed
- `claimedAt`: Date - Timestamp when warranty was claimed

### 2. CustomerWarranty Model (New)
**Purpose**: Store customer warranty claim details

**Fields:**
- `customerName`: String - Customer's full name
- `email`: String - Customer's email address
- `phone`: String - Customer's phone number
- `serialNumberId`: ObjectId (ref: SerialNumber) - Reference to serial number
- `productId`: ObjectId (ref: Product) - Reference to product
- `warrantyStartDate`: Date - Warranty claim date
- `warrantyEndDate`: Date - Warranty expiration date
- `status`: Enum ['active', 'expired', 'cancelled'] - Warranty status

**Indexes:**
- Unique index on `serialNumberId` (one claim per serial)
- Compound index on `email` and `phone`
- Compound index on `productId` and `status`

### 3. OTP Model (New)
**Purpose**: Store and validate OTPs for warranty claims

**Fields:**
- `phone`: String - Customer's phone number
- `otp`: String - 6-digit OTP
- `serialNumber`: String - Serial number being claimed
- `email`: String - Customer's email
- `customerName`: String - Customer's name
- `productId`: ObjectId (ref: Product)
- `serialNumberId`: ObjectId (ref: SerialNumber)
- `isVerified`: Boolean - OTP verification status
- `expiresAt`: Date - OTP expiration time (TTL index)
- `attempts`: Number - Failed verification attempts

**Features:**
- TTL index on `expiresAt` - Auto-deletes expired OTPs
- Max 3 verification attempts
- 10-minute expiration

---

## API Endpoints

### 1. Verify Serial Number (Updated)
**GET** `/api/serialNumbers/verify/:serialNumber`

**Purpose**: Scan QR code and check warranty status

**Response (First Time - Not Claimed):**
```json
{
  "status": "success",
  "valid": true,
  "claimed": false,
  "claimedWarranty": false,
  "message": "Serial number verified successfully. Please claim your warranty.",
  "warrantyExpireTime": {
    "totalDays": 365,
    "warrantyPeriod": "365 days from claim date"
  },
  "product": { /* product details */ },
  "serialData": { /* serial number data */ }
}
```

**Response (Already Claimed):**
```json
{
  "status": "success",
  "valid": true,
  "claimed": true,
  "claimedWarranty": true,
  "message": "Warranty is active",
  "warrantyStatus": "active",
  "warrantyExpireTime": {
    "daysRemaining": 245,
    "hoursRemaining": 12,
    "totalDays": 365,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2025-01-01T00:00:00.000Z",
    "isExpired": false
  },
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "claimedAt": "2024-01-01T00:00:00.000Z"
  },
  "product": { /* product details */ },
  "serialData": { /* serial number data */ }
}
```

---

### 2. Initiate Warranty Claim (New)
**POST** `/api/serialNumbers/warranty/claim/initiate`

**Purpose**: Start warranty claim process - sends OTP to customer's phone

**Request Body:**
```json
{
  "serialNumber": "ZS-ABC123XYZ456",
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210"
}
```

**Validation:**
- `serialNumber`: Required
- `customerName`: 2-100 characters, required
- `email`: Valid email format, required
- `phone`: 10-digit Indian number (6-9 prefix), required

**Response (Success):**
```json
{
  "status": "success",
  "message": "OTP sent successfully to your phone number",
  "data": {
    "phone": "9876543210",
    "expiresIn": "10 minutes"
  }
}
```

**Error Responses:**
- 404: Serial number not found
- 400: Warranty already claimed
- 403: Serial number deactivated
- 500: Failed to send OTP

---

### 3. Verify OTP and Complete Claim (New)
**POST** `/api/serialNumbers/warranty/claim/verify`

**Purpose**: Verify OTP and complete warranty registration

**Request Body:**
```json
{
  "serialNumber": "ZS-ABC123XYZ456",
  "phone": "9876543210",
  "otp": "123456"
}
```

**Validation:**
- `serialNumber`: Required
- `phone`: 10-digit number, required
- `otp`: Exactly 6 digits, required

**Response (Success):**
```json
{
  "status": "success",
  "message": "Warranty claimed successfully!",
  "data": {
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    "warranty": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2025-01-01T00:00:00.000Z",
      "durationDays": 365,
      "status": "active"
    },
    "product": {
      "name": "Premium DJ System",
      "category": "DJ Equipment"
    },
    "serialNumber": "ZS-ABC123XYZ456"
  }
}
```

**Error Responses:**
- 404: No pending OTP found
- 400: OTP expired
- 400: Maximum attempts exceeded (after 3 failed attempts)
- 400: Invalid OTP (with remaining attempts count)
- 400: Warranty already claimed

---

### 4. Resend OTP (New)
**POST** `/api/serialNumbers/warranty/claim/resend-otp`

**Purpose**: Resend OTP if not received or expired

**Request Body:**
```json
{
  "serialNumber": "ZS-ABC123XYZ456",
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "OTP resent successfully",
  "data": {
    "phone": "9876543210",
    "expiresIn": "10 minutes"
  }
}
```

---

### 5. Get Warranty Details (New)
**GET** `/api/serialNumbers/warranty/:serialNumber`

**Purpose**: Get complete warranty information for a serial number

**Response (Claimed):**
```json
{
  "status": "success",
  "claimed": true,
  "data": {
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
      "isExpired": false,
      "claimedAt": "2024-01-01T00:00:00.000Z"
    },
    "product": { /* full product details */ },
    "serialNumber": "ZS-ABC123XYZ456"
  }
}
```

**Response (Not Claimed):**
```json
{
  "status": "success",
  "claimed": false,
  "message": "Warranty has not been claimed yet"
}
```

---

### 6. Get All Customer Warranties - Admin Only (New)
**GET** `/api/serialNumbers/warranty-claims/all`

**Purpose**: Get paginated list of all warranty claims (admin dashboard)

**Headers:**
```
token: <admin_token>
```

**Query Parameters (all optional):**
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 10, max: 100)
- `status` - Filter: 'active', 'expired', 'cancelled'
- `email` - Filter by customer email (partial match)
- `phone` - Filter by phone number (exact match)

**Example URLs:**
```
GET /api/serialNumbers/warranty-claims/all
GET /api/serialNumbers/warranty-claims/all?page=2&limit=20
GET /api/serialNumbers/warranty-claims/all?status=active
GET /api/serialNumbers/warranty-claims/all?email=john
```

**Response:**
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
        "warranty": 365
      },
      "serialNumber": {
        "serialNumber": "ZS-ABC123XYZ456"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 🚀 FRONTEND INTEGRATION GUIDE

### Complete User Flow (Step by Step)

#### FLOW 1: First Time QR Scan

**Step 1: Scan QR Code**
```javascript
const BASE_URL = 'https://api.zsindia.com'; // or your API URL

async function scanQRCode(serialNumber) {
  try {
    const response = await fetch(`${BASE_URL}/api/serialNumbers/verify/${serialNumber}`);
    const data = await response.json();
    
    if (data.claimed === false) {
      // Warranty not claimed - show claim form
      showClaimForm(serialNumber, data.product);
    } else {
      // Warranty already claimed - show warranty card
      showWarrantyCard(data);
    }
  } catch (error) {
    showError('Failed to verify serial number');
  }
}
```

**Step 2: Show Claim Form (If not claimed)**
```html
<!-- Claim Form UI -->
<div id="claimForm">
  <h2>Claim Your Warranty</h2>
  <input type="text" id="customerName" placeholder="Full Name" required />
  <input type="email" id="email" placeholder="Email" required />
  <input type="tel" id="phone" placeholder="Phone (10 digits)" pattern="[6-9][0-9]{9}" required />
  <button onclick="initiateWarrantyClaim()">Claim Warranty</button>
</div>
```

```javascript
async function initiateWarrantyClaim() {
  const claimData = {
    serialNumber: currentSerialNumber, // From QR scan
    customerName: document.getElementById('customerName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/serialNumbers/warranty/claim/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // OTP sent successfully - show OTP form
      showOTPForm(claimData.phone);
    } else {
      showError(data.message || 'Failed to send OTP');
    }
  } catch (error) {
    showError('Network error. Please try again.');
  }
}
```

**Step 3: Show OTP Form**
```html
<!-- OTP Verification UI -->
<div id="otpForm">
  <h2>Verify OTP</h2>
  <p>Enter the 6-digit code sent to +91-9876543210</p>
  <input type="text" id="otp" placeholder="Enter OTP" maxlength="6" pattern="[0-9]{6}" />
  <button onclick="verifyOTP()">Verify & Claim</button>
  <button onclick="resendOTP()">Resend OTP</button>
  <p id="timer">Time remaining: 10:00</p>
</div>
```

```javascript
async function verifyOTP() {
  const otpData = {
    serialNumber: currentSerialNumber,
    phone: currentPhone,
    otp: document.getElementById('otp').value
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/serialNumbers/warranty/claim/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(otpData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Success! Show warranty card
      showSuccessMessage(data.data);
    } else {
      // Show error with attempts remaining
      showError(data.message);
    }
  } catch (error) {
    showError('Verification failed. Please try again.');
  }
}

async function resendOTP() {
  try {
    const response = await fetch(`${BASE_URL}/api/serialNumbers/warranty/claim/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serialNumber: currentSerialNumber,
        phone: currentPhone
      })
    });
    
    if (response.ok) {
      showMessage('OTP sent again!');
      resetTimer(); // Reset 10-minute timer
    }
  } catch (error) {
    showError('Failed to resend OTP');
  }
}
```

**Step 4: Show Success & Warranty Card**
```html
<!-- Warranty Card UI -->
<div id="warrantyCard">
  <h2>✅ Warranty Registered Successfully!</h2>
  
  <div class="customer-info">
    <h3>Customer Details</h3>
    <p>Name: <span id="custName"></span></p>
    <p>Email: <span id="custEmail"></span></p>
    <p>Phone: <span id="custPhone"></span></p>
  </div>
  
  <div class="warranty-info">
    <h3>Warranty Information</h3>
    <p>Product: <span id="productName"></span></p>
    <p>Serial Number: <span id="serialNum"></span></p>
    <p>Warranty Period: <span id="warrantyDays"></span> days</p>
    <p>Valid Until: <span id="expiryDate"></span></p>
    <div class="progress-bar">
      <div class="progress" id="warrantyProgress"></div>
    </div>
    <p>Days Remaining: <span id="daysLeft"></span></p>
  </div>
</div>
```

```javascript
function showSuccessMessage(warrantyData) {
  document.getElementById('custName').textContent = warrantyData.customer.name;
  document.getElementById('custEmail').textContent = warrantyData.customer.email;
  document.getElementById('custPhone').textContent = warrantyData.customer.phone;
  document.getElementById('productName').textContent = warrantyData.product.name;
  document.getElementById('serialNum').textContent = warrantyData.serialNumber;
  document.getElementById('warrantyDays').textContent = warrantyData.warranty.durationDays;
  document.getElementById('expiryDate').textContent = new Date(warrantyData.warranty.endDate).toLocaleDateString();
  
  // Show warranty card
  document.getElementById('warrantyCard').style.display = 'block';
  document.getElementById('otpForm').style.display = 'none';
}
```

---

#### FLOW 2: Subsequent QR Scans (Already Claimed)

```javascript
function showWarrantyCard(data) {
  const warranty = data.warrantyExpireTime;
  const customer = data.customerInfo;
  const product = data.product;
  
  // Calculate progress percentage
  const totalDays = warranty.totalDays;
  const daysRemaining = warranty.daysRemaining;
  const progressPercent = (daysRemaining / totalDays) * 100;
  
  // Update UI
  document.getElementById('custName').textContent = customer.name;
  document.getElementById('custEmail').textContent = customer.email;
  document.getElementById('custPhone').textContent = customer.phone;
  document.getElementById('productName').textContent = product.name;
  document.getElementById('serialNum').textContent = data.serialData.serialNumber;
  document.getElementById('daysLeft').textContent = daysRemaining;
  document.getElementById('expiryDate').textContent = new Date(warranty.endDate).toLocaleDateString();
  
  // Update progress bar
  document.getElementById('warrantyProgress').style.width = progressPercent + '%';
  
  // Check if expired
  if (warranty.isExpired) {
    showExpiredWarning();
  }
  
  // Show warranty card
  document.getElementById('warrantyCard').style.display = 'block';
}
```

---

#### FLOW 3: Admin Dashboard - View All Warranties

```javascript
let currentPage = 1;
const recordsPerPage = 10;

async function loadWarranties(page = 1, filters = {}) {
  const adminToken = localStorage.getItem('adminToken'); // Your auth token
  
  // Build query string
  const params = new URLSearchParams({
    page: page,
    limit: recordsPerPage,
    ...filters
  });
  
  try {
    const response = await fetch(`${BASE_URL}/api/serial-numbers/warranty-claims/all?${params}`, {
      headers: {
        'token': `${adminToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      displayWarrantiesTable(data.data);
      displayPagination(data.pagination);
    } else {
      showError('Failed to load warranties');
    }
  } catch (error) {
    showError('Network error');
  }
}

function displayWarrantiesTable(warranties) {
  const tableBody = document.getElementById('warrantiesTable');
  tableBody.innerHTML = '';
  
  warranties.forEach(warranty => {
    const row = `
      <tr>
        <td>${warranty.customer.name}</td>
        <td>${warranty.customer.email}</td>
        <td>${warranty.customer.phone}</td>
        <td>${warranty.product.name}</td>
        <td>${warranty.serialNumber.serialNumber}</td>
        <td>${warranty.warranty.daysRemaining} days</td>
        <td class="${warranty.warranty.status}">${warranty.warranty.status}</td>
        <td>${new Date(warranty.createdAt).toLocaleDateString()}</td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

function displayPagination(pagination) {
  const paginationDiv = document.getElementById('pagination');
  paginationDiv.innerHTML = `
    <button onclick="loadWarranties(${pagination.currentPage - 1})" 
            ${!pagination.hasPrevPage ? 'disabled' : ''}>Previous</button>
    <span>Page ${pagination.currentPage} of ${pagination.totalPages}</span>
    <button onclick="loadWarranties(${pagination.currentPage + 1})" 
            ${!pagination.hasNextPage ? 'disabled' : ''}>Next</button>
    <p>Total Records: ${pagination.totalRecords}</p>
  `;
}

// Filter warranties
function filterWarranties() {
  const filters = {
    status: document.getElementById('filterStatus').value,
    email: document.getElementById('filterEmail').value,
    phone: document.getElementById('filterPhone').value
  };
  
  // Remove empty filters
  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });
  
  loadWarranties(1, filters);
}
```

```html
<!-- Admin Dashboard UI -->
<div id="adminDashboard">
  <h2>Warranty Claims Dashboard</h2>
  
  <!-- Filters -->
  <div class="filters">
    <select id="filterStatus">
      <option value="">All Status</option>
      <option value="active">Active</option>
      <option value="expired">Expired</option>
      <option value="cancelled">Cancelled</option>
    </select>
    <input type="email" id="filterEmail" placeholder="Search by email" />
    <input type="tel" id="filterPhone" placeholder="Search by phone" />
    <button onclick="filterWarranties()">Apply Filters</button>
  </div>
  
  <!-- Table -->
  <table>
    <thead>
      <tr>
        <th>Customer Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Product</th>
        <th>Serial Number</th>
        <th>Days Remaining</th>
        <th>Status</th>
        <th>Claimed Date</th>
      </tr>
    </thead>
    <tbody id="warrantiesTable"></tbody>
  </table>
  
  <!-- Pagination -->
  <div id="pagination"></div>
</div>
```

---

## 📱 Frontend Validation Rules

### Customer Name
```javascript
- Min length: 2 characters
- Max length: 100 characters
- Required: Yes
- Pattern: Letters and spaces only
```

### Email
```javascript
- Format: Valid email (name@domain.com)
- Required: Yes
- Example: john.doe@example.com
```

### Phone Number
```javascript
- Format: 10 digits
- Pattern: Must start with 6, 7, 8, or 9
- Required: Yes
- Example: 9876543210 (without +91)
```

### OTP
```javascript
- Length: Exactly 6 digits
- Pattern: Numbers only
- Required: Yes
- Example: 123456
```

---

## ⚠️ Error Handling Guide

### Common Errors & UI Messages

**Invalid Phone Number:**
```javascript
if (!phone.match(/^[6-9][0-9]{9}$/)) {
  showError('Please enter a valid 10-digit phone number starting with 6-9');
}
```

**Invalid Email:**
```javascript
if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
  showError('Please enter a valid email address');
}
```

**OTP Expired:**
```javascript
// Backend returns: "OTP has expired. Please request a new OTP."
// Show UI:
showError('Your verification code has expired. Please click "Resend OTP"');
enableResendButton();
```

**Invalid OTP:**
```javascript
// Backend returns: "Invalid OTP. 2 attempts remaining."
// Show UI with attempts count:
showError(`Incorrect code. You have ${attemptsLeft} attempts remaining`);
```

**Maximum Attempts:**
```javascript
// Backend returns: "Maximum verification attempts exceeded..."
// Show UI:
showError('Too many failed attempts. Please request a new verification code');
resetOTPForm();
```

**Warranty Already Claimed:**
```javascript
// Backend returns: "Warranty has already been claimed"
// Show UI:
showError('This product warranty has already been registered');
showWarrantyDetails(); // Fetch and show existing warranty
```

---

## 🎨 UI/UX Recommendations

### 1. Loading States
```javascript
function setLoading(isLoading) {
  const button = document.getElementById('submitBtn');
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Please wait...' : 'Submit';
}
```

### 2. OTP Timer
```javascript
let timeLeft = 600; // 10 minutes in seconds

function startTimer() {
  const timer = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timer);
      showError('OTP expired. Please request a new one');
      enableResendButton();
      return;
    }
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = 
      `Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    timeLeft--;
  }, 1000);
}
```

### 3. Warranty Progress Bar
```javascript
function updateProgressBar(daysRemaining, totalDays) {
  const percentage = (daysRemaining / totalDays) * 100;
  const progressBar = document.getElementById('warrantyProgress');
  
  progressBar.style.width = percentage + '%';
  
  // Color coding
  if (percentage > 50) {
    progressBar.style.backgroundColor = '#10b981'; // Green
  } else if (percentage > 25) {
    progressBar.style.backgroundColor = '#f59e0b'; // Orange
  } else {
    progressBar.style.backgroundColor = '#ef4444'; // Red
  }
}
```

### 4. Success Animation
```javascript
function showSuccessAnimation() {
  const successIcon = document.getElementById('successIcon');
  successIcon.classList.add('animate-checkmark');
  playSuccessSound(); // Optional
}
```

---

## 🔧 Testing in Development

### Skip OTP for Testing
```javascript
// For development only - bypass OTP verification
if (process.env.NODE_ENV === 'development') {
  // Use fixed OTP: 123456
  console.log('DEV MODE: Use OTP 123456');
}
```

### Mock API Responses (Frontend)  return { MessageId: 'dev-' + Date.now() };
}
```

**Option 2: Mock SMS Service**
Create a mock service for testing:
```javascript
// utils/mockSNS.js
export const sendOTPViaSNS = async (phone, otp) => {
  console.log(`📱 SMS to ${phone}: Your OTP is ${otp}`);
  return { MessageId: 'mock-' + Date.now() };
};
```

### Test Cases

1. **First Time Scan:**
   - Scan QR → Get `claimed: false`
   - Click "Claim Warranty" → OTP sent
   - Enter OTP → Warranty registered
   - Scan again → Get warranty details

2. **Invalid OTP:**
   - Enter wrong OTP 3 times → Blocked
   - Request new OTP → Can try again

3. **Expired OTP:**
   - Wait 10 minutes → OTP expires
   - Resend OTP → New OTP sent

4. **Already Claimed:**
   - Try to claim again → Error message

---

## Database Indexes

Ensure these indexes exist for performance:

```javascript
// SerialNumber
db.serialnumbers.createIndex({ serialNumber: 1 }, { unique: true })
db.serialnumbers.createIndex({ productId: 1, status: 1 })
db.serialnumbers.createIndex({ claimedWarranty: 1 })

// CustomerWarranty
db.customerwarranties.createIndex({ serialNumberId: 1 }, { unique: true })
db.customerwarranties.createIndex({ email: 1, phone: 1 })
db.customerwarranties.createIndex({ productId: 1, status: 1 })

// OTP
db.otps.createIndex({ phone: 1, serialNumber: 1, isVerified: 1 })
db.otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

## Security Considerations

1. **Rate Limiting:**
   - Limit OTP requests to 3 per phone number per hour
   - Implement at API gateway level

2. **Phone Number Validation:**
   - Only accept Indian numbers (10 digits, 6-9 prefix)
   - Validate format before sending OTP

3. **OTP Security:**
   - 6-digit random OTP
   - 10-minute expiration
   - Max 3 verification attempts
   - Auto-delete after verification

4. **Data Privacy:**
   - Store minimal customer data
   - Hash sensitive information if required
   - Implement GDPR-compliant data deletion

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `SERIAL_NOT_FOUND`: Serial number doesn't exist
- `WARRANTY_ALREADY_CLAIMED`: Already registered
- `OTP_EXPIRED`: OTP has expired
- `OTP_INVALID`: Wrong OTP entered
- `MAX_ATTEMPTS`: Too many failed attempts
- `SMS_FAILED`: Failed to send SMS

---

## Monitoring

### Recommended Metrics

1. **Warranty Claims:**
   - Total claims per day/month
   - Success rate of OTP verification
   - Average time to complete claim

2. **SMS Usage:**
   - Total OTPs sent
   - Failed SMS deliveries
   - Cost per month

3. **Customer Behavior:**
   - Average verification attempts
   - OTP resend rate
   - Time from scan to claim

### MongoDB Queries

```javascript
// Total claimed warranties
db.customerwarranties.countDocuments({ status: 'active' })

// Active warranties expiring in next 30 days
const thirtyDaysFromNow = new Date();
thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
db.customerwarranties.find({
  status: 'active',
  warrantyEndDate: { $lte: thirtyDaysFromNow }
})

// OTP success rate (last 7 days)
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
db.otps.aggregate([
  { $match: { createdAt: { $gte: sevenDaysAgo } } },
  { $group: {
    _id: null,
    total: { $sum: 1 },
    verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
  }}
])
```

---

## Production Checklist

- [ ] AWS SNS credentials configured
- [ ] AWS SNS sender ID approved (for India)
- [ ] MongoDB indexes created
- [ ] Rate limiting implemented
- [ ] Error logging configured
- [ ] SMS cost monitoring set up
- [ ] Frontend validation added
- [ ] Test all OTP flows
- [ ] Document API for frontend team
- [ ] Set up alerts for failed SMS

---

## Support

For issues or questions:
1. Check error logs in CloudWatch (AWS)
2. Monitor OTP delivery status in SNS console
3. Review MongoDB slow query logs
4. Test with development phone numbers first

---

**Last Updated:** January 4, 2026
**Version:** 1.0.0
