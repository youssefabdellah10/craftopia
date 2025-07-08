const validateAuctionStartDate = (value) => {
    if (typeof value !== 'object' || !value.date || !value.time) {
        throw new Error('Start date must be an object with date and time properties: { "date": "YYYY-MM-DD", "time": "HH:MM" }');
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value.date)) {
        throw new Error('Date must be in YYYY-MM-DD format');
    }
    
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(value.time)) {
        throw new Error('Time must be in HH:MM format (24-hour)');
    }
    const combinedDateTime = new Date(`${value.date}T${value.time}:00`);
    if (isNaN(combinedDateTime.getTime())) {
        throw new Error('Invalid date/time combination');
    }
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    if (combinedDateTime < oneYearAgo) {
        throw new Error('Date cannot be more than one year in the past');
    }
    
    if (combinedDateTime > oneYearFromNow) {
        throw new Error('Date cannot be more than one year in the future');
    }
    
    return true;
};

const validateFutureDateTime = (dateTimeObj) => {
    if (!dateTimeObj || !dateTimeObj.date || !dateTimeObj.time) {
        return false;
    }
    
    const combinedDateTime = new Date(`${dateTimeObj.date}T${dateTimeObj.time}:00`);
    const now = new Date();
    
    return combinedDateTime > now;
};

const convertToDateTime = (dateTimeObj) => {
    if (!dateTimeObj || !dateTimeObj.date || !dateTimeObj.time) {
        throw new Error('Invalid date/time object');
    }
    
    return new Date(`${dateTimeObj.date}T${dateTimeObj.time}:00`);
};

const formatToLocaleString = (date) => {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

const validateDeadline = (value) => {
    if (!value) {
        throw new Error('Deadline is required');
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
        throw new Error('Deadline must be in YYYY-MM-DD format (e.g., 2025-08-15)');
    }
    const deadlineDate = new Date(value + 'T00:00:00.000Z');
    
    if (isNaN(deadlineDate.getTime())) {
        throw new Error('Invalid date provided');
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (deadlineDate < today) {
        throw new Error('Deadline must be today or in the future');
    }
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (deadlineDate > oneYearFromNow) {
        throw new Error('Deadline cannot be more than one year in the future');
    }
    
    return true;
};

module.exports = {
    validateAuctionStartDate,
    validateFutureDateTime,
    convertToDateTime,
    formatToLocaleString,
    validateDeadline
};
