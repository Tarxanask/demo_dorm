import { analytics } from '@/firebase/config';
import { logEvent } from 'firebase/analytics';

export const trackPageView = (pageName: string) => {
  if (analytics && typeof window !== 'undefined') {
    logEvent(analytics, 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
    console.log('📊 Page view tracked:', pageName);
  }
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, eventName, params);
    console.log('📊 Event tracked:', eventName, params);
  }
};

export const trackSignup = (method: string = 'email') => {
  trackEvent('sign_up', { method });
};

export const trackLogin = (method: string = 'email') => {
  trackEvent('login', { method });
};

export const trackMessage = (dormId: string) => {
  trackEvent('send_message', { dorm_id: dormId });
};

export const trackEventCreation = (dormId: string) => {
  trackEvent('create_event', { dorm_id: dormId });
};

export const trackEventRSVP = (eventId: string, dormId: string) => {
  trackEvent('rsvp_event', { event_id: eventId, dorm_id: dormId });
};

export const trackDirectMessage = (recipientId: string) => {
  trackEvent('send_direct_message', { recipient_id: recipientId });
};
