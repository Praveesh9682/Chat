const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// If you have any other static files like CSS/JS/images in the same folder, serve them from here
app.use(express.static(__dirname));

// Socket.io connection event
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle user joining a room
    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
        socket.to(room).emit('message', 'A new user has joined the room.');
    });

    // Handle chat messages
    socket.on('chatMessage', ({ room, message }) => {
        console.log(`Message from room ${room}: ${message}`);
        io.to(room).emit('message', message);  // Broadcast to the room
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Serve the index.html file from the same folder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
