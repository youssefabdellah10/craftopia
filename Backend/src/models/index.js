const sequelize = require('../config/db');

// Import models
const User = require('./user');
const Artist = require('./artist');
const Customer = require('./customer');
const Admin = require('./admin');
const Product = require('./product');
const Order = require('./order');
const Product_Order = require('./Product_Order');
const Category = require('./category');
const Report = require('./report');
const Review = require('./Review');
const Wishlist = require('./wishlist');
const CustomizationRequest = require('./customizationRequest');
const CustomizationResponse = require('./customizationResponse');
const ArtistFollow = require('./artistFollow');
const Payment = require('./payment');
const AuctionRequest = require('./auctionRequest');
const categoryRequests = require('./categoriesRequests');
const Rating = require('./rating');
const OTP = require('./otp');
const Message = require('./message');
const Cart = require('./cart');
const customizationResponse = require('./customizationResponse');
const CreditCard = require('./creditCard');
const Sales = require('./sales');


// User-Related Associations
User.hasOne(Admin, { foreignKey: 'userId' });
Admin.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Artist, { foreignKey: 'userId' });
Artist.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Customer, { foreignKey: 'userId' });
Customer.belongsTo(User, { foreignKey: 'userId' });

// Artist & Product Relationship
Artist.hasMany(Product, { foreignKey: 'artistId' });
Product.belongsTo(Artist, { foreignKey: 'artistId' });

// Category & Product Relationship
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// Order & Customer Relationship
Customer.hasMany(Order, { foreignKey: 'customerId' });
Order.belongsTo(Customer, { foreignKey: 'customerId' });

// Many-to-Many Order & Product Relationship (Through Product_Order)
Order.belongsToMany(Product, { through: Product_Order, foreignKey: 'orderId' });
Product.belongsToMany(Order, { through: Product_Order, foreignKey: 'productId' });

// Many-to-Many Customer & Product Relationship (Through Cart)
Customer.belongsToMany(Product, { through: Cart, foreignKey: 'customerId' });
Product.belongsToMany(Customer, { through: Cart, foreignKey: 'productId' });

// Direct associations for Cart junction table
Customer.hasMany(Cart, { foreignKey: 'customerId' });
Cart.belongsTo(Customer, { foreignKey: 'customerId' });

Product.hasMany(Cart, { foreignKey: 'productId' });
Cart.belongsTo(Product, { foreignKey: 'productId' });

// Polymorphic Report Associations - Reporter can be Artist or Customer
Report.belongsTo(Artist, { 
    foreignKey: 'ReporterID',
    constraints: false,
    scope: {
        ReporterType: 'artist'
    },
    as: 'ReporterArtist'
});

Report.belongsTo(Customer, { 
    foreignKey: 'ReporterID',
    constraints: false,
    scope: {
        ReporterType: 'customer'
    },
    as: 'ReporterCustomer'
});

// Polymorphic Report Associations - Reported can be Artist or Customer
Report.belongsTo(Artist, { 
    foreignKey: 'ReportedID',
    constraints: false,
    scope: {
        ReportedType: 'artist'
    },
    as: 'ReportedArtist'
});

Report.belongsTo(Customer, { 
    foreignKey: 'ReportedID',
    constraints: false,
    scope: {
        ReportedType: 'customer'
    },
    as: 'ReportedCustomer'
});

// Reverse associations for finding reports where user is reporter
Artist.hasMany(Report, { 
    foreignKey: 'ReporterID',
    constraints: false,
    scope: {
        ReporterType: 'artist'
    },
    as: 'ArtistReports'
});

Customer.hasMany(Report, { 
    foreignKey: 'ReporterID',
    constraints: false,
    scope: {
        ReporterType: 'customer'
    },
    as: 'CustomerReports'
});

// Reverse associations for finding reports where user is reported
Artist.hasMany(Report, { 
    foreignKey: 'ReportedID',
    constraints: false,
    scope: {
        ReportedType: 'artist'
    },
    as: 'ReportsAgainstArtist'
});

Customer.hasMany(Report, { 
    foreignKey: 'ReportedID',
    constraints: false,
    scope: {
        ReportedType: 'customer'
    },
    as: 'ReportsAgainstCustomer'
});

// Product & Review Relationship
Product.hasMany(Review, { foreignKey: 'productId' });
Review.belongsTo(Product, { foreignKey: 'productId' });

