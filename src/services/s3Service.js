let S3Client, PutObjectCommand, DeleteObjectCommand;
try {
  const s3Sdk = require('@aws-sdk/client-s3');
  S3Client = s3Sdk.S3Client;
  PutObjectCommand = s3Sdk.PutObjectCommand;
  DeleteObjectCommand = s3Sdk.DeleteObjectCommand;
} catch (e) {
  console.warn('⚠️ @aws-sdk/client-s3 is not installed or failed to load. Please run "npm install".');
}

const crypto = require('crypto');

const region = process.env.AWS_REGION || 'ap-south-1';
const bucketName = process.env.AWS_S3_BUCKET || 'aarya-store';

let s3Client = null;

function getS3Client() {
  if (!S3Client) {
    console.warn('⚠️ S3 SDK is not loaded. Run "npm install".');
    return null;
  }
  if (!s3Client) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn('⚠️ AWS S3 credentials are missing in environment variables.');
      return null;
    }
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }
  return s3Client;
}

/**
 * Uploads a base64 data URL string to S3 and returns the public S3 URL.
 * @param {string} base64String e.g. "data:image/jpeg;base64,..."
 * @param {string} folder e.g. "items"
 * @returns {Promise<string>} public S3 URL
 */
async function uploadBase64ToS3(base64String, folder = 'items') {
  const client = getS3Client();
  if (!client) {
    throw new Error('S3 Client is not configured. Check AWS credentials.');
  }

  // Parse data URL: data:image/png;base64,iVBORw0KGgo...
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    // If not a data URL, check if already an HTTP/HTTPS URL
    if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
      return base64String;
    }
    throw new Error('Invalid base64 image data');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Determine file extension
  let ext = 'jpg';
  if (mimeType.includes('png')) ext = 'png';
  else if (mimeType.includes('webp')) ext = 'webp';
  else if (mimeType.includes('gif')) ext = 'gif';
  else if (mimeType.includes('svg')) ext = 'svg';
  else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';

  const randomHash = crypto.randomBytes(6).toString('hex');
  const filename = `${folder}/${Date.now()}_${randomHash}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    Body: buffer,
    ContentType: mimeType
  });

  await client.send(command);

  // Return standard public S3 URL
  return `https://${bucketName}.s3.${region}.amazonaws.com/${filename}`;
}

/**
 * Processes item photo input (which can be a single URL, base64 string, array of base64 strings, or JSON array)
 * and uploads any base64 images to S3.
 * Returns a JSON string of URLs or null.
 * @param {string|string[]} photoInput
 * @returns {Promise<string|null>}
 */
async function processItemPhotos(photoInput) {
  if (!photoInput) return null;

  let photos = [];
  if (Array.isArray(photoInput)) {
    photos = photoInput;
  } else if (typeof photoInput === 'string') {
    if (photoInput.trim().startsWith('[')) {
      try {
        photos = JSON.parse(photoInput);
      } catch (e) {
        photos = [photoInput];
      }
    } else {
      photos = [photoInput];
    }
  }

  if (!photos || photos.length === 0) return null;

  const uploadedUrls = [];
  for (const photo of photos) {
    if (!photo || typeof photo !== 'string') continue;

    if (photo.startsWith('data:image/')) {
      try {
        console.log('Uploading photo to Amazon S3...');
        const s3Url = await uploadBase64ToS3(photo, 'items');
        console.log('✅ Uploaded to S3:', s3Url);
        uploadedUrls.push(s3Url);
      } catch (err) {
        console.error('❌ Failed to upload photo to S3:', err.message);
        throw err;
      }
    } else {
      // Already an S3 URL or external URL
      uploadedUrls.push(photo);
    }
  }

  return uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null;
}

module.exports = {
  getS3Client,
  uploadBase64ToS3,
  processItemPhotos
};
