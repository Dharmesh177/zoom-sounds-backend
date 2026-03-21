import AWS from "aws-sdk";

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const uploadToS3 = async (
  buffer,
  fileName,
  mimeType,
  folder = "Products",
) => {
  const key = `${folder}/${fileName}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000, immutable",
  };

  await s3.putObject(params).promise();

  return key;
};

export const checkS3FileExists = async (key) => {
  try {
    await s3
      .headObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
      .promise();
    return true;
  } catch (error) {
    if (error.code === "NotFound") return false;
    throw error;
  }
};

export const deleteFromS3 = async (key) => {
  try {
    await s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
      .promise();
    return true;
  } catch (error) {
    console.error(`Failed to delete S3 object: ${key}`, error);
    return false;
  }
};

export const deleteMultipleFromS3 = async (keys) => {
  if (!keys || keys.length === 0) return true;
  
  try {
    const objects = keys.map(key => ({ Key: key }));
    await s3
      .deleteObjects({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: { Objects: objects },
      })
      .promise();
    return true;
  } catch (error) {
    console.error('Failed to delete S3 objects:', error);
    return false;
  }
};
