// lib/pusher-server.ts - Server-side Pusher instance (for API routes)
import Pusher from 'pusher';

let pusherServer: Pusher | null = null;

export function getPusherServer() {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true
    });
  }
  return pusherServer;
}
