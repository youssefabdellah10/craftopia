const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});


const getEmailTemplate = (title, content, footerMessage = null) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ff6b35; margin: 0; font-size: 28px;">Craftopia</h1>
                    <p style="color: #666; margin: 5px 0;">Marketplace for Handcrafted Arts</p>
                </div>
                
                <h2 style="color: #333; text-align: center; margin-bottom: 20px;">${title}</h2>
                
                ${content}
                
                <p style="margin-top: 30px;">Best regards,<br><strong>The Craftopia Team</strong></p>
                
                ${footerMessage ? `<div style="background-color: #f8f9fa; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #ff6b35;"><p style="margin: 0; color: #666;">${footerMessage}</p></div>` : ''}
                
                <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666; text-align: center; margin: 15px 0 0 0;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>
        </div>
    `;
};

const sendOTPEmail = async (email, otpCode, userName = 'User') => {
    try {
        const content = `
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Thank you for registering on Craftopia. To complete your registration, please verify your email address using the OTP code below:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #ff6b35; font-size: 32px; margin: 0; letter-spacing: 5px;">${otpCode}</h1>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
                <li>This OTP is valid for 10 minutes only</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
            </ul>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Email Verification - Craftopia',
            html: getEmailTemplate('Welcome to Craftopia!', content)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        
        if (error.code === 'EAUTH') {
            console.log('Gmail Authentication Error: Please use App Password instead of regular password');
        }
        
        return false;
    }
};

const sendOrderConfirmationEmail = async (email, userName, orderDetails) => {
    try {
        const { orderId, totalAmount, products, orderDate } = orderDetails;
        
        const productsList = products.map(product => 
            `<tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${product.price}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(product.price * product.quantity).toFixed(2)}</td>
            </tr>`
        ).join('');

        const content = `
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Thank you for your order! We're excited to confirm that your order has been successfully placed.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Order Details</h3>
                <p><strong>Order ID:</strong> #${orderId}</p>
                <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Total Amount:</strong> $${totalAmount}</p>
            </div>
            
            <h3 style="color: #333;">Items Ordered:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #ff6b35; color: white;">
                        <th style="padding: 12px; text-align: left;">Product</th>
                        <th style="padding: 12px; text-align: center;">Qty</th>
                        <th style="padding: 12px; text-align: right;">Price</th>
                        <th style="padding: 12px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsList}
                </tbody>
            </table>
            
            <p>Your order is now being processed by our talented artists. You'll receive another email with tracking information once your items ship.</p>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Order Confirmation - Order #${orderId}`,
            html: getEmailTemplate('Order Confirmed!', content, 'We appreciate your business and support of handcrafted arts!')
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        return false;
    }
};


const sendAuctionApprovedEmail = async (email, artistName, auctionDetails) => {
    try {
        const { productName, startingPrice, startDate, endDate, auctionId } = auctionDetails;

        const content = `
            <p>Hello <strong>${artistName}</strong>,</p>
            <p>Exciting news! Your auction request has been approved by our admin team.</p>
            
            <div style="background-color: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                <h3 style="color: #155724; margin-top: 0;">🎉 Auction Approved!</h3>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Auction Details</h3>
                <p><strong>Product:</strong> ${productName}</p>
                <p><strong>Starting Price:</strong> $${startingPrice}</p>
                <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Auction ID:</strong> ${auctionId}</p>
            </div>
            
            <p>Your artwork will be featured in our auction marketplace. Bidders will be able to place bids during the auction period.</p>
            <p>Good luck with your auction! We hope your beautiful handcrafted item finds a loving home.</p>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Auction Approved - ${productName}`,
            html: getEmailTemplate('Auction Request Approved!', content, 'We believe in your artistic talent and wish you success!')
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending auction approved email:', error);
        return false;
    }
};

