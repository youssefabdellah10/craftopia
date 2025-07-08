const Customer = require('../models/customer');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const { firebase_db } = require('../config/firebase');
const { sendBidReceivedEmail } = require('../utils/emailService');
const { formatToLocaleString } = require('../utils/dateValidation');

exports.placeBid = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user.id;
        const customer = await Customer.findOne({where: {userId}});
        if (!customer) {
            return res.status(403).json({message: 'Only customers can place bids'});
        }

        const { auctionId, bidAmount } = req.body;
        
        const auctionSnapshot = await firebase_db.ref(`auctions/${auctionId}`).once('value');
        const auction = auctionSnapshot.val();
        
        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }
        
        if (auction.status !== 'active') {
            return res.status(400).json({ message: 'This auction is not active' });
        }
        
        const endTime = new Date(auction.endDate);
        const now = new Date();
        if (now > endTime) {
            await firebase_db.ref(`auctions/${auctionId}`).update({ status: 'ended' });
            return res.status(400).json({ message: 'This auction has ended' });
        }

        if (auction.bids) {
            const bidsArray = Object.values(auction.bids);
            if (bidsArray.length > 0) {
                const userExistingBid = bidsArray.find(bid => bid.userId === userId);
                if (userExistingBid) {
                    return res.status(400).json({ 
                        message: 'You have already placed a bid on this auction. Please use the update bid feature to modify your bid.',
                        existingBidAmount: userExistingBid.bidAmount,
                    });
                }

                const highestBid = bidsArray.reduce((max, bid) => 
                    bid.bidAmount > max.bidAmount ? bid : max
                );
                if (highestBid.userId === userId) {
                    return res.status(400).json({ 
                        message: 'You are already the highest bidder for this auction' 
                    });
                }
            }
        }
        
        const incrementPercentage = auction.incrementPercentage || 10;
        const minBidIncrement = (auction.startingPrice * incrementPercentage) / 100;
        const minimumBid = auction.currentPrice + minBidIncrement;
        
        if (parseFloat(bidAmount) < minimumBid) {
            return res.status(400).json({ 
                message: `Bid must be at least ${minimumBid.toFixed(2)}`,
                minimumBid: minimumBid.toFixed(2)
            });
        }
        
        const auctionRef = firebase_db.ref(`auctions/${auctionId}`);
        
        auctionRef.transaction((currentAuction) => {
            if (!currentAuction) {
                return null; 
            }
            
            if (currentAuction.status !== 'active') {
                return;
            }
            
            if (parseFloat(bidAmount) <= currentAuction.currentPrice) {
                return; 
            }
            
            if (!currentAuction.bids) {
                currentAuction.bids = {};
            }
            
            const bidId = `${Date.now()}_${userId}`;
            currentAuction.bids[bidId] = {
                userId,
                customerId: customer.customerId,
                customerName: customer.name || 'Anonymous',
                bidAmount: parseFloat(bidAmount),
                timestamp: formatToLocaleString(now)
            };

            currentAuction.currentPrice = parseFloat(bidAmount);
            currentAuction.lastBidTime = formatToLocaleString(now);
            currentAuction.bidCount = (currentAuction.bidCount || 0) + 1;
            currentAuction.lastBidder = userId;
            
            const timeLeftMinutes = (endTime - now) / (1000 * 60);
            if (timeLeftMinutes < 5) {
                const newEndTime = new Date(now.getTime() + 5 * 60 * 1000); 
                currentAuction.endDate = formatToLocaleString(newEndTime);
            }
            
            return currentAuction;
        }, (error, committed, snapshot) => {
            if (error) {
                console.error('Error placing bid:', error);
                return res.status(500).json({ message: 'Error placing bid: ' + error.message });
            }
            
            if (!committed) {
                return res.status(400).json({ message: 'Bid could not be placed. Please try again.' });
            }
            (async () => {
                try {
                    const user = await User.findByPk(userId);
                    if (user && user.email) {
                        const updatedAuction = snapshot.val();
                        const bidDetails = {
                            productName: updatedAuction.productDetails?.name || 'Auction Item',
                            bidAmount: parseFloat(bidAmount || 0).toFixed(2),
                            currentHighestBid: parseFloat(updatedAuction.currentPrice || 0).toFixed(2),
                            auctionEndTime: updatedAuction.endDate,
                            isHighestBidder: updatedAuction.lastBidder === userId
                        };
                        
                        await sendBidReceivedEmail(user.email, customer.name || 'Valued Customer', bidDetails);
                    }
                } catch (emailError) {
                    console.error('Error sending bid notification email:', emailError);
                }
            })();
            
            const updatedAuction = snapshot.val();
            return res.status(200).json({ 
                message: 'Bid placed successfully',
                currentPrice: updatedAuction.currentPrice,
                bidCount: updatedAuction.bidCount
            });
        });
        
    } catch (error) {
        console.error('Error placing bid:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getBidsByAuction = async (req, res) => {
    try {
        const { auctionId } = req.params;
        
        const auctionSnapshot = await firebase_db.ref(`auctions/${auctionId}`).once('value');
        const auction = auctionSnapshot.val();
        
        if (!auction) {
            return res.status(404).json({message: 'Auction not found'});
        }

        let bids = [];
        if (auction.bids) {
            bids = Object.entries(auction.bids).map(([id, bid]) => ({
                id,
                ...bid
            }));
            
            bids.sort((a, b) => {
                if (b.bidAmount !== a.bidAmount) {
                    return b.bidAmount - a.bidAmount;
                }
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
        }
        
        return res.status(200).json({
            auctionId,
            currentPrice: auction.currentPrice,
            bidCount: auction.bidCount || 0,
            bids
        });
        
    } catch (error) {
        console.error('Error getting bids:', error);
        return res.status(500).json({message: 'Internal server error'});
    }
};

exports.getMyBids = async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findOne({where: {userId}});
        if (!customer) {
            return res.status(403).json({message: 'Only customers can view their bids'});
        }
        
        const auctionsSnapshot = await firebase_db.ref('auctions').once('value');
        const auctions = auctionsSnapshot.val() || {};
        
        const myBids = [];
        
        Object.entries(auctions).forEach(([auctionId, auction]) => {
            if (auction.bids) {
                const userBids = Object.entries(auction.bids)
                    .filter(([_, bid]) => bid.userId === userId)
                    .map(([bidId, bid]) => ({
                        bidId,
                        auctionId,
                        bidAmount: bid.bidAmount,
                        timestamp: bid.timestamp,
                        isHighestBid: auction.lastBidder === userId,
                        auctionDetails: {
                            productId: auction.productId,
                            currentPrice: auction.currentPrice,
                            endDate: auction.endDate,
                            status: auction.status,
                            timeRemaining: new Date(auction.endDate) - new Date()
                        }
                    }));
                
                myBids.push(...userBids);
            }
        });
        
        myBids.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return res.status(200).json(myBids);
        
    } catch (error) {
        console.error('Error getting user bids:', error);
        return res.status(500).json({message: 'Internal server error'});
    }
};


exports.getTodayBids = async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);
        
        const auctionsSnapshot = await firebase_db.ref('auctions').once('value');
        const auctions = auctionsSnapshot.val() || {};
        
        const todayBids = [];
        
        Object.entries(auctions).forEach(([auctionId, auction]) => {
            if (auction.bids) {
                Object.entries(auction.bids).forEach(([bidId, bid]) => {
                    const bidTime = new Date(bid.timestamp);
                    if (!isNaN(bidTime.getTime()) && bidTime >= startOfDay && bidTime <= endOfDay) {
                        todayBids.push({
                            auctionId,
                            bidId,
                            ...bid,
                            auctionDetails: {
                                productId: auction.productId,
                                currentPrice: auction.currentPrice,
                                endDate: auction.endDate,
                                status: auction.status
                            }
                        });
                    }
                });
            }
        });
        todayBids.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return res.status(200).json({
            date: formatToLocaleString(now).split(',')[0],
            totalBids: todayBids.length,
            bids: todayBids
        });
        
    } catch (error) {
        console.error('Error getting today\'s bids:', error);
        return res.status(500).json({message: 'Internal server error'});
    }
};

