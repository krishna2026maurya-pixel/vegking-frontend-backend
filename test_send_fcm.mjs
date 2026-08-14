import fs from 'fs';
import admin from 'firebase-admin';

// Simple parser for env files to load them into process.env
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();
      // Remove surrounding quotes if any
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

loadEnv('.env.local');
loadEnv('.env');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Error: Firebase environment variables are missing in your .env.local file.');
  process.exit(1);
}

// Initialize Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  process.exit(1);
}

// Get FCM Token from command line arguments
const fcmToken = process.argv[2];

if (!fcmToken) {
  console.log('\n===============================================================');
  console.log('✅ Firebase Admin SDK is successfully connected!');
  console.log('To send a real push notification, run this script with a token:');
  console.log('  node test_send_fcm.mjs <YOUR_DEVICE_FCM_TOKEN>');
  console.log('===============================================================\n');
  process.exit(0);
}

const message = {
  token: fcmToken,
  notification: {
    title: 'VegKing Test Notification',
    body: 'If you see this message, FCM is connected and working perfectly! 🎉',
  },
  data: {
    test: 'true',
    timestamp: new Date().toISOString(),
  },
};

console.log(`Sending push notification to token: ${fcmToken}...`);

admin.messaging().send(message)
  .then((response) => {
    console.log('\n✅ Push notification sent successfully!');
    console.log('Message ID:', response);
  })
  .catch((error) => {
    console.error('\n❌ Failed to send push notification:', error.message);
  });
