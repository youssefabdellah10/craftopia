const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Customer = require('../models/customer');
const Artist = require('../models/artist');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
    }

    initialize(server) {
        this.io = require('socket.io')(server, {
            cors: {
                origin: "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findByPk(decoded.id);
                
                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.userId = user.userId;
                socket.userRole = user.role;
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`User ${socket.userId} connected with socket ${socket.id}`);
            this.connectedUsers.set(socket.userId, socket.id);
            socket.join(`user_${socket.userId}`);

            socket.on('join_conversation', (responseId) => {
                socket.join(`conversation_${responseId}`);
                console.log(`User ${socket.userId} joined conversation ${responseId}`);
            });

            socket.on('leave_conversation', (responseId) => {
                socket.leave(`conversation_${responseId}`);
                console.log(`User ${socket.userId} left conversation ${responseId}`);
            });

            socket.on('typing', (data) => {
                socket.to(`conversation_${data.responseId}`).emit('user_typing', {
                    userId: socket.userId,
                    isTyping: data.isTyping
                });
            });

            socket.on('disconnect', () => {
                console.log(`User ${socket.userId} disconnected`);
                this.connectedUsers.delete(socket.userId);
            });
        });

        return this.io;
    }
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }

    getUserSocket(userId) {
        return this.connectedUsers.get(userId);
    }

    sendToUser(userId, event, data) {
        const socketId = this.getUserSocket(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
            return true;
        }
        return false;
    }

    sendToConversation(responseId, event, data) {
        this.io.to(`conversation_${responseId}`).emit(event, data);
    }

    broadcastMessage(responseId, messageData, excludeUserId = null) {
        if (excludeUserId) {
            this.io.to(`conversation_${responseId}`).except(`user_${excludeUserId}`).emit('new_message', messageData);
        } else {
            this.sendToConversation(responseId, 'new_message', messageData);
        }
    }

    sendMessageStatusUpdate(userId, messageId, status) {
        this.sendToUser(userId, 'message_status_update', {
            messageId,
            status,
            timestamp: new Date()
        });
    }

    getOnlineUsersCount() {
        return this.connectedUsers.size;
    }

    getConnectedUsers() {
        return Array.from(this.connectedUsers.keys());
    }
}

module.exports = new SocketService();
