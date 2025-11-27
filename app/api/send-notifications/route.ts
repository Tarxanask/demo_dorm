import { NextRequest, NextResponse } from 'next/server';
import type { ServiceAccount } from 'firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { tokens, notification, data } = await request.json();

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: 'No tokens provided' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
      const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: privateKey,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    // Get messaging service
    const messaging = admin.messaging();

    // Send to all tokens using sendEachForMulticast which is properly typed
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: (data || {}) as Record<string, string>,
      webpush: {
        fcmOptions: {
          link: '/',
        },
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/images/logo.png',
          badge: '/images/logo.png',
          tag: 'dormzy',
        },
      },
    });

    console.log(`Sent ${response.successCount} notifications, ${response.failureCount} failed`);

    // Log failures if any
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${idx}:`, resp.error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: String(error) },
      { status: 500 }
    );
  }
}