const sendAuctionRejectedEmail = async (email, artistName, auctionDetails) => {
    try {
        const { productName, reason } = auctionDetails;

        const content = `
            <p>Hello <strong>${artistName}</strong>,</p>
            <p>Thank you for submitting your auction request for "<strong>${productName}</strong>". After careful review, we're unable to approve this auction at this time.</p>
            
            <div style="background-color: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545;">
                <h3 style="color: #721c24; margin-top: 0;">Auction Request Status</h3>
                <p style="color: #721c24; margin: 0;"><strong>Status:</strong> Not Approved</p>
            </div>
            
            ${reason ? `
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Feedback from Admin</h3>
                <p style="font-style: italic;">"${reason}"</p>
            </div>
            ` : ''}
            
            <p>Please don't be discouraged! You can:</p>
            <ul>
                <li>Review our auction guidelines and requirements</li>
                <li>Make any necessary improvements to your product listing</li>
                <li>Submit a new auction request when ready</li>
            </ul>
            
            <p>We appreciate your participation in the Craftopia community and encourage you to keep creating and sharing your beautiful work!</p>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Auction Request Update - ${productName}`,
            html: getEmailTemplate('Auction Request Update', content, 'Keep creating! We appreciate your artistry and look forward to future submissions.')
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending auction rejected email:', error);
        return false;
    }
};


