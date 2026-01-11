# 🚀 Warranty Claim - Frontend Quick Start Guide

## API Base URL
```
Production: https://api.zsindia.com
Development: http://localhost:5000
```

---

## 📋 Complete Integration in 5 Steps

### Step 1: Scan QR Code
**API:** `GET /api/v1/serial-numbers/verify/:serialNumber`

**What to do:**
- User scans QR code → Get serial number
- Call API with serial number
- If `claimed = false` → Show claim form
- If `claimed = true` → Show warranty card

**Code:**
```javascript
const response = await fetch(`${API_URL}/api/v1/serial-numbers/verify/${serialNumber}`);
const data = await response.json();

if (data.claimed === false) {
  showClaimForm(); // User needs to claim warranty
} else {
  showWarrantyCard(data); // Warranty already claimed
}
```

---

### Step 2: Claim Warranty (Send OTP)
**API:** `POST /api/v1/serial-numbers/warranty/claim/initiate`

**Form Fields:**
- Customer Name (2-100 chars)
- Email (valid email)
- Phone (10 digits, starts with 6-9)

**Code:**
```javascript
const formData = {
  serialNumber: "ZS-ABC123", // From QR scan
  customerName: "John Doe",
  email: "john@example.com",
  phone: "9876543210" // No +91
};

const response = await fetch(`${API_URL}/api/v1/serial-numbers/warranty/claim/initiate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

if (response.ok) {
  showOTPForm(); // OTP sent successfully
}
```

---

### Step 3: Verify OTP
**API:** `POST /api/v1/serial-numbers/warranty/claim/verify`

**What to do:**
- Show OTP input (6 digits)
- Show 10-minute timer
- Allow 3 attempts
- Show "Resend OTP" button

**Code:**
```javascript
const otpData = {
  serialNumber: "ZS-ABC123",
  phone: "9876543210",
  otp: "123456" // User input
};

const response = await fetch(`${API_URL}/api/v1/serial-numbers/warranty/claim/verify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(otpData)
});

const result = await response.json();

if (response.ok) {
  showSuccessMessage(result.data); // Warranty claimed!
} else {
  showError(result.message); // Shows "Invalid OTP. 2 attempts remaining"
}
```

---

### Step 4: Resend OTP (if needed)
**API:** `POST /api/v1/serial-numbers/warranty/claim/resend-otp`

**Code:**
```javascript
const response = await fetch(`${API_URL}/api/v1/serial-numbers/warranty/claim/resend-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serialNumber: "ZS-ABC123",
    phone: "9876543210"
  })
});

if (response.ok) {
  showMessage("OTP sent again!");
  resetTimer(); // Start 10-min timer again
}
```

---

### Step 5: Display Warranty Card
**What to show:**
- Customer name, email, phone
- Product name
- Serial number
- Warranty period (365 days)
- Days remaining
- Expiry date
- Progress bar (green/orange/red)

**Code:**
```javascript
function showWarrantyCard(data) {
  const warranty = data.warrantyExpireTime;
  const customer = data.customerInfo;
  
  // Update UI elements
  document.getElementById('custName').textContent = customer.name;
  document.getElementById('daysLeft').textContent = warranty.daysRemaining;
  document.getElementById('expiryDate').textContent = 
    new Date(warranty.endDate).toLocaleDateString();
  
  // Progress bar
  const progress = (warranty.daysRemaining / warranty.totalDays) * 100;
  document.getElementById('progressBar').style.width = progress + '%';
  
  // Expired check
  if (warranty.isExpired) {
    showExpiredBadge();
  }
}
```

---

## 🎨 UI Components Needed

### 1. Claim Form
```html
<form id="claimForm">
  <input type="text" id="name" placeholder="Full Name" required />
  <input type="email" id="email" placeholder="Email" required />
  <input type="tel" id="phone" placeholder="Phone (10 digits)" 
         pattern="[6-9][0-9]{9}" required />
  <button type="submit">Claim Warranty</button>
</form>
```

### 2. OTP Form
```html
<div id="otpForm">
  <input type="text" id="otp" maxlength="6" 
         pattern="[0-9]{6}" placeholder="Enter 6-digit OTP" />
  <p id="timer">Time: 10:00</p>
  <button onclick="verifyOTP()">Verify</button>
  <button onclick="resendOTP()">Resend OTP</button>
  <p id="attempts">Attempts remaining: 3</p>
</div>
```

### 3. Warranty Card
```html
<div id="warrantyCard">
  <h2>✅ Warranty Active</h2>
  <p>Name: <span id="custName"></span></p>
  <p>Email: <span id="custEmail"></span></p>
  <p>Product: <span id="productName"></span></p>
  <p>Days Left: <span id="daysLeft"></span></p>
  <p>Expires: <span id="expiryDate"></span></p>
  <div class="progress-bar">
    <div id="progressBar"></div>
  </div>
