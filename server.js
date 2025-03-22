const express = require('express');
const http = require('http');
const { Server } = require('socket.io');  // Use { Server } to avoid confusion
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('fan-action', (data) => {
    console.log('Received Fan Action:', data);
    io.emit('fan-status', data); // Broadcast the fan status
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;  // Use dynamic port for deployment
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));