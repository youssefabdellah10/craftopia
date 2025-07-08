const crypto = require('crypto');
const OTP = require('../models/otp');
const { sendOTPEmail } = require('./emailService');

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const createAndSendOTP = async (userId, email, userName) => {
    try {
        await OTP.destroy({
            where: {
                userId,
                isUsed: false
            }
        });
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await OTP.create({
            userId,
            otpCode,
            expiresAt
        });
        const emailSent = await sendOTPEmail(email, otpCode, userName);
        
        return {
            success: emailSent,
            message: emailSent ? 'OTP sent successfully' : 'Failed to send OTP'
        };
    } catch (error) {
        console.error('Error creating and sending OTP:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
};

const verifyOTP = async (userId, otpCode) => {
    try {
        const otpRecord = await OTP.findOne({
            where: {
                userId,
                otpCode,
                isUsed: false
            }
        });

        if (!otpRecord) {
            return {
                success: false,
                message: 'Invalid OTP code'
            };
        }

        if (new Date() > otpRecord.expiresAt) {
            return {
                success: false,
                message: 'OTP has expired'
            };
        }
        await otpRecord.update({ isUsed: true });

        return {
            success: true,
            message: 'OTP verified successfully'
        };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
};

module.exports = {
    generateOTP,
    createAndSendOTP,
    verifyOTP
};