// Customer & Review Relationship
Customer.hasMany(Review, { foreignKey: 'customerId' });
Review.belongsTo(Customer, { foreignKey: 'customerId' });

// Customer & Wishlist Relationship
Customer.hasMany(Wishlist, { foreignKey: 'customerId' });
Wishlist.belongsTo(Customer, { foreignKey: 'customerId' });

// Product & Wishlist Relationship
Product.hasMany(Wishlist, { foreignKey: 'productId' });
Wishlist.belongsTo(Product, { foreignKey: 'productId' });

// Customer & CustomizationRequest Relationship
Customer.hasMany(CustomizationRequest, { foreignKey: 'customerId' });
CustomizationRequest.belongsTo(Customer, { foreignKey: 'customerId' });

//artist & CustomizationResponse Relationship
Artist.hasMany(CustomizationResponse, { foreignKey: 'artistId' });
CustomizationResponse.belongsTo(Artist, { foreignKey: 'artistId' });


// CustomizationRequest & CustomizationResponse Relationship
CustomizationRequest.hasMany(CustomizationResponse, { foreignKey: 'requestId' });
CustomizationResponse.belongsTo(CustomizationRequest, { foreignKey: 'requestId' });

// Many-to-Many Artist & Customer Relationship (Through ArtistFollow)
Artist.belongsToMany(Customer, { through: ArtistFollow, foreignKey: 'artistId' });
Customer.belongsToMany(Artist, { through: ArtistFollow, foreignKey: 'customerId' });

// Direct associations for ArtistFollow
Artist.hasMany(ArtistFollow, { foreignKey: 'artistId' });
ArtistFollow.belongsTo(Artist, { foreignKey: 'artistId' });

Customer.hasMany(ArtistFollow, { foreignKey: 'customerId' });
ArtistFollow.belongsTo(Customer, { foreignKey: 'customerId' });

// payment & order Relationship (One Order can have multiple Payments pay or refund)
Order.hasMany(Payment, { foreignKey: 'orderId' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

//customer & payment Relationship
Customer.hasMany(Payment, { foreignKey: 'customerId' });
Payment.belongsTo(Customer, { foreignKey: 'customerId' });

// CreditCard & Payment Relationship (One CreditCard can have multiple Payments)
CreditCard.hasMany(Payment, { foreignKey: 'paymentReference' });
Payment.belongsTo(CreditCard, { foreignKey: 'paymentReference' });

// Auction Request associations
Artist.hasMany(AuctionRequest, { foreignKey: 'artistId' });
AuctionRequest.belongsTo(Artist, { foreignKey: 'artistId' });

Product.hasMany(AuctionRequest, { foreignKey: 'productId' });
AuctionRequest.belongsTo(Product, { foreignKey: 'productId' });

// Category Requests associations
Artist.hasMany(categoryRequests, { foreignKey: 'artistId' });
categoryRequests.belongsTo(Artist, { foreignKey: 'artistId' });

// Rating associations (Customer rates Artist)
Customer.hasMany(Rating, { foreignKey: 'customerId' });
Rating.belongsTo(Customer, { foreignKey: 'customerId' });

Artist.hasMany(Rating, { foreignKey: 'artistId' });
Rating.belongsTo(Artist, { foreignKey: 'artistId' });



// OTP & User Relationship
User.hasMany(OTP, { foreignKey: 'userId' });
OTP.belongsTo(User, { foreignKey: 'userId' });

// Message & CustomizationRequest Relationship
CustomizationResponse.hasMany(Message, { foreignKey: 'responseId' });
Message.belongsTo(customizationResponse, { foreignKey: 'responseId' });

// Message & user Relationship
User.hasMany(Message, { foreignKey: 'senderId' });
Message.belongsTo(User, { foreignKey: 'senderId' });

// Sales associations
Artist.hasMany(Sales, { foreignKey: 'artistId' });
Sales.belongsTo(Artist, { foreignKey: 'artistId' });

Payment.hasMany(Sales, { foreignKey: 'paymentId' });
Sales.belongsTo(Payment, { foreignKey: 'paymentId' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Artist,
  Customer,
  Admin,
  Product,
  Category,
  Order,
  Product_Order,
  Report,
  Review,
  Wishlist,
  CustomizationRequest,
  CustomizationResponse,  
  ArtistFollow,  
  AuctionRequest,
  categoryRequests,
  Rating,
  OTP,
  Message,
  Cart,
  Payment,
  CreditCard,
  Sales
};