'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';
import type { Business, Discussion } from '../../src/types';

interface Stat {
  id: number;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
}

interface StatusItem {
  id: number;
  label: string;
  status: string;
  statusColor: string;
  icon: React.ReactNode;
}

export default function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentDiscussions, setRecentDiscussions] = useState<Discussion[]>([]);
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Get user's name from auth context, fallback to 'User' if not available
  const userName = user?.name || 'User';

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Load user's businesses
        const businessesResponse = await api.getMyBusinesses();
        const userBusinesses = businessesResponse.data?.businesses || [];
        setBusinesses(userBusinesses);

        // Calculate statistics
        let totalFavorites = 0;
        let totalDiscussions = 0;
        let verifiedCount = 0;
        let pendingCount = 0;

        // Fetch favorite counts and discussions for each business
        const businessStatsPromises = userBusinesses.map(async (business: Business) => {
          try {
            const [favoriteResponse, discussionsResponse] = await Promise.all([
              api.getBusinessFavoriteCount(business.id),
              api.getBusinessDiscussions(business.id)
            ]);
            
            const favoriteCount = favoriteResponse.data?.count || 0;
            const discussions = discussionsResponse.data || [];
            
            totalFavorites += favoriteCount;
            totalDiscussions += Array.isArray(discussions) ? discussions.length : 0;
            
            if (business.isVerified) {
              verifiedCount++;
            } else {
              pendingCount++;
            }
          } catch (error) {
            console.error(`Error loading stats for business ${business.id}:`, error);
          }
        });

        await Promise.all(businessStatsPromises);

        // Get recent discussions across all businesses
        const allDiscussions: Discussion[] = [];
        for (const business of userBusinesses) {
          try {
            const discussionsResponse = await api.getBusinessDiscussions(business.id);
            const discussions = discussionsResponse.data || [];
            if (Array.isArray(discussions)) {
              discussions.forEach((disc: Discussion) => {
                allDiscussions.push({ ...disc, business });
              });
            }
          } catch (error) {
            console.error(`Error loading discussions for business ${business.id}:`, error);
          }
        }
        
        // Sort by date and get most recent 5
        const sortedDiscussions = allDiscussions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5);
        setRecentDiscussions(sortedDiscussions);

        // Update stats
        setStats([
          {
            id: 1,
            title: 'My Businesses',
            value: userBusinesses.length,
            icon: (
              <svg viewBox="0 0 24 24" width="40" height="40" fill="#4a5568">
                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
              </svg>
            )
          },
          {
            id: 2,
            title: 'Total Favorites',
            value: totalFavorites,
            icon: (
              <svg viewBox="0 0 24 24" width="40" height="40" fill="#4a5568">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            )
          },
          {
            id: 3,
            title: 'Total Discussions',
            value: totalDiscussions,
            icon: (
              <svg viewBox="0 0 24 24" width="40" height="40" fill="#4a5568">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            )
          }
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const handleViewBusiness = (businessId: number) => {
    router.push(`/business/${businessId}`);
  };

  const handleEditBusiness = (businessId: number) => {
    router.push(`/businesses/${businessId}/edit`);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleHome = () => {
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="flex justify-between items-center px-14 py-3 bg-white border-b border-gray-200 sticky top-0 z-[100]">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 flex items-center justify-center rounded-[10px] bg-blue-50">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="#667eea">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#123e8a] m-0 ml-3">Business Owner Dashboard</h3>
        </div>
        <div className="flex items-center gap-5.5">
          <button className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center transition-colors text-gray-700 hover:bg-gray-100" onClick={handleHome} title="Home">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
          <button 
            className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center transition-colors text-gray-700 hover:bg-gray-100" 
            onClick={handleLogout} 
            title="Logout"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
      </nav>

      <div className="p-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 m-0 mb-2">Welcome Back, {userName}</h1>
          <p className="text-gray-600 text-lg m-0">Manage your business, track performance, and connect with customers</p>
        </div>

        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] relative animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))
            ) : (
              stats.map((s) => (
                <div key={s.id} className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow">
                  <div className="text-sm font-medium text-gray-600 mb-2">{s.title}</div>
                  <div className="absolute top-6 right-6 text-gray-400">{s.icon}</div>
                  <div className="text-3xl font-bold text-gray-900 mt-4">{s.value}</div>
                </div>
              ))
            )}
          </div>

          {/* My Businesses Section */}
          <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex justify-between items-center mb-6">
              <div className="text-xl font-bold text-gray-900">My Businesses</div>
              <button
                onClick={() => router.push('/businesses/new')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add Business
              </button>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading businesses...</p>
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-12">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" className="text-gray-400 mx-auto mb-4">
                  <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                </svg>
                <p className="text-gray-500 mb-4">You don't have any businesses yet</p>
                <button
                  onClick={() => router.push('/businesses/new')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Your First Business
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {businesses.map((business) => (
                  <div key={business.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
                          {business.isVerified && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                              Verified
                            </span>
                          )}
                          {!business.isVerified && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                              Pending Verification
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{business.category} • {business.barangay}</p>
                        <p className="text-sm text-gray-500 line-clamp-2">{business.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewBusiness(business.id)}
                          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditBusiness(business.id)}
                          className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Discussions Section */}
          {recentDiscussions.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <div className="text-xl font-bold text-gray-900 mb-6">Recent Discussions</div>
              <div className="space-y-4">
                {recentDiscussions.map((discussion) => (
                  <div key={discussion.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{discussion.user.name}</span>
                        <span className="text-sm text-gray-500">on</span>
                        <span className="font-medium text-blue-600">{discussion.business?.name || 'Business'}</span>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(discussion.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-2">{discussion.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
