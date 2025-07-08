const CustomizationRequest = require('../models/customizationRequest');
const Artist = require('../models/artist');
const Customer = require('../models/customer');
const {uploadBuffer} = require('../utils/cloudinaryUpload');
const CustomizationResponse = require('../models/customizationResponse');
const Order = require('../models/order');
const Product = require('../models/product');
const Product_Order = require('../models/Product_Order');
const { validationResult } = require('express-validator');
const { 
    autoDeclinePendingResponses, 
    getArtistResponsesEnhanced, 
    getCustomerResponsesEnhanced 
} = require('../utils/customizationUtils');
const User = require('../models/user');
const { sendCustomizationResponseEmail } = require('../utils/emailService');

exports.respondToCustomizationRequest = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: errors.array() 
            });
        }

        const userId = req.user.id;
        const artist = await Artist.findOne({ where: { userId } });
        if (!artist) {
            return res.status(403).json({ message: 'You are not authorized to respond to customization requests' });
        }

        const requestId = req.params.requestId;
        const request = await CustomizationRequest.findOne({ where: { requestId } });
        if (!request) {
            return res.status(404).json({ message: 'Customization request not found' });
        }
        
        if (request.status !== 'OPEN') {
            return res.status(400).json({ 
                message: 'Request is already closed',
                requestStatus: request.status 
            });
        }
        const existingResponse = await CustomizationResponse.findOne({
            where: { 
                requestId: request.requestId,
                artistId: artist.artistId 
            }
        });

        if (existingResponse && existingResponse.status !== 'DECLINED') {
            return res.status(400).json({ 
                message: 'You have already responded to this request',
                existingResponseId: existingResponse.responseId,
                existingResponseStatus: existingResponse.status
            });
        }
        
        const { price, notes, estimationCompletionDate } = req.body;
        const estimationDate = new Date(estimationCompletionDate);
        if (estimationDate <= new Date()) {
            return res.status(400).json({ 
                message: 'Estimation completion date must be in the future' 
            });
        }

        let image = null;
        const file = req.file;
        if (file) {
            try {
                const result = await uploadBuffer(file.buffer, {
                    folder: `artists/${artist.artistId}/customizationResponses`,
                    resource_type: 'image'
                });
                image = result.secure_url;
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.status(500).json({ message: 'Error uploading image' });
            }
        }

        if (existingResponse && existingResponse.status === 'DECLINED') {
            await existingResponse.update({
                price: parseFloat(price),
                notes: notes,
                estimationCompletionTime: estimationDate,
                image: image,
                status: 'PENDING',
                updatedAt: new Date()
            });

            try {
                const customer = await Customer.findOne({ where: { customerId: request.customerId } });
                const customerUser = await User.findByPk(customer.userId);
                
                if (customerUser && customerUser.email) {
                    const responseDetails = {
                        requestTitle: request.title,
                        artistName: artist.name || 'Artist',
                        proposedPrice: parseFloat(existingResponse.price || 0).toFixed(2),
                        estimatedDays: Math.ceil((new Date(existingResponse.estimationCompletionTime) - new Date()) / (1000 * 60 * 60 * 24)),
                        responseId: existingResponse.responseId,
                        isUpdate: true
                    };
                    
                    await sendCustomizationResponseEmail(customerUser.email, customer.name || 'Valued Customer', responseDetails);
                }
            } catch (emailError) {
                console.error('Error sending customization response update email:', emailError);
            }
            return res.status(200).json({
                message: 'Response updated successfully',
                response: {
                    responseId: existingResponse.responseId,
                    price: existingResponse.price,
                    notes: existingResponse.notes,
                    estimationCompletionTime: existingResponse.estimationCompletionTime,
                    artistId: existingResponse.artistId,
                    requestId: existingResponse.requestId,
                    image: existingResponse.image,
                    status: existingResponse.status,
                    updatedAt: existingResponse.updatedAt
                }
            });
        }

        const newResponse = await CustomizationResponse.create({
            price: parseFloat(price),
            notes: notes,
            estimationCompletionTime: estimationDate,
            artistId: artist.artistId,
            requestId: request.requestId,
            image: image,
            status: 'PENDING'
        });

        try {
            const customer = await Customer.findOne({ where: { customerId: request.customerId } });
            const customerUser = await User.findByPk(customer.userId);
            
            if (customerUser && customerUser.email) {
                const responseDetails = {
                    requestTitle: request.title,
                    artistName: artist.name || 'Artist',
                    proposedPrice: parseFloat(newResponse.price || 0).toFixed(2),
                    estimatedDays: Math.ceil((new Date(newResponse.estimationCompletionTime) - new Date()) / (1000 * 60 * 60 * 24)),
                    responseId: newResponse.responseId
                };
                
                await sendCustomizationResponseEmail(customerUser.email, customer.name || 'Valued Customer', responseDetails);
            }
        } catch (emailError) {
            console.error('Error sending customization response email:', emailError);
        }

        return res.status(201).json({
            message: 'Response created successfully',
            response: {
                responseId: newResponse.responseId,
                price: newResponse.price,
                notes: newResponse.notes,
                estimationCompletionTime: newResponse.estimationCompletionTime,
                artistId: newResponse.artistId,
                requestId: newResponse.requestId,
                image: newResponse.image,
                status: newResponse.status,
                createdAt: newResponse.createdAt
            }
        });

    } catch (error) {
        console.error('Error in respondToCustomizationRequest:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getCustomizationResponses = async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findOne({ where: { userId } });

        if (!customer) {
            return res.status(403).send({ message: 'You are not authorized to view customization responses' });
        }

        const responses = await getCustomerResponsesEnhanced(customer.customerId);

        return res.status(200).json({
            responses,
            total: responses.length,
            message: responses.length === 0 ? 'No responses found for your requests' : undefined
        });
    } catch (error) {
        console.error('Error getting customer customization responses:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
};

exports.acceptCustomizationResponse = async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findOne({ where: { userId } });
        if (!customer) {
            return res.status(403).send({ message: 'You are not authorized to accept customization responses' });
        }        
        const responseId = req.params.responseId;
        const response = await CustomizationResponse.findOne({ 
            where: { responseId }
        });
        
        if (!response) {
            return res.status(404).send({ message: 'Response not found' });
        }
        const customizationRequest = await CustomizationRequest.findOne({
            where: { requestId: response.requestId }
        });

        if (!customizationRequest) {
            return res.status(500).send({ message: 'Associated customization request not found' });
        }

        if (customizationRequest.customerId !== customer.customerId) {
            return res.status(403).send({ message: 'You are not authorized to accept this response' });
        }
        if (response.status !== 'PENDING') {
            return res.status(400).send({ message: 'Response has already been processed' });
        }        
        await response.update({ status: 'ACCEPTED' });
        const order = await Order.create({
            totalAmount: response.price,
            customerId: customizationRequest.customerId,
            createdAt: new Date()
        });
        const product = await Product.create({
            name: customizationRequest.title,
            price: response.price,
            description: customizationRequest.requestDescription,
            image: customizationRequest.image ? [customizationRequest.image] : [],
            quantity: 1,
            sellingNumber: 0,
            artistId: response.artistId,
            type : 'customizable'

        });
         await Product_Order.create({
            orderId: order.orderId,
            productId: product.productId,
            quantity: 1
        });
        await CustomizationRequest.update(
            { status: 'CLOSED',
                orderId: order.orderId
             },
            { where: { requestId: response.requestId } }
        );
        const declinedCount = await autoDeclinePendingResponses(response.requestId);
        
        return res.status(200).json({
            message: 'Customization response accepted successfully',
            responseId: response.responseId,
            status: 'ACCEPTED',
            autoDeclinedResponses: declinedCount,
            message: "order has been created successfully, here we go",
            order
        });
        
    } catch (error) {
        console.error('Error accepting customization response:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
};

exports.declineCustomizationResponse = async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findOne({ where: { userId } });
        if (!customer) {
            return res.status(403).send({ message: 'You are not authorized to decline customization responses' });
        }       
        const responseId = req.params.responseId;
        const response = await CustomizationResponse.findOne({ 
            where: { responseId }
        });
        
        if (!response) {
            return res.status(404).send({ message: 'Response not found' });
        }
        const customizationRequest = await CustomizationRequest.findOne({
            where: { requestId: response.requestId }
        });

        if (!customizationRequest) {
            return res.status(500).send({ message: 'Associated customization request not found' });
        }

        if (customizationRequest.customerId !== customer.customerId) {
            return res.status(403).send({ message: 'You are not authorized to decline this response' });
        }
        if (response.status !== 'PENDING') {
            return res.status(400).send({ message: 'Response has already been processed' });
        }
        await response.update({ status: 'DECLINED' });
        
        return res.status(200).json({
            message: 'Customization response declined successfully',
            responseId: response.responseId,
            status: 'DECLINED'
        });
        
    } catch (error) {
        console.error('Error declining customization response:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
};

exports.getArtistCustomizationResponses = async (req, res) => {
    try {
        const userId = req.user.id;
        const artist = await Artist.findOne({ where: { userId } });

        if (!artist) {
            return res.status(403).send({ message: 'You are not authorized to view customization responses' });
        }

        const result = await getArtistResponsesEnhanced(artist.artistId);
        
        const response = {
            responses: result.responses,
            total: result.responses.length,
            statistics: {
                pending: result.responses.filter(r => r.status === 'PENDING').length,
                accepted: result.responses.filter(r => r.status === 'ACCEPTED').length,
                declined: result.responses.filter(r => r.status === 'DECLINED').length
            }
        };

        if (result.autoDeclinedCount > 0) {
            response.message = `${result.autoDeclinedCount} response(s) were automatically declined due to closed requests`;
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error('Error getting artist customization responses:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
};