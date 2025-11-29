// lib/pusher-client.ts - Client-side Pusher instance
import PusherClient from 'pusher-js';

let pusherClient: PusherClient | null = null;

export function getPusherClient() {
  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (!key || !cluster) {
      console.error('Pusher credentials missing:', { key: !!key, cluster: !!cluster });
      throw new Error('Pusher credentials are not configured');
    }
    
    console.log('Initializing Pusher client with cluster:', cluster);
    pusherClient = new PusherClient(key, {
      cluster: cluster,
    });
  }
  return pusherClient;
}