const sendNotificationEmail = async (email, userName, subject, message, type = 'info') => {
    try {
        const typeColors = {
            'success': { bg: '#e8f5e8', border: '#28a745', text: '#155724', icon: '✅' },
            'info': { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460', icon: 'ℹ️' },
            'warning': { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: '⚠️' },
            'error': { bg: '#f8d7da', border: '#dc3545', text: '#721c24', icon: '❌' }
        };

        const colors = typeColors[type] || typeColors['info'];

        const content = `
            <p>Hello <strong>${userName}</strong>,</p>
            
            <div style="background-color: ${colors.bg}; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid ${colors.border};">
                <h3 style="color: ${colors.text}; margin-top: 0;">${colors.icon} ${subject}</h3>
                <p style="color: ${colors.text}; margin: 0;">${message}</p>
            </div>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Craftopia - ${subject}`,
            html: getEmailTemplate('Notification', content)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending notification email:', error);
        return false;
    }
};

const sendCustomizationRequestReceivedEmail = async (email, customerName, requestDetails) => {
    try {
        const { title, description, budget, requestId } = requestDetails;

        const content = `
            <p>Hello <strong>${customerName}</strong>,</p>
            <p>We've successfully received your customization request! Our talented artists will review your request and provide proposals soon.</p>
            
            <div style="background-color: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                <h3 style="color: #155724; margin-top: 0;">✅ Request Submitted Successfully</h3>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Request Details</h3>
                <p><strong>Request ID:</strong> #${requestId}</p>
                <p><strong>Title:</strong> ${title}</p>
                <p><strong>Description:</strong> ${description}</p>
                <p><strong>Budget:</strong> $${budget}</p>
            </div>
            
            <p>What happens next:</p>
            <ul>
                <li>Artists will review your request</li>
                <li>You'll receive proposals with pricing and timelines</li>
                <li>You can choose the best proposal for your needs</li>
                <li>Work begins once you accept a proposal</li>
            </ul>
            
            <p>We'll notify you as soon as artists start submitting proposals. Thank you for choosing Craftopia for your custom artwork needs!</p>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Customization Request Received - ${title}`,
            html: getEmailTemplate('Request Received!', content, 'Our artists are excited to bring your vision to life!')
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending customization request received email:', error);
        return false;
    }
};

const sendCustomizationResponseEmail = async (email, customerName, responseDetails) => {
    try {
        const { requestTitle, artistName, proposedPrice, estimatedDays, responseId } = responseDetails;

        const content = `
            <p>Hello <strong>${customerName}</strong>,</p>
            <p>Great news! An artist has submitted a proposal for your customization request.</p>
            
            <div style="background-color: #d1ecf1; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #17a2b8;">
                <h3 style="color: #0c5460; margin-top: 0;">📝 New Proposal Received</h3>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Proposal Details</h3>
                <p><strong>Request:</strong> ${requestTitle}</p>
                <p><strong>Artist:</strong> ${artistName}</p>
                <p><strong>Proposed Price:</strong> $${proposedPrice}</p>
                <p><strong>Estimated Completion:</strong> ${estimatedDays} days</p>
                <p><strong>Proposal ID:</strong> #${responseId}</p>
            </div>
            
            <p>You can now:</p>
            <ul>
                <li>Review the full proposal details in your dashboard</li>
                <li>Accept the proposal to start the project</li>
                <li>Ask questions or request modifications</li>
                <li>Wait for more proposals from other artists</li>
            </ul>
            
            <p>Log into your Craftopia account to view the complete proposal and artist portfolio.</p>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `New Proposal Received - ${requestTitle}`,
            html: getEmailTemplate('New Proposal Available!', content, 'Review the proposal and take the next step toward your custom artwork!')
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending customization response email:', error);
        return false;
    }
};


const sendBidReceivedEmail = async (email, userName, bidDetails) => {
    try {
        const { productName, bidAmount, currentHighestBid, auctionEndTime, isHighestBidder } = bidDetails;

        const content = `
            <p>Hello <strong>${userName}</strong>,</p>
            ${isHighestBidder ? 
                `<p>Congratulations! Your bid has been placed and you're currently the highest bidder!</p>
                 <div style="background-color: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                     <h3 style="color: #155724; margin-top: 0;">🎉 You're the Highest Bidder!</h3>
                 </div>` :
                `<p>Your bid has been placed successfully, but you've been outbid by another bidder.</p>
                 <div style="background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
                     <h3 style="color: #856404; margin-top: 0;">⚠️ You've Been Outbid</h3>
                 </div>`
            }
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Auction Details</h3>
                <p><strong>Product:</strong> ${productName}</p>
                <p><strong>Your Bid:</strong> $${bidAmount}</p>
                <p><strong>Current Highest Bid:</strong> $${currentHighestBid}</p>
                <p><strong>Auction Ends:</strong> ${new Date(auctionEndTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            
            ${!isHighestBidder ? 
                `<p>Don't worry! You can still place a higher bid before the auction ends.</p>` :
                `<p>Keep an eye on the auction as other bidders may still place higher bids.</p>`
            }
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Bid Update - ${productName}`,
            html: getEmailTemplate('Bid Status Update', content, 'Good luck with the auction!')
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending bid received email:', error);
        return false;
    }
};

const sendAuctionWonEmail = async (email, userName, auctionDetails) => {
    try {
        const { productName, winningBid, artistName, auctionId } = auctionDetails;

        const content = `
            <p>Hello <strong>${userName}</strong>,</p>
            <p>🎉 <strong>Congratulations! You've won the auction!</strong></p>
            
            <div style="background-color: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                <h3 style="color: #155724; margin-top: 0;">🏆 Auction Winner!</h3>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Winning Details</h3>
                <p><strong>Product:</strong> ${productName}</p>
                <p><strong>Winning Bid:</strong> $${winningBid}</p>
                <p><strong>Artist:</strong> ${artistName}</p>
                <p><strong>Auction ID:</strong> ${auctionId}</p>
            </div>
            
            <p>What happens next:</p>
            <ul>
                <li>You'll be contacted regarding payment and delivery</li>
                <li>The artist will prepare your item for shipment</li>
                <li>You'll receive tracking information once shipped</li>
            </ul>
            
            <p>Thank you for participating in our auction and supporting handcrafted arts!</p>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🎉 You Won! - ${productName}`,
            html: getEmailTemplate('Auction Victory!', content, 'Enjoy your beautiful handcrafted artwork!')
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending auction won email:', error);
        return false;
    }
};

const sendAuctionWonWithOrderEmail = async (email, userName, auctionDetails) => {
    try {
        const { productName, winningBid, artistName, auctionId, orderId, orderDate } = auctionDetails;

        const content = `
            <p>Hello <strong>${userName}</strong>,</p>
            <p>🎉 <strong>Congratulations! You've won the auction!</strong></p>
            
            <div style="background-color: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                <h3 style="color: #155724; margin-top: 0;">🏆 Auction Winner!</h3>
                <p style="color: #155724; margin: 0;">Your order has been automatically created</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Winning Details</h3>
                <p><strong>Product:</strong> ${productName}</p>
                <p><strong>Winning Bid:</strong> $${winningBid}</p>
                <p><strong>Artist:</strong> ${artistName}</p>
                <p><strong>Auction ID:</strong> ${auctionId}</p>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #17a2b8;">
                <h3 style="color: #0c5460; margin-top: 0;">📦 Your Order Information</h3>
                <p style="color: #0c5460;"><strong>Order ID:</strong> #${orderId}</p>
                <p style="color: #0c5460;"><strong>Order Date:</strong> ${new Date(orderDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="color: #0c5460; margin-bottom: 0;"><strong>Total Amount:</strong> $${winningBid}</p>
            </div>
            
            <p><strong>What happens next:</strong></p>
            <ul>
                <li>✅ Your order (#${orderId}) has been automatically created</li>
                <li>💳 Proceed to payment to complete your purchase</li>
                <li>🎨 The artist will prepare your item once payment is confirmed</li>
                <li>📦 You'll receive tracking information once shipped</li>
                <li>🏠 Your beautiful handcrafted artwork will be delivered to you</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background-color: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Complete Payment for Order #${orderId}</a>
            </div>
            
            <p>Thank you for participating in our auction and supporting handcrafted arts! We're thrilled that this beautiful piece has found its new home with you.</p>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🎉 You Won! Order #${orderId} Created - ${productName}`,
            html: getEmailTemplate('Auction Victory!', content, 'Complete your payment to secure your winning artwork!')
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending auction won with order email:', error);
        return false;
    }
};

const sendShipAuctionEmail = async (email, userName, orderDetails) => {
    try {
        const { orderId, trackingNumber, estimatedDelivery, totalAmount, customizationResponse, isAuction, auctionDetails } = orderDetails;
        const isCustomization = customizationResponse && customizationResponse.customizationId;
        
        const content = `
            <p>Hello <strong>${userName}</strong>,</p>
            ${isAuction ? 
                `<p>🎉 Congratulations! Your winning auction item has been shipped! 🏆</p>` :
                isCustomization ? 
                    `<p>Exciting news! Your custom artwork has been completed and shipped by the artist! 🎨</p>` :
                    `<p>Your order has been shipped! Here are the details:</p>`
            }
            
            <div style="background-color: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                <h3 style="color: #155724; margin-top: 0;">📦 ${isAuction ? 'Auction Item' : isCustomization ? 'Custom Artwork' : 'Order'} Shipped!</h3>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Shipping Details</h3>
                <p><strong>Order ID:</strong> #${orderId}</p>
                ${totalAmount ? `<p><strong>Total Amount:</strong> $${totalAmount}</p>` : ''}
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ${isAuction ? `
                    <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
                    <p><strong>Auction ID:</strong> #${auctionDetails.auctionId}</p>
                    <p><strong>Item Name:</strong> ${auctionDetails.productName}</p>
                    <p><strong>Winning Bid:</strong> $${auctionDetails.finalPrice}</p>
                    <p><strong>Bid Timestamp:</strong> ${new Date(auctionDetails.winningBid.timestamp).toLocaleString()}</p>
                ` : isCustomization ? `
                    <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
                    <p><strong>Customization ID:</strong> #${customizationResponse.customizationId}</p>
                    <p><strong>Project Price:</strong> $${customizationResponse.price}</p>
                ` : ''}
            </div>
            
            ${isAuction ? `
                <p>🎊 You won the auction! Your winning item has been carefully packaged and shipped by the artist. We're excited for you to receive your new treasure!</p>
                <p>You can track your package using the tracking number provided. Thank you for participating in our auction!</p>
            ` : isCustomization ? `
                <p>Your custom artwork has been crafted with care and attention to detail. The artist has put their heart into creating something unique just for you!</p>
                <p>You can track your package using the tracking number provided. We're excited for you to receive your one-of-a-kind piece!</p>
            ` : `
                <p>You can track your order using the tracking number provided. Thank you for shopping with us!</p>
            `}
        `;

        const subject = isAuction ? 
            `🏆 Your Winning Auction Item is On Its Way! - Order #${orderId}` :
            isCustomization ? 
                `🎨 Your Custom Artwork is On Its Way! - Order #${orderId}` :
                `Order Shipped - Order #${orderId}`;

        const footerMessage = isAuction ?
            'Congratulations on your winning bid! Your auction item is on its way.' :
            isCustomization ?
                'Your unique artwork is on its way! Thank you for supporting handcrafted arts.' :
                'We hope you enjoy your purchase!';

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: getEmailTemplate(isAuction ? 'Auction Item Shipped!' : isCustomization ? 'Custom Artwork Shipped!' : 'Order Shipped!', content, footerMessage)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending ship email:', error);
        return false;
    }
};
const sendPaymentConfirmationEmail = async (email, userName, paymentDetails) => {
    try {
        const { orderId, amount, paymentMethod, transactionId, paymentDate } = paymentDetails;

        const content = `
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Great news! Your payment has been successfully processed.</p>
            
            <div style="background-color: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                <h3 style="color: #155724; margin-top: 0;">✅ Payment Successful</h3>
                <p style="color: #155724; margin: 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Payment Details</h3>
                <p><strong>Order ID:</strong> #${orderId}</p>
                <p><strong>Amount Paid:</strong> $${amount}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                <p><strong>Payment Date:</strong> ${new Date(paymentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <p>Your order is now confirmed and will be processed shortly. The artists will begin working on your handcrafted items immediately.</p>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Payment Confirmed - Order #${orderId}`,
            html: getEmailTemplate('Payment Received!', content, 'Your payment is secure and your order is on its way!')
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
        return false;
    }
};

const sendCustomizationShipEmail = async (email, userName, orderDetails) => {
    try {
        const { orderId, trackingNumber, estimatedDelivery, totalAmount, customizationResponse } = orderDetails;
        
        const content = `
            <p>Hello <strong>${userName}</strong>,</p>
            <p>🎨 Exciting news! Your custom artwork has been completed and shipped by the artist! ✨</p>
            
            <div style="background-color: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                <h3 style="color: #155724; margin-top: 0;">🎨 Custom Artwork Shipped!</h3>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">📦 Shipping Details</h3>
                <p><strong>Order ID:</strong> #${orderId}</p>
                <p><strong>Total Amount:</strong> $${totalAmount}</p>
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                
                <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
                <h4 style="color: #333; margin: 10px 0;">🎯 Customization Project Details</h4>
                <p><strong>Customization ID:</strong> #${customizationResponse.customizationId}</p>
                <p><strong>Response ID:</strong> #${customizationResponse.responseId}</p>
                <p><strong>Project Status:</strong> <span style="color: #28a745; font-weight: bold;">${customizationResponse.status}</span></p>
                <p><strong>Final Price:</strong> $${customizationResponse.price}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; margin-top: 0;">🌟 Your Unique Masterpiece</h4>
                <p style="color: #856404; margin-bottom: 0;">Your custom artwork has been crafted with exceptional care and attention to detail. The artist has poured their creativity and skill into creating something truly unique just for you!</p>
            </div>
            
            <p>🚚 <strong>Track Your Package:</strong> You can track your custom artwork using the tracking number provided above. We recommend checking the tracking status regularly for the most up-to-date delivery information.</p>
            
            <p>💝 <strong>What to Expect:</strong> Your package has been carefully wrapped to ensure your artwork arrives in perfect condition. We're incredibly excited for you to receive your one-of-a-kind piece!</p>
            
            <p>🙏 <strong>Thank You:</strong> Thank you for supporting our talented artists and choosing custom artwork. Your investment in handcrafted art makes a real difference in supporting creative professionals.</p>
            
            <div style="background-color: #d1ecf1; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #17a2b8;">
                <p style="color: #0c5460; margin-bottom: 0;"><strong>💡 Tip:</strong> Once you receive your artwork, we'd love to see how you display it! Feel free to share photos with us and tag the artist who created your piece.</p>
            </div>
        `;

        const subject = `🎨 Your Custom Artwork is On Its Way! - Order #${orderId}`;
        const footerMessage = 'Your unique masterpiece is on its way! Thank you for supporting handcrafted arts and our talented artist community.';

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: getEmailTemplate('Custom Artwork Shipped!', content, footerMessage)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending customization ship email:', error);
        return false;
    }
};


const sendAuctionStartedToFollowersEmail = async (email, followerName, auctionDetails) => {
    try {
        const { productName, artistName, startingPrice, endDate, auctionId, productImage } = auctionDetails;

        const content = `
            <p>Hello <strong>${followerName}</strong>,</p>
            <p>Exciting news! <strong>${artistName}</strong>, an artist you follow, has just started a new auction!</p>
            
            <div style="background-color: #d1ecf1; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #17a2b8;">
                <h3 style="color: #0c5460; margin-top: 0;">🎨 New Auction Live Now!</h3>
                <p style="color: #0c5460; margin: 0;">Don't miss your chance to bid on this unique piece!</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Auction Details</h3>
                <p><strong>Artist:</strong> ${artistName}</p>
                <p><strong>Product:</strong> ${productName}</p>
                <p><strong>Starting Price:</strong> $${startingPrice}</p>
                <p><strong>Auction Ends:</strong> ${new Date(endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Auction ID:</strong> ${auctionId}</p>
            </div>
            
            ${productImage ? `
            <div style="text-align: center; margin: 20px 0;">
                <img src="${productImage}" alt="${productName}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            </div>
            ` : ''}
            
            <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; margin-top: 0;">⏰ Time Sensitive!</h4>
                <p style="color: #856404; margin-bottom: 0;">This auction is live now and won't last forever. Place your bid early to secure your chance at owning this beautiful handcrafted piece!</p>
            </div>
            
            <p>As a follower of <strong>${artistName}</strong>, you get early notification of their auctions. Here's what you can do:</p>
            <ul>
                <li>🔍 View the full auction details and high-resolution images</li>
                <li>💰 Place your bid to compete for this unique artwork</li>
                <li>👀 Watch the auction and get notified of new bids</li>
                <li>🏆 Win the auction and add this piece to your collection</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background-color: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Auction & Place Bid</a>
            </div>
            
            <p>Thank you for supporting <strong>${artistName}</strong> and the handcrafted arts community!</p>
        `;

        const mailOptions = {
            from: `"Craftopia" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🎨 ${artistName} Started a New Auction - ${productName}`,
            html: getEmailTemplate('New Auction Alert!', content, `Don't miss out on this exclusive piece from ${artistName}!`)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending auction started to followers email:', error);
        return false;
    }
};

module.exports = { 
    sendOTPEmail,
    sendOrderConfirmationEmail,
    sendAuctionApprovedEmail,
    sendAuctionRejectedEmail,
    sendNotificationEmail,
    sendCustomizationRequestReceivedEmail,
    sendCustomizationResponseEmail,
    sendBidReceivedEmail,
    sendAuctionWonEmail,
    sendShipAuctionEmail,
    sendCustomizationShipEmail,
    sendPaymentConfirmationEmail,
    sendAuctionStartedToFollowersEmail,
    sendAuctionWonWithOrderEmail
};