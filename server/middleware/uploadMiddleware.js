// server/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Configure storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure this directory exists in your server folder
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    // Append timestamp to avoid file name collisions
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|plain/; // Allow PDF and plain text
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Only PDF and Text files are allowed!');
    }
  },
});

module.exports = upload;