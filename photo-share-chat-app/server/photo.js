const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const Photo = require('../models/Photo'); // Adjust path if needed

// Set up multer to store files in /uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Save with original name
  }
});
const upload = multer({ storage });

// Utility to generate random code
function generateCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ------------------ UPLOAD ROUTE -------------------
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const code = generateCode();
    const photo = new Photo({
      filename: req.file.filename,
      code: code
    });
    await photo.save();
    res.json({ message: 'Photo uploaded successfully', code: code });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error while uploading' });
  }
});

// ------------------ GET ROUTE (already present) -------------------
router.get('/:code', async (req, res) => {
  try {
    const photo = await Photo.findOne({ code: req.params.code });
    if (!photo) {
      console.log('Code not found:', req.params.code);
      return res.status(404).json({ error: 'Invalid code' });
    }

    res.sendFile(path.resolve(__dirname, '../uploads', photo.filename));
  } catch (err) {
    console.error('Server error while fetching photo:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
