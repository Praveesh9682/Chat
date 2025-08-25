const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static('public'));

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

// Serve the index.html file on the root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// // Start the server on port 3000
// server.listen(3000, '0.0.0.0', () => {
//     console.log('Server is running on http://localhost:3000');
// });
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

