// Pre-selected event images
// Images are stored in public/images folder

export interface EventImage {
  id: string;
  name: string;
  url: string;
}

export const EVENT_IMAGES: EventImage[] = [
  {
    id: 'mafia',
    name: 'Mafia Game',
    url: '/images/Screenshot 2025-11-09 202351.png'
  },
  {
    id: 'sports',
    name: 'Sports',
    url: '/images/Screenshot 2025-11-09 202441.png'
  },
  {
    id: 'uno',
    name: 'Uno Card Game',
    url: '/images/Screenshot 2025-11-09 202630.png'
  },
  {
    id: 'dance',
    name: 'Dance Party',
    url: '/images/Screenshot 2025-11-09 202900.png'
  },
  {
    id: 'movie',
    name: 'Movie Night',
    url: '/images/Screenshot 2025-11-09 202945.png'
  },
  {
    id: 'karaoke',
    name: 'Karaoke',
    url: '/images/Screenshot 2025-11-09 203334.png'
  },
  {
    id: 'billiard',
    name: 'Billiard Night',
    url: '/images/Screenshot 2025-11-09 203954.png'
  },
  {
    id: 'boardgames',
    name: 'Board Games',
    url: '/images/Screenshot 2025-11-09 204320.png'
  },
  {
    id: 'cooking',
    name: 'Cooking Together',
    url: '/images/Screenshot 2025-11-09 204528.png'
  }
];
