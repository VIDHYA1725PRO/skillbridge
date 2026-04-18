const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const hasValidCloudinaryConfig = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET &&
    !CLOUDINARY_CLOUD_NAME.startsWith('your_') && !CLOUDINARY_API_KEY.startsWith('your_') && !CLOUDINARY_API_SECRET.startsWith('your_');
};

if (hasValidCloudinaryConfig()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/gif','application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip','text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'), false);
  }
});

const uploadToCloudinary = async (buffer, folder, resourceType = 'raw') => {
  if (!hasValidCloudinaryConfig()) {
    const uploadsDir = path.join(__dirname, '..', 'uploads', folder);
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const fileName = `assignment-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.promises.writeFile(filePath, buffer);
    const port = process.env.PORT || 5001;
    const baseUrl = `http://localhost:${port}`;
    return { secure_url: `${baseUrl}/uploads/${folder}/${fileName}` };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `skillbridge/${folder}`, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary, cloudinary };
