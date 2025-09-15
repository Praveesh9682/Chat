const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON (for contact form)
app.use(express.json());

// Serve static files (like index.html, about.html, contact.html)
app.use(express.static(__dirname));

// Track users per room
const roomUsers = {}; // { roomName: Set of usernames }

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', ({ room, username }) => {
        socket.join(room);
        socket.username = username;
        socket.room = room;

        if (!roomUsers[room]) roomUsers[room] = new Set();
        roomUsers[room].add(username);

        io.to(room).emit('roomUserCount', roomUsers[room].size);

        socket.to(room).emit('message', {
            username: 'System',
            message: `${username} has joined the room.`
        });

        console.log(`${username} joined room: ${room}`);
    });

    socket.on('chatMessage', ({ room, username, message }) => {
        console.log(`Message from ${username} in room ${room}: ${message}`);
        io.to(room).emit('message', { username, message });
    });

    socket.on('disconnect', () => {
        const { room, username } = socket;

        if (room && roomUsers[room]) {
            roomUsers[room].delete(username);
            io.to(room).emit('roomUserCount', roomUsers[room].size);

            socket.to(room).emit('message', {
                username: 'System',
                message: `${username} has left the room.`
            });

            console.log(`${username} disconnected from room: ${room}`);
        } else {
            console.log('A user disconnected');
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

// Serve contact.html
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

/* ========== CONTACT FORM EMAIL ROUTE ========== */
app.post('/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        // Transporter setup (using Gmail)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'praveeshbkt1999@gmail.com', // your Gmail
                pass: 'YOUR_APP_PASSWORD' // ⚠️ use App Password, not normal password
            }
        });

        // Mail options
        const mailOptions = {
            from: email,
            to: 'praveeshbkt1999@gmail.com',
            subject: `New Contact Form Submission from ${name}`,
            text: `You have received a new message from ChatBaba contact form.\n\n
Name: ${name}\n
Email: ${email}\n
Message:\n${message}`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: "✅ Your message has been sent successfully!" });
    } catch (error) {
        console.error("Email sending error:", error);
        res.status(500).json({ error: "❌ Failed to send message. Please try again later." });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
