// app/api/pusher/notify/route.ts - API route to send notifications
import { NextRequest, NextResponse } from 'next/server';
import { getPusherServer } from '@/lib/pusher-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, event, data } = body;

    if (!channel || !event || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, event, data' },
        { status: 400 }
      );
    }

    const pusher = getPusherServer();
    await pusher.trigger(channel, event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
