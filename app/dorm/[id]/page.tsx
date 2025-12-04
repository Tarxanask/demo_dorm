'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DormType, User } from '@/firebase/types';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

const DORM_INFO: Record<DormType, { location: string; facilities: string[]; description?: string; image?: string }> = {
  'KTU': {
    location: 'KTU Campus, Kaunas',
    facilities: ['WiFi', 'Lounge with TV', 'Table Tennis', 'Football Table', 'Air Hockey', 'Sports Areas', 'Study Rooms', 'Basketball Court'],
    description: 'Each dormitory has a lounge area equipped with a flat screen TV. Most dormitories have table tennis, football, and air hockey tables. Sports areas and learning spaces are available in all dormitories. Dorm no 11 has three resting rooms (one with TV, one with table tennis, one with air hockey), two sports rooms, recreational premises in the basement, and a basketball court. Dorm no 4 has recreational space in the basement including resting room with TV, mini kitchen, table tennis room, billiard table, sports club, and a basketball court.',
    image: '/images_dorms/KTU.png'
  },
  'LSMU': {
    location: 'Dainavos g. 3, Kaunas / Sukilėlių pr. 53, Kaunas',
    facilities: ['WiFi', 'Game Room (6th floor)', '24/7 Study Room (3rd & 11th floors)', 'Free-Open Marketplace Floor', 'Gym', 'Cinema-Style Relaxation Zone'],
    description: 'At Lithuanian University of Health Sciences (LSMU) dormitories, you\'ll find dedicated leisure floors such as a game-room on the 6th floor and a 24/7 study room on the 3rd and 11th floors. The dorms also include a "free-open marketplace" floor where students can swap items and a gym and cinema-style relaxation zone as part of the upgraded common spaces.',
    image: '/images_dorms/LSMU.png'
  },
  'Solo Society': {
    location: 'Kęstučio g. 36, Kaunas 44310',
    facilities: ['WiFi', 'Game Room', 'Table Tennis', 'Table Football', 'PS5 Zone', 'Rooftop Terrace', 'Study Room with Piano', 'Basement Leisure Zone'],
    description: 'Solo Society features a game room (table tennis, table football, etc.), a PS5 zone, and a rooftop terrace — great for organising game tournaments or evening chill-outs. There\'s also a study room with a piano and a cool basement leisure zone — perfect for music sessions or creative events.',
    image: '/images_dorms/SoloSociety.png'
  },
  'VMU Dorms': {
    location: 'Vytauto pr. 71, Kaunas; Universiteto g. 8, Akademija',
    facilities: ['WiFi', 'Laundry', 'Kitchen', 'Study Room', 'Rooftop with View', 'Modern Lobby', 'Free Broadband Internet', 'Parking Spaces', 'Music Room with Pianos', 'Reading Room', 'Table Tennis Area', 'Recreation Area', 'Meditation Room'],
    description: 'On the top floor there\'s a great view over Kaunas — perfect for social snaps or rooftop-type meetups. The lobby is comfortable and the building is modern after renovation — this makes hosting events easy. Because of the central location and modern feel, it\'s ideal for a dorm-wide fun gathering. VMU Dorms feature excellent communal areas including a Music Room with pianos on the 1st floor, Reading Room on the 2nd floor, Table Tennis Area on the 3rd floor, Recreation Area on the 4th floor, and a Meditation Room on the 5th floor — perfect for relaxation, study sessions, or social activities.',
    image: '/images_dorms/Other dorm.png'
  },
  'Other Dorms': {
    location: 'Various locations in Kaunas (e.g., Taikos prospektas 121, V. Krėvės prospektas 92)',
    facilities: ['WiFi', 'Common Areas', 'Study Rooms', 'Convenient Location', 'Public Transport Access'],
    description: 'The "Other Dorms" category includes places like Kauno kolegija\'s Student Residence Hall 1 on Taikos prospektas 121 and Residence Hall 2 on V. Krėvės prospektas 92, as well as several smaller student housing options across Kaunas. These dorms feature cozy common areas and study rooms where students from different institutions can interact and relax. They are conveniently located near public transport and city hotspots, making them ideal for organizing casual gatherings or events. Because they are not tied to a single university, they create a diverse and social environment for students throughout Kaunas.',
    image: '/images_dorms/Baltija VDU.png'
  },
  'General Community': {
    location: 'Kaunas City and Surrounding Areas',
    facilities: ['Public Spaces', 'Cafes', 'Parks', 'Community Centers', 'Co-working Spaces', 'Event Venues'],
    description: 'General Community welcomes everyone who wants to connect and socialize in Kaunas. Whether you\'re a student, young professional, or simply looking to make new friends, this community is for you. Join us for cafe meetups, park gatherings, professional networking events, hobby groups, and social activities throughout the city. Discover new places, meet interesting people, and be part of an inclusive community that celebrates diversity and friendship.',
    image: '/images_dorms/GE.png'
  },
  'Global': {
    location: 'Global Community',
    facilities: ['Online Chat', 'Community Events', 'Global Network', 'Open to All'],
    description: 'The Global community is a space for all students and individuals to connect, share experiences, and collaborate regardless of their dorm or location. This is an open community that welcomes everyone.',
    image: '/images_dorms/GE.png'
  }
};

export default function DormPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  // Decode the dormId from URL (handles URL encoding like %20 for spaces)
  const dormId = decodeURIComponent(params.id as string) as DormType;

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    async function fetchMembers() {
      const q = query(collection(db, 'users'), where('dorm', '==', dormId));
      const snapshot = await getDocs(q);
      const membersList = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as User));
      setMembers(membersList);
    }

    if (dormId && DORM_INFO[dormId]) {
      fetchMembers();
    }
  }, [dormId, currentUser, router]);

  if (!dormId || !DORM_INFO[dormId]) {
    return <div>Dorm not found</div>;
  }

  const dormInfo = DORM_INFO[dormId];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <BackButton href="/home" />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {dormInfo.image && (
          <div style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden' }}>
            <img 
              src={dormInfo.image} 
              alt={dormId}
              style={{
                width: '100%',
                height: '300px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>
        )}
        
        <h1 style={{ marginBottom: '1rem' }}>{dormId}</h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <h3>Location</h3>
          <p>{dormInfo.location}</p>
        </div>

        {dormInfo.description && (
          <div style={{ marginBottom: '1rem' }}>
            <h3>About</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{dormInfo.description}</p>
          </div>
        )}

        <div>
          <h3>Facilities</h3>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.5rem',
            marginTop: '0.5rem'
          }}>
            {dormInfo.facilities.map(facility => (
              <span 
                key={facility}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#e6f2ff',
                  color: '#0070f3',
                  borderRadius: '20px',
                  fontSize: '0.9rem'
                }}
              >
                {facility}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2>Members ({members.length})</h2>
          <Link 
            href={`/dorm/${dormId}/members`}
            className="btn btn-primary"
          >
            View All Members
          </Link>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          {members.slice(0, 6).map(member => (
            <Link 
              key={member.uid}
              href={`/profile/${member.uid}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              >
                {member.photoURL ? (
                  <img 
                    src={member.photoURL} 
                    alt={member.displayName}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginBottom: '0.75rem',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                    margin: '0 auto 0.75rem',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }} />
                )}
                <div style={{ 
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '0.25rem',
                  fontSize: '1rem'
                }}>{member.displayName}</div>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>{member.faculty}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


