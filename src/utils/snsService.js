import AWS from 'aws-sdk';

// Configure AWS SNS
const sns = new AWS.SNS({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1' // Mumbai region for India
});

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via AWS SNS
 * @param {string} phone - Phone number in E.164 format (e.g., +919876543210)
 * @param {string} otp - The OTP to send
 * @returns {Promise} - SNS response
 */
export const sendOTPViaSNS = async (phone, otp) => {
  // Ensure phone number starts with country code
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
  
  const message = `Your ZS India warranty claim verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
  
  const params = {
    Message: message,
    PhoneNumber: formattedPhone,
    MessageAttributes: {
      'AWS.SNS.SMS.SenderID': {
        DataType: 'String',
        StringValue: 'ZSINDIA' // Your sender ID (needs to be registered with AWS)
      },
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional' // Transactional SMS for OTP
      }
    }
  };

  try {
    const result = await sns.publish(params).promise();
    console.log('OTP sent successfully:', result.MessageId);
    return result;
  } catch (error) {
    console.error('Error sending OTP via SNS:', error);
    throw new Error('Failed to send OTP. Please try again.');
  }
};

/**
 * Alternative: Send OTP via email using AWS SES (optional)
 */
export const sendOTPViaEmail = async (email, otp, customerName) => {
  // This can be implemented using AWS SES if needed
  // For now, focusing on SMS via SNS
  console.log(`Email OTP sending not implemented. Would send ${otp} to ${email}`);
};
