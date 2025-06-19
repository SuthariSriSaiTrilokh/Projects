const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// MongoDB connection + Photo model
const connectDB = require('./db');
const Photo = require('./models/Photo');

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Setup Socket.IO for chat
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config for uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  })
});

// ✅ Upload route
app.post('/upload', upload.single('photo'), async (req, res) => {
  const code = Math.random().toString(36).substring(2, 8);

  try {
    const photo = new Photo({
      code,
      filename: req.file.filename,
      originalname: req.file.originalname
    });

    await photo.save();

    res.json({
      id: photo.id,
      code: photo.code,
      filename: photo.filename,
      originalname: photo.originalname,
      url: `http://localhost:5000/uploads/${photo.filename}`,
      createdAt: photo.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving to database' });
  }
});

// ✅ Get photo by code
app.get('/api/photos/:code', async (req, res) => {
  try {
    const photo = await Photo.findOne({ code: req.params.code });

    if (photo) {
      res.json({
        id: photo.id,
        code: photo.code,
        filename: photo.filename,
        originalname: photo.originalname,
        url: `http://localhost:5000/uploads/${photo.filename}`,
        createdAt: photo.createdAt
      });
    } else {
      res.status(404).json({ error: 'Code not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Real-time chat functionality
io.on('connection', (socket) => {
  socket.on('join', (code) => {
    socket.join(code);
  });

  socket.on('sendMessage', ({ code, message }) => {
    socket.to(code).emit('receiveMessage', { sender: 'Peer', message });
  });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
