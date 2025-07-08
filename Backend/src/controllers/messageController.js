const Message = require('../models/message');
const CustomizationRequest = require('../models/customizationRequest');
const CustomizationResponse = require('../models/customizationResponse');
const Customer = require('../models/customer');
const Artist = require('../models/artist');
const User = require('../models/user');
const {uploadBuffer} = require('../utils/cloudinaryUpload');
const { Op, where } = require('sequelize');
const { validationResult } = require('express-validator');
const socketService = require('../services/socketService');

const { validateMessageContent } = require('../utils/validateMsg');

exports.sendMessage = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { responseId} = req.params;
        const {messageContent, attachment} = req.body;
        if (!messageContent || messageContent.trim() === '') {
            return res.status(400).json({ message: 'Message content is required' });
        }
        const userId = req.user.id;        
        const customizationResponse = await CustomizationResponse.findByPk(responseId);
        if (!customizationResponse) {
            return res.status(404).json({ message: 'Customization response not found' });
        }

        if (customizationResponse.status !== 'ACCEPTED') {
            return res.status(403).json({ message: 'Messages can only be sent for accepted customization responses' });
        }

        const requestId = customizationResponse.requestId;
        const customizationRequest = await CustomizationRequest.findByPk(requestId);
        
        const user = await User.findByPk(userId);
        let isAuthorized = false;
        let senderId, senderType, receiverId, receiverType;
        if (user.role === 'customer') {
            const customer = await Customer.findOne({ where: { userId } });
            isAuthorized = customer && customizationRequest.customerId === customer.customerId;
            senderId = customer.customerId;
            senderType = 'customer';
            receiverId = customizationResponse.artistId;
            receiverType = 'artist';
        } else if (user.role === 'artist') {
            const artist = await Artist.findOne({ where: { userId } });
            isAuthorized = artist && customizationResponse.artistId === artist.artistId;
             senderId = artist.artistId;
            senderType = 'artist';            
            receiverId = customizationRequest.customerId;
            receiverType = 'customer';
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'You are not authorized to send messages for this response' });
        }
        const contentValidation = validateMessageContent(messageContent);
        if (!contentValidation.isValid) {
            return res.status(400).json({ 
                message: 'Message content not allowed',
                reason: contentValidation.reason 
            });
        }
        const uploadPromises = [];
        let attachmentUrl = attachment || '';
        if (req.files) {
            if (req.files.attachment && req.files.attachment[0]) {
                const attachmentFile = req.files.attachment[0];
                if (attachmentFile.mimetype.startsWith('image/')) {
                    uploadPromises.push(
                        uploadBuffer(attachmentFile.buffer, {
                            folder: `messages/${requestId}`,
                            resource_type: 'image',
                            public_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        }).then(result => {
                            attachmentUrl = result.secure_url || '';
                        })
                    );
                } else if (attachmentFile.mimetype.startsWith('video/')) {
                    uploadPromises.push(
                        uploadBuffer(attachmentFile.buffer, {
                            folder: `messages/${requestId}`,
                            resource_type: 'video',
                            public_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        }).then(result => {
                            attachmentUrl = result.secure_url || '';
                        })
                    );
                } else {
                    return res.status(400).json({ 
                        message: 'Only image and video files are allowed as attachments' 
                    });
                }
            }
            
            if (uploadPromises.length > 0) {
                try {
                    await Promise.all(uploadPromises);
                } catch (uploadError) {
                    console.error('Error uploading attachment:', uploadError);
                    return res.status(500).json({ message: 'Failed to upload attachment' });
                }
            }
        }

        const message = await Message.create({
            responseId,
            senderId,
            senderType,
            receiverId,
            receiverType,
            messageContent,
            attachmentUrl: attachmentUrl || '',
            deliveryStatus: 'sent',
            isOfflineMessage: false
        });

        let receiverUserId;
        if (receiverType === 'customer') {
            const receiverCustomer = await Customer.findByPk(receiverId);
            receiverUserId = receiverCustomer?.userId;
        } else {
            const receiverArtist = await Artist.findByPk(receiverId);
            receiverUserId = receiverArtist?.userId;
        }

        const messageData = {
            ...message.toJSON(),
            senderName: user.role === 'customer' ? 
                (await Customer.findByPk(senderId))?.name : 
                (await Artist.findByPk(senderId))?.name
        };

        const isReceiverOnline = socketService.isUserOnline(receiverUserId);
        
        if (isReceiverOnline) {
            socketService.sendToUser(receiverUserId, 'new_message', messageData);
            await message.update({ deliveryStatus: 'delivered' });
            socketService.sendMessageStatusUpdate(userId, message.messageId, 'delivered');
        } else {
            await message.update({ isOfflineMessage: true });
        }
        socketService.broadcastMessage(responseId, messageData, userId);

        return res.status(201).json({
            message: 'Message sent successfully',
            data: {
                ...messageData,
                isReceiverOnline,
                deliveryStatus: isReceiverOnline ? 'delivered' : 'sent'
            }
        });

    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUnreadMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        let userRecord;
        let userType;
        let userIdField;

        if (user.role === 'customer') {
            userRecord = await Customer.findOne({ where: { userId } });
            userType = 'customer';
            userIdField = 'customerId';
        } else if (user.role === 'artist') {
            userRecord = await Artist.findOne({ where: { userId } });
            userType = 'artist';
            userIdField = 'artistId';
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!userRecord) {
            return res.status(404).json({ message: 'User profile not found' });
        }        
        const unreadMessages = await Message.findAll({
            where: {
                receiverId: userRecord[userIdField],
                receiverType: userType,
                isRead: false
            },
            include: [{
                model: CustomizationResponse,
                attributes: []
            }],
            order: [['createdAt', 'DESC']]
        });
        await Message.update(
            { 
                deliveryStatus: 'delivered',
                isOfflineMessage: false
            },
            {
                where: {
                    receiverId: userRecord[userIdField],
                    receiverType: userType,
                    isOfflineMessage: true,
                    deliveryStatus: 'sent'
                }
            }
        );
        await Message.update(
            { 
                isRead: true,
                readAt: new Date(),
                deliveryStatus: 'read'
            },
            {
                where: {
                    receiverId: userRecord[userIdField],
                    receiverType: userType,
                    isRead: false
                }
            }
        );        return res.status(200).json({
            message: 'Unread messages retrieved successfully',
            data: {
                unreadMessages,
                unreadCount: unreadMessages.length
            }
        });

    } catch (error) {
        console.error('Error getting unread count:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMessagesByRespondId = async (req, res) => {
    try {
        const { responseId } = req.params;
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!responseId) {
            return res.status(400).json({ message: 'Response ID is required' });
        }

      
        let userRecord;
        let userType;
        let userIdField;

        if (user.role === 'customer') {
            userRecord = await Customer.findOne({ where: { userId } });
            userType = 'customer';
            userIdField = 'customerId';
        } else if (user.role === 'artist') {
            userRecord = await Artist.findOne({ where: { userId } });
            userType = 'artist';
            userIdField = 'artistId';
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!userRecord) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        const messages = await Message.findAll({
            where: {
                responseId: responseId,
                [Op.or]: [
                    { 
                        senderId: userRecord[userIdField],
                        senderType: userType
                    },
                    { 
                        receiverId: userRecord[userIdField],
                        receiverType: userType
                    }
                ]
            },
            order: [['createdAt', 'ASC']]
        });
        const messagesWithSenderName = await Promise.all(messages.map(async (message) => {
            const messageData = message.toJSON();
            
            if (message.senderType === 'customer') {
                const customer = await Customer.findByPk(message.senderId, {
                    attributes: ['name']
                });
                messageData.senderName = customer ? customer.name : 'Unknown Customer';
            } else if (message.senderType === 'artist') {
                const artist = await Artist.findByPk(message.senderId, {
                    attributes: ['name']
                });
                messageData.senderName = artist ? artist.name : 'Unknown Artist';
            }
            
            return messageData;
        }));

        return res.status(200).json({
            message: 'Messages retrieved successfully',
            data: {
                messages: messagesWithSenderName,
                messageCount: messagesWithSenderName.length
            }
        });

    } catch (error) {
        console.error('Error getting messages by response ID:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.markMessageAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findByPk(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const user = await User.findByPk(userId);
        let userRecord;
        let userType;
        let userIdField;

        if (user.role === 'customer') {
            userRecord = await Customer.findOne({ where: { userId } });
            userType = 'customer';
            userIdField = 'customerId';
        } else if (user.role === 'artist') {
            userRecord = await Artist.findOne({ where: { userId } });
            userType = 'artist';
            userIdField = 'artistId';
        }

        if (message.receiverId !== userRecord[userIdField] || message.receiverType !== userType) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await message.update({
            isRead: true,
            readAt: new Date(),
            deliveryStatus: 'read'
        });

        let senderUserId;
        if (message.senderType === 'customer') {
            const senderCustomer = await Customer.findByPk(message.senderId);
            senderUserId = senderCustomer?.userId;
        } else {
            const senderArtist = await Artist.findByPk(message.senderId);
            senderUserId = senderArtist?.userId;
        }

        if (senderUserId) {
            socketService.sendMessageStatusUpdate(senderUserId, messageId, 'read');
        }

        return res.status(200).json({
            message: 'Message marked as read',
            data: message
        });

    } catch (error) {
        console.error('Error marking message as read:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};