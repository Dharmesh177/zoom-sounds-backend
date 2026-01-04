# Database Migration Scripts

## Running Migrations

### 1. Serial Numbers Migration

**Purpose:** Add `claimedWarranty` and `claimedAt` fields to existing serial numbers

**When to run:** After deploying warranty claim system for the first time

**Command:**
```bash
node scripts/migrateSerialNumbers.js
```

**What it does:**
- Adds `claimedWarranty: false` to all existing serial numbers
- Adds `claimedAt: null` to all existing serial numbers
- Creates index on `claimedWarranty` field
- Verifies the migration

**Output:**
```
Connecting to MongoDB...
✅ Connected to MongoDB

Found 1250 serial numbers

Updating serial numbers with new warranty fields...
✅ Updated 1250 serial numbers

✅ Verification: 1250/1250 serial numbers now have warranty fields

Creating indexes...
✅ Index created on claimedWarranty field

🎉 Migration completed successfully!

Database connection closed
```

---

## Before Running

1. **Backup your database:**
```bash
mongodump --uri="your_mongodb_uri" --out=./backup
```

2. **Test on development first:**
- Run on dev database
- Verify results
- Then run on production

3. **Ensure environment variables are set:**
- `MONGODB_URI` should be in `.env`

---

## Rollback (if needed)

If migration fails or you need to rollback:

```javascript
// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);

// Remove the added fields
await SerialNumber.updateMany(
  {},
  { 
    $unset: { 
      claimedWarranty: "",
      claimedAt: ""
    } 
  }
);

console.log('Rollback completed');
```

---

## Future Migrations

Add new migration scripts here following the same pattern:
- `migrate<FeatureName>.js`
- Include rollback instructions
- Test on dev first
- Document in this README
