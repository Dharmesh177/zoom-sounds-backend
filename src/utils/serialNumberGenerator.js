import crypto from "crypto"

/**
 * Generate a unique serial number
 * Format: ZSIN-XXXX-XXXX-XXXX (16 characters + hyphens)
 */
function generateSerialNumber() {
  const randomBytes = crypto.randomBytes(6);
  const hex = randomBytes.toString('hex').toUpperCase();

  // Format: ZSIN-XXXX-XXXX-XXXX
  return `ZSIN-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

/**
 * Generate multiple unique serial numbers
 */
export async function generateUniqueSerialNumbers(quantity, SerialNumber) {
  const serialNumbers = [];
  const maxAttempts = quantity * 2; // Prevent infinite loops
  let attempts = 0;

  while (serialNumbers.length < quantity && attempts < maxAttempts) {
    const serial = generateSerialNumber();

    // Check if it already exists
    const exists = await SerialNumber.findOne({ serialNumber: serial });

    if (!exists && !serialNumbers.includes(serial)) {
      serialNumbers.push(serial);
    }

    attempts++;
  }

  if (serialNumbers.length < quantity) {
    throw new Error('Failed to generate required number of unique serial numbers');
  }

  return serialNumbers;
}