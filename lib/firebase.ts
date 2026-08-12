import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('\x1b[32m[Firebase Admin] Initialized successfully.\x1b[0m');
    } catch (e: any) {
      console.error('[Firebase Admin] Initialization failed:', e.message);
    }
  } else {
    console.warn('\x1b[33m[Firebase Admin] Not initialized. Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in environment.\x1b[0m');
  }
}

/**
 * Verify a Firebase ID Token sent from the client (for Phone Auth OTP verification).
 * @param token Firebase ID Token (JWT)
 * @returns The verified phone number associated with the token, or null.
 */
export async function verifyFirebaseIdToken(token: string): Promise<string | null> {
  if (!admin.apps.length) {
    console.log('\x1b[33m[Firebase Admin Mock] verifyFirebaseIdToken called (Firebase not initialized). Fallback to mock.\x1b[0m');
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.phone_number || null;
  } catch (error: any) {
    console.error('[Firebase Auth] Failed to verify ID token:', error.message);
    throw new Error(`Firebase token verification failed: ${error.message}`);
  }
}

/**
 * Send a push notification to a specific device via FCM.
 * @param fcmToken The recipient device's FCM push token
 * @param title Notification title
 * @param body Notification body
 * @param data Optional payload data
 */
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  if (!admin.apps.length) {
    console.log('\x1b[34m====== [MOCK FCM NOTIFICATION] ======\x1b[0m');
    console.log(`To FCM Token : ${fcmToken}`);
    console.log(`Title        : ${title}`);
    console.log(`Body         : ${body}`);
    console.log(`Data         :`, data);
    console.log('\x1b[34m=====================================\x1b[0m');
    return { success: true, message: 'Mock notification logged to console.' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data,
    };

    const response = await admin.messaging().send(message);
    console.log(`\x1b[32m[FCM] Notification sent successfully, messageId:\x1b[0m ${response}`);
    return { success: true, messageId: response };
  } catch (error: any) {
    console.error('[FCM] Failed to send push notification:', error.message);
    throw new Error(`FCM sending failed: ${error.message}`);
  }
}

/**
 * Send a push notification to multiple device tokens via FCM.
 * @param tokens Array of FCM push tokens
 * @param title Notification title
 * @param body Notification body
 * @param data Optional payload data
 */
export async function sendMulticastNotification(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  if (!admin.apps.length) {
    console.log('\x1b[34m====== [MOCK FCM MULTICAST] ======\x1b[0m');
    console.log(`To Tokens (${tokens.length}) :`, tokens);
    console.log(`Title        : ${title}`);
    console.log(`Body         : ${body}`);
    console.log(`Data         :`, data);
    console.log('\x1b[34m==================================\x1b[0m');
    return { success: true, message: 'Mock multicast logged to console.', successCount: tokens.length, failureCount: 0 };
  }

  try {
    const validTokens = tokens.filter(t => t && t.trim() !== '');
    if (validTokens.length === 0) {
      return { success: true, successCount: 0, failureCount: 0 };
    }

    const message = {
      tokens: validTokens,
      notification: {
        title,
        body,
      },
      data,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`\x1b[32m[FCM Multicast] Sent successfully. Successes: ${response.successCount}, Failures: ${response.failureCount}\x1b[0m`);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error: any) {
    console.error('[FCM Multicast] Failed to send multicast notification:', error.message);
    throw new Error(`FCM multicast sending failed: ${error.message}`);
  }
}
