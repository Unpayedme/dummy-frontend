'use client';

import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Customer {
  id: number;
  name: string;
  email: string;
  status: string;
  visits: number;
  lastVisit: string;
  totalSpent: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const customersData: Customer[] = [
    { id: 1, name: 'Lou Yi', email: 'lou.yi@gmail.com', status: 'VIP', visits: 45, lastVisit: '2 hours ago', totalSpent: '$2,450' },
    { id: 2, name: 'Badang', email: 'badang.list@gmail.com', status: 'VIP', visits: 38, lastVisit: '1 day ago', totalSpent: '$1,890' },
    { id: 3, name: 'Wanwan', email: 'wan.wan@gmail.com', status: 'Returning', visits: 12, lastVisit: '3 days ago', totalSpent: '$650' },
    { id: 4, name: 'Sarah Johnson', email: 'sarah.j@gmail.com', status: 'Regular', visits: 8, lastVisit: '5 days ago', totalSpent: '$420' },
    { id: 5, name: 'Michael Chen', email: 'michael.chen@gmail.com', status: 'Regular', visits: 6, lastVisit: '1 week ago', totalSpent: '$380' },
    { id: 6, name: 'Emma Wilson', email: 'emma.w@gmail.com', status: 'VIP', visits: 52, lastVisit: '1 hour ago', totalSpent: '$3,200' },
    { id: 7, name: 'David Lee', email: 'david.lee@gmail.com', status: 'Returning', visits: 15, lastVisit: '2 days ago', totalSpent: '$890' },
    { id: 8, name: 'Sofia Martinez', email: 'sofia.m@gmail.com', status: 'Regular', visits: 5, lastVisit: '4 days ago', totalSpent: '$250' },
  ];

  const totalCustomers = '163.2K';
  const itemsPerPage = 3;
  const totalPages = Math.ceil(customersData.length / itemsPerPage);

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (showProfileMenu && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [showProfileMenu]);

  const handleProfilePage = () => {
    router.push('/profile');
    setShowProfileMenu(false);
  };

  const handleOverview = () => {
    router.push('/business-owner-dashboard');
    setShowProfileMenu(false);
  };

  const handleCustomers = () => {
    setShowProfileMenu(false);
  };

  const handleWishlist = () => {
    router.push('/wishlist');
    setShowProfileMenu(false);
  };

  const handleSettings = () => {
    console.log('Navigate to settings');
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    console.log('Logging out');
    router.push('/login');
    setShowProfileMenu(false);
  };

  const getCurrentPageCustomers = (): Customer[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return customersData.slice(startIndex, endIndex);
  };

  const handleProfileImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredCustomers = customersData.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getFilteredCurrentPageCustomers = (): Customer[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  };

  const filteredTotalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white px-10 py-4 flex justify-between items-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="#667eea">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">Customers</h3>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-gray-100 hover:bg-gray-200 border-none rounded-full w-11 h-11 flex items-center justify-center cursor-pointer transition-colors text-gray-700" title="Home">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
          <div className="relative">
            <button className="bg-gray-100 hover:bg-gray-200 border-none rounded-full w-11 h-11 flex items-center justify-center cursor-pointer transition-colors text-gray-700 relative">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-[10px] min-w-[20px] text-center">3</span>
            </button>
          </div>
          <div className="relative" ref={profileRef}>
            <button className="bg-gray-100 hover:bg-gray-200 border-none rounded-full w-11 h-11 flex items-center justify-center cursor-pointer transition-colors overflow-hidden" onClick={handleProfileClick}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <svg viewBox="0 0 24 24" width="32" height="32" fill="#4a5568">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              )}
            </button>
            
            {showProfileMenu && (
              <div className="absolute top-14 right-0 w-[360px] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] text-gray-800 z-[1000] max-h-[80vh] overflow-y-auto">
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

                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-100 text-gray-800 relative" onClick={handleProfilePage}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="flex-shrink-0">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  <span className="flex-1 text-base font-medium">Profile</span>
                </div>

                <div className="h-px bg-gray-200 my-2"></div>

                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-100 text-gray-800 relative" onClick={handleOverview}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="flex-shrink-0">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                  <span className="flex-1 text-base font-medium">Overview</span>
                </div>

                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-100 bg-blue-50 text-gray-800 relative" onClick={handleCustomers}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="flex-shrink-0">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                  <span className="flex-1 text-base font-medium">Customers</span>
                </div>

                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-100 text-gray-800 relative" onClick={handleWishlist}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="flex-shrink-0">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="flex-1 text-base font-medium">Wishlist</span>
                </div>

                <div className="h-px bg-gray-200 my-2"></div>

                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-100 text-gray-800 relative" onClick={handleLogout}>
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

      <div className="max-w-[1200px] mx-auto p-10 flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 m-0 mb-2">Customers</h1>
          <p className="text-gray-600 m-0">Total Customers: {totalCustomers}</p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus-within:border-[#1e3c72] transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-gray-500">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 border-none outline-none text-base text-gray-800 bg-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-base text-gray-800 cursor-pointer focus:outline-none focus:border-[#1e3c72] transition-colors"
          >
            <option value="all">All Status</option>
            <option value="VIP">VIP</option>
            <option value="Returning">Returning</option>
            <option value="Regular">Regular</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
            <div>Name</div>
            <div>Email</div>
            <div>Status</div>
            <div>Visits</div>
            <div>Last Visit</div>
            <div>Total Spent</div>
          </div>
          {getFilteredCurrentPageCustomers().map((customer) => (
            <div key={customer.id} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="text-gray-800">{customer.name}</div>
              <div className="text-gray-800">{customer.email}</div>
              <div>
                <span className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
                  customer.status === 'VIP' ? 'bg-purple-100 text-purple-800' :
                  customer.status === 'Returning' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {customer.status}
                </span>
              </div>
              <div className="text-gray-800">{customer.visits}</div>
              <div className="text-gray-800">{customer.lastVisit}</div>
              <div className="text-gray-800">{customer.totalSpent}</div>
            </div>
          ))}
        </div>

        {filteredTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-800 rounded-md text-sm font-medium cursor-pointer transition-all hover:not-disabled:bg-gray-50 hover:not-disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600 text-sm">Page {currentPage} of {filteredTotalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(filteredTotalPages, prev + 1))}
              disabled={currentPage === filteredTotalPages}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-800 rounded-md text-sm font-medium cursor-pointer transition-all hover:not-disabled:bg-gray-50 hover:not-disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
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
