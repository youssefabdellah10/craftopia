const CreditCard = require('../models/creditCard');

const seedCreditCards = async () => {
    try {
        const existingCards = await CreditCard.count();
        if (existingCards > 0) {
            return;
        }

        const creditCards = [
            {
                number: '4532015112830366',
                expiryDate: '12/25',
                amount: 5000000.00
            },
            {
                number: '4916738394857643',
                expiryDate: '10/26',
                amount: 1000000.00
            },
            {
                number: '5425233430109903',
                expiryDate: '08/27',
                amount: 750000.00
            },
            {
                number: '5555555555554444',
                expiryDate: '06/28',
                amount: 1500000.00
            },
            {
                number: '4111111111111111',
                expiryDate: '04/29',
                amount: 12000000.00
            }
        ];

        await CreditCard.bulkCreate(creditCards);
        console.log('✅ 5 credit cards have been seeded successfully!');
        
     
        const createdCards = await CreditCard.findAll();
        console.log('Created credit cards:');
        createdCards.forEach(card => {
            console.log(`- Card: **** **** **** ${card.number.slice(-4)}, Expires: ${card.expiryDate}, Balance: $${card.amount}`);
        });
        
    } catch (error) {
        console.error('❌ Error seeding credit cards:', error);
    }
};

module.exports = seedCreditCards;
