import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase config
const isConfigValid = Object.values(firebaseConfig).every(value => 
  value !== undefined && value !== null && value !== '');

if (!isConfigValid) {
  console.error('Firebase configuration is invalid. Check your environment variables.');
  // Log missing values for debugging
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) console.error(`Missing Firebase config value: ${key}`);
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with better error handling
const auth = getAuth(app);

// Initialize Firestore with specific settings for better performance and reliability
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  ignoreUndefinedProperties: true // Prevents errors with undefined values
});

// Enable offline persistence if it's a production environment
if (import.meta.env.PROD) {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      console.error("Firestore persistence error:", err);
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence');
      }
    });
}

// Set up Google Provider
const googleProvider = new GoogleAuthProvider();

// Add scopes to the Google provider
googleProvider.addScope('profile');
googleProvider.addScope('email');

// HARDCODED RIDER FOR BYPASSING LOGIN ONLY
const MOCK_RIDER = {
  uid: 'rider-john-doe-123',
  email: 'john.doe@example.com',
  displayName: 'John Doe',
  photoURL: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff',
  emailVerified: true,
  isAnonymous: false,
  phoneNumber: '+1234567890',
  providerData: [{
    providerId: 'password',
    uid: 'john.doe@example.com',
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    photoURL: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff'
  }],
  // Add necessary Firebase user methods
  getIdToken: () => Promise.resolve('mock-token-for-john-doe-123'),
  reload: () => Promise.resolve(),
  delete: () => Promise.resolve(),
  toJSON: () => ({
    uid: 'rider-john-doe-123',
    email: 'john.doe@example.com',
    displayName: 'John Doe'
  })
};

// MOCK ORDERS FOR TESTING
export const MOCK_ORDERS = [
  {
    id: 'order-123',
    orderNumber: 'GV12345',
    status: 'assigned',
    riderId: 'mock-rider-123',
    createdAt: new Date().toISOString(),
    items: [
      { name: 'The Last of Us Part II', quantity: 1, price: 59.99 },
      { name: 'PlayStation Controller', quantity: 1, price: 69.99 }
    ],
    customer: {
      name: 'John Smith',
      address: '123 Main St, Cityville, ST 12345',
      phone: '555-123-4567'
    },
    pickup: {
      name: 'Game Vault Store',
      address: '789 Gaming Blvd, Cityville, ST 12345',
      phone: '555-987-6543'
    }
  },
  {
    id: 'order-456',
    orderNumber: 'GV67890',
    status: 'picked_up',
    riderId: 'mock-rider-123',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    statusUpdatedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    items: [
      { name: 'Elden Ring', quantity: 1, price: 59.99 },
      { name: 'Xbox Gift Card', quantity: 1, price: 50.00 }
    ],
    customer: {
      name: 'Alice Johnson',
      address: '456 Oak Ave, Townsville, ST 54321',
      phone: '555-765-4321'
    },
    pickup: {
      name: 'Game Vault Store',
      address: '789 Gaming Blvd, Cityville, ST 12345',
      phone: '555-987-6543'
    }
  }
];

// Sign in with hardcoded John Doe account (for login bypass only)
export const signInWithGoogle = async () => {
  try {
    console.log("Using John Doe hardcoded account instead of Google Auth");
    // Return the hardcoded rider instead of actual authentication
    return { 
      user: MOCK_RIDER, 
      token: 'mock-token-for-john-doe-123' 
    };
  } catch (error) {
    console.error("Error signing in with hardcoded account:", error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    // Just a simple clean up as we're not using real Firebase auth
    console.log("Signing out hardcoded user");
    return Promise.resolve();
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get current user - returns the hardcoded rider
export const getCurrentUser = () => {
  return MOCK_RIDER;
};

// Get ID token of current user
export const getIdToken = async (forceRefresh = false) => {
  return 'mock-token-for-john-doe-123';
};

// Auth state observer - returns hardcoded rider
export const observeAuthState = (callback) => {
  try {
    console.log("Setting up auth state observer with hardcoded user");
    // Immediately call callback with mock rider
    setTimeout(() => {
      callback(MOCK_RIDER);
    }, 300); // Slight delay for realism
    
    // Return a dummy unsubscribe function
    return () => {
      console.log("Auth observer unsubscribed");
    };
  } catch (error) {
    console.error("Error setting up auth state observer:", error);
    callback(null);
    return () => {};
  }
};

export { auth, db }; 