const validateMessageContent = (content) => {
    if (!content) return { isValid: true };

    const personalDataPatterns = [
        // Phone numbers (various formats)
        /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
        /(?:\+?[1-9]\d{0,3}[-.\s]?)?\(?[0-9]{1,4}\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/g,
        
        // Email addresses
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        
        // URLs
        /https?:\/\/[^\s]+/g,
        /www\.[^\s]+/g,
  
        // Common address patterns
        /\b\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|place|pl)\b/gi,
    ];

    const suspiciousWords = [
        'address', 'phone', 'mobile', 'email', 'contact me at',
        'call me', 'whatsapp', 'telegram', 'instagram',
        'facebook', 'twitter', 'linkedin', 'snapchat', 'tiktok',
        'my number is', 'reach me at', 'find me on' ,'username'
    ];

    for (const pattern of personalDataPatterns) {
        if (pattern.test(content)) {
            return {
                isValid: false,
                reason: 'Message contains personal information like phone numbers, emails, or addresses'
            };
        }
    }
    const lowerContent = content.toLowerCase();
    for (const word of suspiciousWords) {
        if (lowerContent.includes(word)) {
            return {
                isValid: false,
                reason: 'Message contains terms that suggest sharing personal contact information'
            };
        }
    }

    return { isValid: true };
};

module.exports = {
    validateMessageContent
};
