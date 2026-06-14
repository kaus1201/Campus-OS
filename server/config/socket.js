const { Server } = require("socket.io");
const Message = require('../models/Message');

/**
 * Initialize Socket.IO for real-time chat
 * @param {http.Server} server - HTTP server instance
 */
const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.id}`);

        // Join a subject room
        socket.on('join_room', (subjectId) => {
            socket.join(subjectId);
            console.log(`User ${socket.id} joined room: ${subjectId}`);
        });

        // Send message
        socket.on('send_message', async (data) => {
            try {
                // Save message to database
                const message = await Message.create({
                    userId: data.userId,
                    subjectId: data.subjectId,
                    text: data.text
                });

                // Populate user info
                await message.populate('userId', 'name');

                // Emit to room with populated data
                const messageData = {
                    _id: message._id,
                    userId: message.userId._id,
                    userName: message.userId.name,
                    subjectId: message.subjectId,
                    text: message.text,
                    createdAt: message.createdAt
                };

                socket.to(data.subjectId).emit('receive_message', messageData);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Leave room
        socket.on('leave_room', (subjectId) => {
            socket.leave(subjectId);
            console.log(`User ${socket.id} left room: ${subjectId}`);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = initializeSocket;
