const { Report, Artist, Customer, User } = require('../models');
const { Op, sequelize } = require('sequelize');
const db = require('../config/db');
const { validationResult } = require('express-validator');
const uploadBuffer = require('../utils/cloudinaryUpload');

exports.createReportUser = async (req, res) => {
    try {
         const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({
                        message: 'Validation failed',
                        errors: errors.array()
                    });
                }
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        const { content,  attachment } = req.body;
        const role = req.user.role;
        const username = req.params.username;
        const userId = req.user.id;
        if (!content || !username) {
            return res.status(400).json({
                success: false,
                message: 'Content and reported username are required'
            });
        }

        let reporterId;
        let reporterType;
         let reporterusername = '';

        if (role === 'artist') {
            const artist = await Artist.findOne({ where: { userId } });
            if (!artist) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist profile not found'
                });
            }
            reporterId = artist.artistId;
            reporterType = 'artist';
            reporterusername = artist.username;
        } else if (role === 'customer') {
            const customer = await Customer.findOne({ where: { userId } });
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer profile not found'
                });
            }
            reporterId = customer.customerId;
            reporterType = 'customer';
            reporterusername = customer.username;
        } else {
            return res.status(403).json({
                success: false,
                message: 'Only artists and customers can create reports'
            });
        }

       const reportedCustomer = await Customer.findOne({ where: { username } });
       if (!reportedCustomer) {
            return res.status(404).json({
                success: false,
                message: 'Reported customer not found'
            });

        }


        if (reporterType === 'customer' && reporterId === reportedCustomer.customerId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot report yourself'
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
                            folder: `reports/${reporterId}`,
                            resource_type: 'image',
                            public_id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        }).then(result => {
                            attachmentUrl = result.secure_url || '';
                        })
                    );
                } else {
                    return res.status(400).json({ 
                        message: 'Only image files are allowed as attachments' 
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

        const report = await Report.create({
            content,
            ReporterID: reporterId,
            reporterusername: reporterusername,
            ReporterType: reporterType,
            ReportedID: reportedCustomer.customerId,
            reportedusername: reportedCustomer.username,
            ReportedType: 'customer',
            attachmentUrl: attachmentUrl
        });
        res.status(201).json({
            success: true,
            message: 'Report created successfully',
            data: report
        });

    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.createReportArtist = async (req, res) => {
    try {
         const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({
                        message: 'Validation failed',
                        errors: errors.array()
                    });
                }
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        const { content,  attachment } = req.body;
        const role = req.user.role;
        const username = req.params.username;
        const userId = req.user.id;
        if (!content || !username) {
            return res.status(400).json({
                success: false,
                message: 'Content and reported username are required'
            });
        }

        let reporterId;
        let reporterType;
        let reporterusername = '';
        if (role === 'artist') {
            const artist = await Artist.findOne({ where: { userId } });
            if (!artist) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist profile not found'
                });
            }
            reporterusername = artist.username;
            reporterId = artist.artistId;
            reporterType = 'artist';
        } else if (role === 'customer') {
            const customer = await Customer.findOne({ where: { userId } });
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer profile not found'
                });
            }
            reporterusername = customer.username;
            reporterId = customer.customerId;
            reporterType = 'customer';
        } else {
            return res.status(403).json({
                success: false,
                message: 'Only artists and customers can create reports'
            });
        }

       const reportedArtist = await Artist.findOne({ where: { username } });
       if (!reportedArtist) {
            return res.status(404).json({
                success: false,
                message: 'Reported artist not found'
            });

        }


        if (reporterType === 'artist' && reporterId === reportedArtist.artistId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot report yourself'
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
                            folder: `reports/${reporterId}`,
                            resource_type: 'image',
                            public_id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        }).then(result => {
                            attachmentUrl = result.secure_url || '';
                        })
                    );
                } else {
                    return res.status(400).json({ 
                        message: 'Only image files are allowed as attachments' 
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

        const report = await Report.create({
            content,
            ReporterID: reporterId,
            ReporterType: reporterType,
            ReportedID: reportedArtist.artistId,
            ReportedType: 'artist',
            attachmentUrl: attachmentUrl,
            reportedusername: username,
            reporterusername: reporterusername
        });
        res.status(201).json({
            success: true,
            message: 'Report created successfully',
            data: report
        });

    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.getAllSubmittedReports = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can access this resource'
            });
        }

        const reports = await Report.findAll({
           where: {
                status: 'submitted'
           }
        });

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

exports.getAllReviewedReports = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can access this resource'
            });
        }

        const reports = await Report.findAll({
           where: {
                status: 'reviewed'
           }
        });

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

exports.getReportbyId = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isNaN(id) || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID. Must be a valid integer.'
            });
        }
        
         if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can access this resource'
            });
        }

        const report = await Report.findOne({
           where: { ReportId: id }
        });
        


        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.ReviewReport = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isNaN(id) || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID. Must be a valid integer.'
            });
        }
        
         if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can reviwew reports'
            });
        }

        const report = await Report.findOne({
            where: { ReportId: id }
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        if( report.status == 'reviewed') {
            const admin = await User.findOne({
                where: { userId: report.adminReviwerId }
            });
            const adminEmail = admin.email;
            return res.status(400).json({
                success: false,
                message: 'Report is already reviewed before by an admin with email: ' + adminEmail
            });
        }

        report.status = 'reviewed';
        report.adminReviwerId = req.user.id;
        report.reviewedAt = new Date();
        await report.save();

        res.status(200).json({
            success: true,
            message: 'Report reviewed successfully',
            data: report
        });
    } catch (error) {
        console.error('Error reviewing report:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.BanUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isNaN(id) || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID. Must be a valid integer.'
            });
        }
        
         if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can ban users'
            });
        }

        const user = await User.findOne({
            where: { userId: id }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if(user.userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot ban yourself'
            });
        }

        if(user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You cannot ban an admin user'
            });
        }

        user.isBanned = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User banned successfully',
            data: user
        });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

exports.UnbanUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isNaN(id) || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID. Must be a valid integer.'
            });
        }
        
         if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can unban users'
            });
        }

        const user = await User.findOne({
            where: { userId: id }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isBanned = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User unbanned successfully',
            data: user
        });
    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};