exports.updateBid = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user.id;
        const customer = await Customer.findOne({where: {userId}});

        if (!customer) {
            return res.status(403).json({message: 'Only customers can update bids'});
        }
        const { auctionId, newBidAmount } = req.body;
        const auctionSnapshot = await firebase_db.ref(`auctions/${auctionId}`).once('value');
        const auction = auctionSnapshot.val();
        
        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }
        if (auction.status !== 'active') {
            return res.status(400).json({ message: 'This auction is not active' });
        }
        const endTime = new Date(auction.endDate);
        const now = new Date();
        if (now > endTime) {
            await firebase_db.ref(`auctions/${auctionId}`).update({ status: 'ended' });
            return res.status(400).json({ message: 'This auction has ended' });
        }

        if (!auction.bids) {
            return res.status(404).json({ message: 'No bids found for this auction' });
        }

        let userBidId = null;
        let existingBid = null;
        Object.entries(auction.bids).forEach(([bidId, bid]) => {
            if (bid.userId === userId) {
                userBidId = bidId;
                existingBid = bid;
            }
        });

        if (!existingBid) {
            return res.status(404).json({ message: 'You have not placed a bid on this auction' });
        }
        const bidsArray = Object.values(auction.bids);
        const highestBid = bidsArray.reduce((max, bid) => 
            bid.bidAmount > max.bidAmount ? bid : max
        );

        if (highestBid.userId === userId) {
            return res.status(400).json({ 
                message: 'You cannot update your bid because you are already the highest bidder' 
            });
        }

        const incrementPercentage = auction.incrementPercentage || 10;
        const minBidIncrement = (auction.startingPrice * incrementPercentage) / 100;

        if (parseFloat(newBidAmount) <= existingBid.bidAmount) {
            return res.status(400).json({ 
                message: `Bid must be at least ${(existingBid.bidAmount + 0.01).toFixed(2)}`,
                minimumBid: (existingBid.bidAmount + 0.01).toFixed(2)
            });
        }
        const otherBids = bidsArray.filter(bid => bid.userId !== userId);
        if (otherBids.length > 0) {
            const highestOtherBid = otherBids.reduce((max, bid) => 
                bid.bidAmount > max.bidAmount ? bid : max
            );
            
            const minimumUpdateBid = highestOtherBid.bidAmount + minBidIncrement;
            if (parseFloat(newBidAmount) < minimumUpdateBid) {
                return res.status(400).json({ 
                    message: `Updated bid must be at least ${minimumUpdateBid.toFixed(2)}`,
                    minimumBid: minimumUpdateBid.toFixed(2)
                });
            }
        }
        const auctionRef = firebase_db.ref(`auctions/${auctionId}`);
        
        auctionRef.transaction((currentAuction) => {
            if (!currentAuction) {
                return null; 
            }
            
            if (currentAuction.status !== 'active') {
                return;
            }
            if (currentAuction.bids && currentAuction.bids[userBidId]) {
                currentAuction.bids[userBidId] = {
                    ...currentAuction.bids[userBidId],
                    bidAmount: parseFloat(newBidAmount),
                    timestamp: formatToLocaleString(now),
                    updatedAt: formatToLocaleString(now)
                };

                currentAuction.currentPrice = parseFloat(newBidAmount);
                currentAuction.lastBidTime = formatToLocaleString(now);
                currentAuction.lastBidder = userId;
            }
            
            return currentAuction;
        }, (error, committed, snapshot) => {
            if (error) {
                console.error('Error updating bid:', error);
                return res.status(500).json({ message: 'Error updating bid: ' + error.message });
            }
            
            if (!committed) {
                return res.status(400).json({ message: 'Bid could not be updated. Please try again.' });
            }
            (async () => {
                try {
                    const user = await User.findByPk(userId);
                    if (user && user.email) {
                        const updatedAuction = snapshot.val();
                        const bidDetails = {
                            productName: updatedAuction.productDetails?.name || 'Auction Item',
                            bidAmount: parseFloat(newBidAmount || 0).toFixed(2),
                            currentHighestBid: parseFloat(updatedAuction.currentPrice || 0).toFixed(2),
                            auctionEndTime: updatedAuction.endDate,
                            isHighestBidder: updatedAuction.lastBidder === userId,
                            isUpdate: true
                        };
                        
                        await sendBidReceivedEmail(user.email, customer.name || 'Valued Customer', bidDetails);
                    }
                } catch (emailError) {
                    console.error('Error sending bid update notification email:', emailError);
                }
            })();
            
            const updatedAuction = snapshot.val();
            return res.status(200).json({ 
                message: 'Bid updated successfully',
                bidId: userBidId,
                oldBidAmount: existingBid.bidAmount,
                newBidAmount: parseFloat(newBidAmount),
                currentPrice: updatedAuction.currentPrice,
                bidCount: updatedAuction.bidCount
            });
        });
        
    } catch (error) {
        console.error('Error updating bid:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};