/**
 * Migration Script: Add claimedWarranty field to existing serial numbers
 * 
 * Run this script once after deploying the new code to update existing records
 * 
 * Usage: node scripts/migrateSerialNumbers.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SerialNumber } from '../Database/models/serialNumber.model.js';

// Load environment variables
dotenv.config();

const migrateSerialNumbers = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count existing serial numbers
    const totalCount = await SerialNumber.countDocuments();
    console.log(`\nFound ${totalCount} serial numbers`);

    // Update all serial numbers that don't have the new fields
    console.log('\nUpdating serial numbers with new warranty fields...');
    
    const result = await SerialNumber.updateMany(
      { claimedWarranty: { $exists: false } },
      { 
        $set: { 
          claimedWarranty: false,
          claimedAt: null
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} serial numbers`);

    // Verify the update
    const updatedCount = await SerialNumber.countDocuments({ 
      claimedWarranty: { $exists: true } 
    });
    console.log(`\n✅ Verification: ${updatedCount}/${totalCount} serial numbers now have warranty fields`);

    // Create indexes if they don't exist
    console.log('\nCreating indexes...');
    await SerialNumber.collection.createIndex({ claimedWarranty: 1 });
    console.log('✅ Index created on claimedWarranty field');

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run migration
migrateSerialNumbers();
