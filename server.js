// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const path = require('path');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// // Serve static files (like index.html, about.html, contact.html)
// app.use(express.static(__dirname));

// // Track users per room
// const roomUsers = {}; // { roomName: Set of usernames }

// io.on('connection', (socket) => {
//     console.log('A user connected');

//     // ========== Join Room ==========
//     socket.on('joinRoom', ({ room, username }) => {
//         socket.join(room);
//         socket.username = username;
//         socket.room = room;

//         if (!roomUsers[room]) roomUsers[room] = new Set();
//         roomUsers[room].add(username);

//         io.to(room).emit('roomUserCount', roomUsers[room].size);

//         socket.to(room).emit('message', {
//             username: 'System',
//             message: `${username} has joined the room.`
//         });

//         console.log(`${username} joined room: ${room}`);
//     });

//     // ========== Chat Messages ==========
//     socket.on('chatMessage', ({ room, username, message }) => {
//         console.log(`Message from ${username} in room ${room}: ${message}`);
//         io.to(room).emit('message', { username, message });
//     });

//     // ========== WebRTC Signaling ==========
//     socket.on('offer', ({ offer, room }) => {
//         socket.to(room).emit('offer', { offer });
//     });

//     socket.on('answer', ({ answer, room }) => {
//         socket.to(room).emit('answer', { answer });
//     });

//     socket.on('ice-candidate', ({ candidate, room }) => {
//         socket.to(room).emit('ice-candidate', { candidate });
//     });

//     // ========== Disconnect ==========
//     socket.on('disconnect', () => {
//         const { room, username } = socket;

//         if (room && roomUsers[room]) {
//             roomUsers[room].delete(username);
//             io.to(room).emit('roomUserCount', roomUsers[room].size);

//             socket.to(room).emit('message', {
//                 username: 'System',
//                 message: `${username} has left the room.`
//             });

//             console.log(`${username} disconnected from room: ${room}`);
//         } else {
//             console.log('A user disconnected');
//         }
//     });
// });

// // Serve index.html
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });

// // Serve about.html
// app.get('/about', (req, res) => {
//     res.sendFile(path.join(__dirname, 'about.html'));
// });

// // Serve contact.html
// app.get('/contact', (req, res) => {
//     res.sendFile(path.join(__dirname, 'contact.html'));
// });

// // Start server
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server is running on port ${PORT}`);
// });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (like index.html, about.html, contact.html)
app.use(express.static(__dirname));

// Track users per room
const roomUsers = {}; // { roomName: Set of socketIds }

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // ========== Join Room ==========
    socket.on('joinRoom', ({ room, username }) => {
        socket.join(room);
        socket.username = username;
        socket.room = room;

        if (!roomUsers[room]) roomUsers[room] = new Set();
        roomUsers[room].add(socket.id);

        io.to(room).emit('roomUserCount', roomUsers[room].size);

        // Notify others in the room about the new user
        socket.to(room).emit('new-user', { userId: socket.id });

        console.log(`${username} (${socket.id}) joined room: ${room}`);
    });

    // ========== Chat Messages ==========
    socket.on('chatMessage', ({ room, username, message }) => {
        console.log(`Message from ${username} in room ${room}: ${message}`);
        io.to(room).emit('message', { username, message });
    });

    // ========== WebRTC Signaling ==========
    socket.on('offer', ({ offer, to, room }) => {
        io.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ answer, to, room }) => {
        io.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ candidate, to, room }) => {
        io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    // ========== Disconnect ==========
    socket.on('disconnect', () => {
        const { room, username } = socket;

        if (room && roomUsers[room]) {
            roomUsers[room].delete(socket.id);
            io.to(room).emit('roomUserCount', roomUsers[room].size);

            // Notify others user left
            socket.to(room).emit('user-disconnected', socket.id);

            console.log(`${username || "Unknown"} (${socket.id}) disconnected from room: ${room}`);
        } else {
            console.log('A user disconnected:', socket.id);
        }
    });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve about.html
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
