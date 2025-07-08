const admin = require("firebase-admin");
require('dotenv').config();

console.log('Firebase Database URL:', process.env.FIREBASE_DATABASE_URL);

const serviceAccount = {
  type: process.env.FIREBASE_TYPE || "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_EMAIL ? 
    `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}` : undefined,
  universe_domain: "googleapis.com"
};

const requiredFirebaseVars = [
  'FIREBASE_DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID'
];

const missingVars = requiredFirebaseVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('ERROR: Missing required Firebase environment variables:', missingVars);
  console.error('Please make sure to set all Firebase environment variables');
  throw new Error(`Missing Firebase environment variables: ${missingVars.join(', ')}`);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

const firebase_db = admin.database();
const firebase_auth = admin.auth();

const originalRef = firebase_db.ref;
firebase_db.ref = function() {
  const ref = originalRef.apply(firebase_db, arguments);
  
  const originalTransaction = ref.transaction;
  ref.transaction = function(updateFn, onComplete) {
    const callback = typeof onComplete === 'function' ? onComplete : () => {};
    return originalTransaction.call(ref, updateFn, callback);
  };
  
  return ref;
};

module.exports = { firebase_db, firebase_auth };
