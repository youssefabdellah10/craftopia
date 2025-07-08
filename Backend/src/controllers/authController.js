const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const { createAndSendOTP, verifyOTP } = require('../utils/otpUtils');

exports.register = async (req, res) => {
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const {email, password, role} = req.body;
        const existingUser = await User.findOne({where: {email}});
        if(existingUser){
            return res.status(400).json({message: "User already exists"});
        }
        
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);        
        const user = await User.create({
            email, 
            password: hashedPassword, 
            role,
            isEmailVerified: false
        });
        const userName = role === 'artist' ? 'Artist' :'Customer';
        const otpResult = await createAndSendOTP(user.userId, email, userName);
        
        if (!otpResult.success) {
            await user.destroy();
            return res.status(500).json({
                message: "Failed to send verification email. Please try again."
            });
        }
        
        return res.status(201).json({
            message: "Registration successful! Please check your email for verification code.",
            userId: user.userId,
            email: user.email,
            role: user.role,
            requiresEmailVerification: true
        });

    }catch(error){
        console.error("Error registering user:", error.message, error.stack);
        return res.status(500).json({message: "Internal server error"});
    }
}

exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { email, password } = req.body;
          const user = await User.findOne({where: {email}});
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.isEmailVerified) {
            return res.status(403).json({ 
                message: 'Please verify your email before logging in',
                requiresEmailVerification: true,
                userId: user.userId
            });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (user.isBanned) {
            return res.status(403).json({ message: 'Your account has been banned. Please contact support.' });
        }
        
        const token = jwt.sign(
            { id: user.userId, role: user.role, email: user.email},
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        return res.status(200).json({ 
            message: 'Login successful',
            token,
            userId: user.userId, 
            role: user.role,
            email: user.email,
        });
    } catch (err) {
        console.error("Login error:", err.message, err.stack);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId, otpCode } = req.body;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }
        const otpResult = await verifyOTP(userId, otpCode);
        
        if (!otpResult.success) {
            return res.status(400).json({ message: otpResult.message });
        }
        await user.update({ isEmailVerified: true });

        return res.status(200).json({
            message: 'Email verified successfully! You can now login.',
            isEmailVerified: true
        });

    } catch (error) {
        console.error("Error verifying email:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId } = req.body;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }
        const userName = user.role === 'artist' ? 'Artist' : user.role === 'customer' ? 'Customer' : 'Admin';
        const otpResult = await createAndSendOTP(user.userId, user.email, userName);
        
        if (!otpResult.success) {
            return res.status(500).json({ message: "Failed to send verification email" });
        }

        return res.status(200).json({
            message: 'New verification code sent to your email'
        });

    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};