</div>
```

---

## ⚠️ Validation Rules

### Phone Number
```javascript
// Must be 10 digits starting with 6, 7, 8, or 9
const phoneRegex = /^[6-9][0-9]{9}$/;
if (!phoneRegex.test(phone)) {
  showError("Invalid phone number");
}
```

### Email
```javascript
// Standard email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  showError("Invalid email");
}
```

### OTP
```javascript
// Exactly 6 digits
const otpRegex = /^[0-9]{6}$/;
if (!otpRegex.test(otp)) {
  showError("OTP must be 6 digits");
}
```

---

## 🔧 Error Handling

### Common Errors

| Error Message | What to Show User |
|---------------|-------------------|
| "Serial number not found" | "Invalid QR code. Please try again." |
| "Warranty already claimed" | "This warranty is already registered." → Show warranty details |
| "OTP has expired" | "Code expired. Please request a new one." → Enable resend |
| "Invalid OTP. 2 attempts remaining" | Show attempts counter |
| "Maximum attempts exceeded" | "Too many failed attempts. Request new OTP." → Reset form |

**Error Handling Code:**
```javascript
async function handleAPICall(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      // Show user-friendly error
      showError(data.message);
      return null;
    }
    
    return data;
  } catch (error) {
    showError("Network error. Please check your connection.");
    return null;
  }
}
```

---

## ⏱️ 10-Minute Timer

```javascript
let timeLeft = 600; // 10 minutes in seconds
let timerInterval;

function startTimer() {
  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showError("OTP expired");
      enableResendButton();
      return;
    }
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    document.getElementById('timer').textContent = 
      `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    timeLeft--;
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timeLeft = 600;
  startTimer();
}
```

---

## 📊 Admin Dashboard (Optional)

**API:** `GET /api/v1/serial-numbers/warranty-claims/all`

**Headers:** 
```javascript
{ 'Authorization': 'Bearer <admin_token>' }
```

**Query Params:**
- `page=1` (default)
- `limit=10` (default)
- `status=active` (filter)
- `email=john` (search)
- `phone=9876543210` (search)

**Response:**
```json
{
  "status": "success",
  "results": 10,
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "hasNextPage": true
  },
  "data": [ /* warranty records */ ]
}
```

**Code:**
```javascript
async function loadWarranties(page = 1) {
  const token = localStorage.getItem('adminToken');
  
  const response = await fetch(
    `${API_URL}/api/v1/serial-numbers/warranty-claims/all?page=${page}&limit=10`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  const data = await response.json();
  displayTable(data.data);
  displayPagination(data.pagination);
}
```

---

## 🎯 Testing Checklist

- [ ] QR scan shows claim form (first time)
- [ ] QR scan shows warranty card (already claimed)
- [ ] Claim form validates all fields
- [ ] OTP sent message appears
- [ ] OTP input works (6 digits only)
- [ ] Timer counts down from 10:00
- [ ] Resend OTP works
- [ ] Invalid OTP shows attempts remaining
- [ ] Success shows warranty card
- [ ] Progress bar updates correctly
- [ ] Expired warranty shows warning
- [ ] Admin dashboard pagination works
- [ ] Filters work correctly

---

## 📱 Mobile Responsive Tips

```css
/* Mobile-first design */
.claim-form input {
  width: 100%;
  padding: 12px;
  font-size: 16px; /* Prevents zoom on iOS */
  margin-bottom: 10px;
}

.otp-input {
  text-align: center;
  letter-spacing: 10px;
  font-size: 24px;
}

.warranty-card {
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar .fill {
  height: 100%;
  transition: width 0.3s ease;
}
```

---

## 🚨 Important Notes

1. **Phone Format:** Don't add +91 prefix. Backend handles it.
2. **OTP Expiry:** 10 minutes only. Show timer.
3. **Max Attempts:** 3 attempts per OTP. Then must resend.
4. **Loading States:** Show spinner during API calls.
5. **Error Messages:** Use exact error messages from backend.
6. **Date Format:** Use `toLocaleDateString()` for user's locale.

---

## 📞 Support

**Backend Issues:**
- Check console for error logs
- Verify API_URL is correct
- Check network tab in browser

**Frontend Issues:**
- Validate form data before sending
- Check response status codes
- Handle all error cases

---

**Last Updated:** January 4, 2026
**API Version:** v1
**Base URL:** `/api/v1/serial-numbers`
