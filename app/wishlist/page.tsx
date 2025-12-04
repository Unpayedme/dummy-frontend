'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Testimonial {
  id: number;
  message: string;
  name: string;
  handle: string;
  avatar: string | null;
  chart: number[];
}

export default function WishlistPage() {
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleProfileClick = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (profileMenuOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [profileMenuOpen]);

  const handleProfilePage = () => {
    setProfileMenuOpen(false);
    router.push('/profile');
  };

  const handleCustomers = () => {
    setProfileMenuOpen(false);
    router.push('/customers');
  };

  const handleWishlistNav = () => {
    setProfileMenuOpen(false);
    router.push('/wishlist');
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    router.push('/');
  };

  function handleProfileImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  
  const [savedIds, setSavedIds] = useState<number[]>([]);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      message: 'Impressed by the professionalism and attention to detail.',
      name: 'Guy Hawkins',
      handle: '@guyhawkins',
      avatar: null,
      chart: [12, 18, 25, 28, 26, 30, 34]
    },
    {
      id: 2,
      message: 'A seamless experience from start to finish. Highly recommend!',
      name: 'Karla Lynn',
      handle: '@karlalynn98',
      avatar: null,
      chart: [8, 12, 20, 22, 20, 26, 30]
    },
    {
      id: 3,
      message: 'Reliable and trustworthy. Made my life so much easier!',
      name: 'Jane Cooper',
      handle: '@janecooper',
      avatar: null,
      chart: [15, 20, 22, 25, 24, 28, 32]
    },
    {
      id: 4,
      message: 'Outstanding service and quick response time.',
      name: 'Robert Fox',
      handle: '@robertfox',
      avatar: null,
      chart: [10, 15, 18, 20, 19, 22, 26]
    },
    {
      id: 5,
      message: 'Exceeded my expectations in every way possible.',
      name: 'Cameron Williamson',
      handle: '@cameronw',
      avatar: null,
      chart: [14, 19, 23, 26, 25, 29, 33]
    },
    {
      id: 6,
      message: 'Professional, efficient, and friendly team.',
      name: 'Leslie Alexander',
      handle: '@lesliea',
      avatar: null,
      chart: [11, 16, 21, 24, 23, 27, 31]
    }
  ];

  const toggleSave = (id: number) => {
    setSavedIds(prev => 
      prev.includes(id) 
        ? prev.filter(savedId => savedId !== id)
        : [...prev, id]
    );
  };

  const handleItemClick = (id: number) => {
    router.push(`/wishlist/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-[100] px-10 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="#667eea">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Wishlist</h3>
        </div>
        <div className="flex items-center gap-5">
          <button className="bg-gray-100 hover:bg-gray-200 border-none rounded-full w-11 h-11 flex items-center justify-center cursor-pointer transition-colors text-gray-700" title="Home" onClick={() => router.push('/home')}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
          <div className="relative">
            <button className="bg-gray-100 hover:bg-gray-200 border-none rounded-full w-11 h-11 flex items-center justify-center cursor-pointer transition-colors text-gray-700 relative">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </button>
          </div>
          <div className="relative" ref={profileRef}>
            <button className="bg-gray-100 hover:bg-gray-200 border-none rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all overflow-hidden" onClick={handleProfileClick}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <svg viewBox="0 0 24 24" width="32" height="32" fill="#4a5568">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              )}
            </button>
            
            {profileMenuOpen && (
              <div className="absolute top-12 right-0 w-[360px] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-gray-800 z-[1000] max-h-[80vh] overflow-y-auto">
                <div className="p-5 flex items-center gap-4 border-b border-gray-200">
                  <div className="w-15 h-15 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <svg viewBox="0 0 24 24" width="40" height="40" fill="#4a5568">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold m-0 text-gray-800">Eych Catipay</h3>
                </div>

                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-100 relative" onClick={handleProfilePage}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="flex-shrink-0">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  <span className="flex-1 text-base font-medium">Profile</span>
                </div>

                <div className="h-px bg-gray-200 my-2"></div>

                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-100 relative" onClick={() => { setProfileMenuOpen(false); router.push('/business-owner-dashboard'); }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="flex-shrink-0">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                  <span className="flex-1 text-base font-medium">Overview</span>
                </div>

                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-100 relative" onClick={handleCustomers}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="flex-shrink-0">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                  <span className="flex-1 text-base font-medium">Customers</span>
                </div>

                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-100 relative" onClick={handleWishlistNav}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="flex-shrink-0">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="flex-1 text-base font-medium">Wishlist</span>
                </div>

                <div className="h-px bg-gray-200 my-2"></div>

                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-100 relative" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="flex-shrink-0">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                  <span className="flex-1 text-base font-medium">Log Out</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto my-9 px-2.5">
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-gray-900 m-0">My Wishlist</h1>
          <p className="text-gray-500 text-sm m-0 mt-2">All your saved items in one place</p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-5.5 items-stretch">
          {testimonials.map((item) => (
            <div key={item.id} className="bg-white rounded-[18px] p-7 min-h-[200px] relative shadow-[0_8px_20px_rgba(15,23,36,0.06)] flex flex-col justify-start border border-gray-100 cursor-pointer hover:shadow-[0_12px_30px_rgba(15,23,36,0.1)] transition-shadow" onClick={() => handleItemClick(item.id)}>
              <div className="flex justify-between items-center mb-4">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_4px_10px_rgba(2,6,23,0.06)]">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="#4a5568">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  )}
                </div>
                <button
                  className={`p-2 rounded-xl border-none font-semibold text-sm cursor-pointer shadow-[0_4px_10px_rgba(2,6,23,0.04)] transition-all ${savedIds.includes(item.id) ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(item.id);
                  }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={savedIds.includes(item.id) ? 'red' : 'currentColor'}>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 flex flex-col">
                <p className="text-gray-900 text-base leading-relaxed my-4.5 mx-3">{item.message}</p>
                <div className="mt-auto">
                  <p className="font-semibold text-gray-900 m-0">{item.name}</p>
                  <p className="text-sm text-gray-500 m-0">{item.handle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <input
        type="file"
        id="profile-upload"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleProfileImageChange}
      />
    </div>
  );
}
