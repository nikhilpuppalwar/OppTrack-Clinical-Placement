const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const resumeUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = file.mimetype || '';
    const allowedExts = ['.pdf', '.docx', '.doc'];
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/octet-stream', // some browsers send this for docx
    ];

    if (allowedExts.includes(ext) || allowedMimes.includes(mime)) {
      cb(null, true);
    } else {
      const err = new Error('Unsupported file type. Please upload a PDF or DOCX resume.');
      err.status = 400;
      cb(err);
    }
  },
});

module.exports = resumeUpload;
