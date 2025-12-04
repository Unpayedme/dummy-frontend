'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Business, Discussion } from '../types';
import Navbar from './Layout/Navbar';

interface BusinessProfileProps {
  businessId?: string;
}

interface ContactInfo {
  phone?: string;
  email?: string;
}

interface Socials {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
}

export default function BusinessProfile({ businessId }: BusinessProfileProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: number]: string }>({});
  const [submittingReply, setSubmittingReply] = useState<{ [key: number]: boolean }>({});
  const [expandedReplies, setExpandedReplies] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (!businessId) {
      setError('Business ID is required');
      setLoading(false);
      return;
    }

    const fetchBusiness = async () => {
      try {
        setLoading(true);
        setError(null);
        const id = parseInt(businessId, 10);
        
        if (isNaN(id)) {
          setError('Invalid business ID');
          setLoading(false);
          return;
        }

        const response = await api.getBusinessById(id);
        
        if (response.success && response.data) {
          setBusiness(response.data as Business);
          
          // Fetch favorite count for all users (including guests)
          try {
            const countResponse = await api.getBusinessFavoriteCount(id);
            if (countResponse.success && countResponse.data) {
              setFavoriteCount(countResponse.data.count || 0);
            }
          } catch (err) {
            console.error('Error fetching favorite count:', err);
          }
          
          // Check if business is favorited (only for authenticated users)
          if (user) {
            try {
              const favoriteResponse = await api.checkFavorite(id);
              if (favoriteResponse.success && favoriteResponse.data) {
                setIsFavorite(favoriteResponse.data.isFavorite || false);
              }
            } catch (err) {
              // Silently fail favorite check
              console.error('Error checking favorite:', err);
            }
          }

          // Fetch discussions for this business
          fetchDiscussions(id);
        } else {
          setError(response.message || 'Business not found');
        }
      } catch (err: any) {
        console.error('Error fetching business:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load business');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [businessId, user]);

  const fetchDiscussions = async (businessId: number) => {
    try {
      setDiscussionsLoading(true);
      const response = await api.getBusinessDiscussions(businessId);
      
      if (response.success && response.data) {
        // Backend now returns discussions with nested replies already organized
        const discussions = Array.isArray(response.data) ? response.data : [];
        setDiscussions(discussions);
      }
    } catch (err) {
      console.error('Error fetching discussions:', err);
      setDiscussions([]);
    } finally {
      setDiscussionsLoading(false);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business || !newDiscussionContent.trim()) return;

    try {
      setSubmittingDiscussion(true);
      const response = await api.createDiscussion(business.id, newDiscussionContent.trim());
      
      if (response.success) {
        setNewDiscussionContent('');
        // Refresh discussions
        await fetchDiscussions(business.id);
      } else {
        alert(response.message || 'Failed to post discussion');
      }
    } catch (err: any) {
      console.error('Error creating discussion:', err);
      alert(err.response?.data?.message || err.message || 'Failed to post discussion');
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  const handleReply = async (discussionId: number) => {
    if (!user || !business || !replyContent[discussionId]?.trim()) return;

    try {
      setSubmittingReply({ ...submittingReply, [discussionId]: true });
      const response = await api.replyToDiscussion(discussionId, replyContent[discussionId].trim(), business.id);
      
      if (response.success) {
        setReplyContent({ ...replyContent, [discussionId]: '' });
        setReplyingTo(null);
        // Refresh discussions
        await fetchDiscussions(business.id);
      } else {
        alert(response.message || 'Failed to post reply');
      }
    } catch (err: any) {
      console.error('Error creating reply:', err);
      alert(err.response?.data?.message || err.message || 'Failed to post reply');
    } finally {
      setSubmittingReply({ ...submittingReply, [discussionId]: false });
    }
  };

  const handleCancelReply = (discussionId: number) => {
    setReplyingTo(null);
    setReplyContent({ ...replyContent, [discussionId]: '' });
  };

  const toggleReplies = (discussionId: number) => {
    setExpandedReplies({
      ...expandedReplies,
      [discussionId]: !expandedReplies[discussionId]
    });
  };

  // Count total replies including nested ones
  const countTotalReplies = (replies: Discussion[] | undefined): number => {
    if (!replies || replies.length === 0) return 0;
    return replies.reduce((count, reply) => {
      return count + 1 + countTotalReplies(reply.replies);
    }, 0);
  };

  // Recursive component to render nested replies
  const renderReply = (reply: Discussion, depth: number = 0, parentIndent: number = 0) => {
    const maxDepth = 5; // Limit nesting depth to prevent UI issues
    // Base indent: 52px (to align with main discussion avatar + gap)
    // Main discussion has: 40px avatar + 12px gap = 52px
    // Each nested level adds: 40px (32px avatar + 12px gap) + 16px (border left padding)
    const baseIndent = 52; // Aligns with main discussion (40px avatar + 12px gap)
    const levelIndent = 40; // Reply avatar width (32px) + gap (12px)
    const borderPadding = 16; // Padding for the left border (pl-4 = 16px)
    
    // Calculate total indent based on depth and parent position
    let totalIndent: number;
    if (depth === 0) {
      // First level replies align with main discussion
      totalIndent = baseIndent;
    } else {
      // Nested replies: parent indent + level indent + border padding
      totalIndent = parentIndent + levelIndent + borderPadding;
    }
    
    return (
      <div key={reply.id} className={depth > 0 ? 'mt-4' : ''}>
        {/* Reply Content */}
        <div 
          className="flex gap-3" 
          style={{ marginLeft: depth === 0 ? `${baseIndent}px` : `${totalIndent}px` }}
        >
          {reply.user.image ? (
            <img 
              src={reply.user.image} 
              alt={reply.user.name} 
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {reply.user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="font-medium text-white text-sm">{reply.user.name}</h5>
              <span className="text-xs text-white/60">{formatDate(reply.createdAt)}</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap mb-2">{reply.content}</p>
            
            {/* Reply Button for nested replies */}
            {user && depth < maxDepth && (
              <button
                onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                className="flex items-center gap-2 text-xs text-white/70 hover:text-[#6ab8d8] transition-colors"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M10 9V5l-7 7 7 7v-4c1.17 0 2.34.17 3.5.5 2.5 1 4.5 3.5 5.5 6.5 1.5-4.5 4-8.5 7-10.5-3-1-6-1-9 0z"/>
                </svg>
                {replyingTo === reply.id ? 'Cancel Reply' : 'Reply'}
              </button>
            )}
          </div>
        </div>

        {/* Reply Form for nested replies */}
        {user && replyingTo === reply.id && depth < maxDepth && (
          <div 
            className="mt-3" 
            style={{ marginLeft: `${totalIndent}px` }}
          >
            <form onSubmit={(e) => { e.preventDefault(); handleReply(reply.id); }} className="flex gap-3">
              {user.image ? (
                <img 
                  src={user.image} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <textarea
                  value={replyContent[reply.id] || ''}
                  onChange={(e) => setReplyContent({ ...replyContent, [reply.id]: e.target.value })}
                  placeholder={`Reply to ${reply.user.name}...`}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#6ab8d8] focus:border-transparent text-white placeholder:text-white/50 text-sm"
                  rows={2}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-white/50">
                    {(replyContent[reply.id] || '').length}/500 characters
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCancelReply(reply.id)}
                      className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!replyContent[reply.id]?.trim() || submittingReply[reply.id]}
                      className="px-3 py-1.5 text-xs bg-gradient-to-br from-[#0f4c75] to-[#1b627d] hover:shadow-[0_4px_15px_rgba(15,76,117,0.4)] text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      {submittingReply[reply.id] ? 'Posting...' : 'Post Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Show/Hide Replies Toggle */}
        {reply.replies && reply.replies.length > 0 && depth < maxDepth && (
          <div 
            className="mt-2" 
            style={{ marginLeft: `${totalIndent}px` }}
          >
            <button
              onClick={() => toggleReplies(reply.id)}
              className="flex items-center gap-2 text-xs text-white/60 hover:text-[#6ab8d8] transition-colors"
            >
              <svg 
                viewBox="0 0 24 24" 
                width="14" 
                height="14" 
                fill="currentColor"
                className={`transition-transform ${expandedReplies[reply.id] ? 'rotate-90' : ''}`}
              >
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
              {expandedReplies[reply.id] 
                ? `Hide ${countTotalReplies(reply.replies)} ${countTotalReplies(reply.replies) === 1 ? 'reply' : 'replies'}`
                : `Show ${countTotalReplies(reply.replies)} ${countTotalReplies(reply.replies) === 1 ? 'reply' : 'replies'}`
              }
            </button>
          </div>
        )}

        {/* Recursively render nested replies */}
        {reply.replies && reply.replies.length > 0 && depth < maxDepth && expandedReplies[reply.id] && (
          <div 
            className="mt-3 pl-4 border-l-2 border-white/10" 
            style={{ marginLeft: `${totalIndent}px` }}
          >
            {reply.replies.map((nestedReply) => renderReply(nestedReply, depth + 1, totalIndent))}
          </div>
        )}
      </div>
    );
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!business || !canEdit) return;
    
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setGalleryUploading(true);
      // Note: This assumes the API accepts gallery updates via updateBusiness
      // You may need to adjust this based on your actual API implementation
      const currentGallery = business.gallery || [];
      // For now, we'll just show a message - actual file upload would require
      // a file upload endpoint or FormData handling
      alert('Gallery upload functionality requires file upload API endpoint. Please use the edit page to update gallery.');
    } catch (err) {
      console.error('Error uploading gallery:', err);
      alert('Failed to upload gallery images');
    } finally {
      setGalleryUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const formatDate = (dateString: string | Date): string => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString.toString();
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !business) return;

    try {
      setFavoriteLoading(true);
      const response = await api.toggleFavorite(business.id);
      
      if (response.success) {
        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);
        
        // Update favorite count
        setFavoriteCount(prev => newFavoriteState ? prev + 1 : prev - 1);
        
        // Refresh count from server to ensure accuracy
        try {
          const countResponse = await api.getBusinessFavoriteCount(business.id);
          if (countResponse.success && countResponse.data) {
            setFavoriteCount(countResponse.data.count || 0);
          }
        } catch (err) {
          console.error('Error refreshing favorite count:', err);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleGetDirections = () => {
    if (!business || !business.lat || !business.lng) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business?.location || '')}`,
        '_blank'
      );
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const destLat = business.lat!;
          const destLng = business.lng!;
          
          window.open(
            `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}`,
            '_blank'
          );
        },
        (error) => {
          console.error('Error getting location:', error);
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`,
            '_blank'
          );
        }
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`,
        '_blank'
      );
    }
  };

  const handleEditDetails = () => {
    if (!business) return;
    router.push(`/businesses/${business.id}/edit`);
  };

  const parseContactInfo = (contactInfo: string | null | undefined): ContactInfo => {
    if (!contactInfo) return {};
    
    try {
      const parsed = typeof contactInfo === 'string' ? JSON.parse(contactInfo) : contactInfo;
      return parsed as ContactInfo;
    } catch {
      // If not JSON, assume it's just a phone number
      return { phone: contactInfo };
    }
  };

  const parseSocials = (socials: any): Socials => {
    if (!socials) return {};
    
    try {
      if (typeof socials === 'string') {
        return JSON.parse(socials) as Socials;
      }
      return socials as Socials;
    } catch {
      return {};
    }
  };

  const formatStoreHours = (openTime?: string | null, closeTime?: string | null): string => {
    if (!openTime || !closeTime) return 'Hours not specified';
    
    try {
      // Try to parse as time strings (e.g., "09:00", "17:00")
      const open = openTime.includes(':') ? openTime : `${openTime.slice(0, 2)}:${openTime.slice(2)}`;
      const close = closeTime.includes(':') ? closeTime : `${closeTime.slice(0, 2)}:${closeTime.slice(2)}`;
      
      // Convert to 12-hour format
      const [openHour, openMin] = open.split(':').map(Number);
      const [closeHour, closeMin] = close.split(':').map(Number);
      
      const openAmPm = openHour >= 12 ? 'PM' : 'AM';
      const closeAmPm = closeHour >= 12 ? 'PM' : 'AM';
      const openHour12 = openHour > 12 ? openHour - 12 : openHour === 0 ? 12 : openHour;
      const closeHour12 = closeHour > 12 ? closeHour - 12 : closeHour === 0 ? 12 : closeHour;
      
      return `${openHour12}:${openMin.toString().padStart(2, '0')} ${openAmPm} - ${closeHour12}:${closeMin.toString().padStart(2, '0')} ${closeAmPm}`;
    } catch {
      return `${openTime} - ${closeTime}`;
    }
  };

  const isOwner = user && business && user.id === business.ownerId;
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = isOwner || isAdmin;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-[#6ab8d8] mx-auto mb-4"></div>
            <p className="text-white/80">Loading business details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-[#1a1a1a]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" className="text-red-500 mx-auto mb-4">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Business Not Found</h2>
            <p className="text-white/80 mb-4">{error || 'The business you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/businesses')}
              className="px-6 py-2.5 bg-gradient-to-br from-[#0f4c75] to-[#1b627d] hover:shadow-[0_4px_15px_rgba(15,76,117,0.4)] text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5"
            >
              Browse Businesses
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contactInfo = parseContactInfo(business.contactInfo);
  const socials = parseSocials(business.socials);
  const storeHours = formatStoreHours(business.openTime, business.closeTime);

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navbar />
      
      {/* Banner Image */}
      <div className="relative h-[300px] sm:h-[400px] overflow-hidden">
        {business.coverPhoto ? (
          <img 
            src={business.coverPhoto} 
            alt={business.name} 
            className="absolute top-0 left-0 w-full h-full object-cover" 
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1e3c72] to-[#2a5298]"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20">
          {/* Main Info - Bottom Left */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 pt-4 sm:pt-6 md:pt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-3 sm:gap-4 flex-1">
              {/* Business Logo */}
              <div className="flex-shrink-0">
                {(business as any).logo || (business.gallery && business.gallery.length > 0) ? (
                  <img
                    src={(business as any).logo || business.gallery[0]}
                    alt={`${business.name} logo`}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl object-cover border-2 border-white/90 shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-[#1e3c72] to-[#2a5298] flex items-center justify-center border-2 border-white/90 shadow-lg"
                  style={{ display: (business as any).logo || (business.gallery && business.gallery.length > 0) ? 'none' : 'flex' }}
                >
                  <span className="text-white font-bold text-xl sm:text-2xl md:text-3xl">
                    {business.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* Business Name and Info */}
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2 break-words drop-shadow-lg">{business.name}</h1>
                <p className="text-base sm:text-lg text-white/90 mb-2 sm:mb-3 drop-shadow-md">{business.category} • {business.barangay}</p>
                
                {/* Badges */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {business.isVerified && (
                    <span className="px-2 sm:px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1 border border-white/30">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Verified
                    </span>
                  )}
                  <span className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs sm:text-sm font-semibold border border-white/30">
                    {business.category}
                  </span>
                  <span className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs sm:text-sm font-semibold border border-white/30">
                    {business.barangay}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Favorite Section - Bottom Right */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {user ? (
                /* Favorite Button with Count - For authenticated users */
                <button
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm border border-white/30 ${
                    isFavorite
                      ? 'bg-red-500/90 text-white hover:bg-red-600/90'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    width="20" 
                    height="20" 
                    fill={isFavorite ? 'currentColor' : 'none'} 
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="hidden sm:inline">Favorite</span>
                  <span className="text-white/90 font-semibold text-sm sm:text-base">
                    ({favoriteCount})
                  </span>
                </button>
              ) : (
                /* Favorite Count and Sign-in - For guests */
                <>
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg backdrop-blur-sm bg-white/20 border border-white/30">
                    <svg 
                      viewBox="0 0 24 24" 
                      width="20" 
                      height="20" 
                      fill="currentColor"
                      className="text-white"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {favoriteCount} {favoriteCount === 1 ? 'favorite' : 'favorites'}
                    </span>
                  </div>
                  <a
                    href="/login"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm border border-white/30 bg-white/20 text-white hover:bg-white/30"
                    title="Sign in to favorite this business"
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      width="20" 
                      height="20" 
                      fill="none" 
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span className="hidden sm:inline">Sign in to Favorite</span>
                    <span className="sm:hidden">Sign in</span>
                  </a>
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
        {/* Edit Details Button - Accessible Location */}
        {canEdit && (
          <div className="mb-6 flex justify-end">
            <button 
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#0f4c75] to-[#1b627d] hover:shadow-[0_4px_15px_rgba(15,76,117,0.4)] text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base" 
              onClick={handleEditDetails}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              <span>Edit Details</span>
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1 w-full">
          {/* About Section */}
          <div className="bg-[#2a2a2a] rounded-[20px] p-4 sm:p-6 mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">About {business.name}</h2>
              {canEdit && (
                <button 
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-[#6ab8d8] hover:text-[#8bc5d9] cursor-pointer transition-colors self-start sm:self-auto" 
                  onClick={handleEditDetails}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  Edit Details
                </button>
              )}
            </div>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">{business.description}</p>
          </div>

          {/* Gallery */}
          <div className="bg-[#2a2a2a] rounded-[20px] p-4 sm:p-6 mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/5" id="gallery-section">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Gallery</h2>
              {canEdit && (
                <label className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-br from-[#0f4c75] to-[#1b627d] hover:shadow-[0_4px_15px_rgba(15,76,117,0.4)] text-white rounded-lg font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base w-full sm:w-auto justify-center">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  {galleryUploading ? 'Uploading...' : 'Add Photos'}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    disabled={galleryUploading}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            {business.gallery && business.gallery.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {business.gallery.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden relative group">
                    <img 
                      src={photo} 
                      alt={`${business.name} gallery ${index + 1}`} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" 
                      onClick={() => window.open(photo, '_blank')}
                    />
                    {canEdit && (
                      <button
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle delete photo - would need API endpoint
                          if (confirm('Delete this photo?')) {
                            // TODO: Implement delete photo API call
                            console.log('Delete photo:', photo);
                          }
                        }}
                        title="Delete photo"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                  {canEdit && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#6ab8d8] transition-colors">
                      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" className="text-white/60">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                      <p className="text-white/60 mt-2 text-sm">Add Photo</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleGalleryUpload}
                        disabled={galleryUploading}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" className="text-white/40 mx-auto mb-4">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <p className="text-white/60 mb-4">No photos in gallery yet</p>
                {canEdit && (
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#0f4c75] to-[#1b627d] hover:shadow-[0_4px_15px_rgba(15,76,117,0.4)] text-white rounded-lg font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add First Photo
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleGalleryUpload}
                      disabled={galleryUploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Owner Info */}
          {business.owner && (
            <div className="bg-[#2a2a2a] rounded-[20px] p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/5">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Business Owner</h3>
              <div className="flex items-center gap-3">
                {business.owner.image ? (
                  <img 
                    src={business.owner.image} 
                    alt={business.owner.name} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {business.owner.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold text-white m-0">{business.owner.name}</p>
                  <p className="text-sm text-white/60 m-0">Owner</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[380px] flex-shrink-0 space-y-4 sm:space-y-6">
          {/* Contact Information */}
          <div className="bg-[#2a2a2a] rounded-[20px] p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/5">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Contact Information</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex gap-3">
                <div className="w-5 h-5 flex-shrink-0 text-white/60 mt-0.5">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/60 mb-1">Address</p>
                  <p className="text-sm text-white m-0 break-words">{business.location}</p>
                </div>
              </div>

              {contactInfo.phone && (
                <div className="flex gap-3">
                  <div className="w-5 h-5 flex-shrink-0 text-white/60 mt-0.5">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white/60 mb-1">Phone</p>
                    <a href={`tel:${contactInfo.phone}`} className="text-sm text-white m-0 hover:text-[#6ab8d8] transition-colors break-words">
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo.email && (
                <div className="flex gap-3 col-span-2">
                  <div className="w-5 h-5 flex-shrink-0 text-white/60 mt-0.5">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white/60 mb-1">Email</p>
                    <a href={`mailto:${contactInfo.email}`} className="text-sm text-white m-0 hover:text-[#6ab8d8] transition-colors break-words">
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {(socials.instagram || socials.facebook || socials.twitter || socials.website) && (
              <div className="pt-6 border-t border-white/10">
                <p className="text-sm font-medium text-white/60 mb-3">Follow Us</p>
                <div className="flex gap-3">
                  {socials.instagram && (
                    <a 
                      href={socials.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors text-white/80 hover:text-white"
                      title="Instagram"
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.6C2 4.6 4.6 2 7.6 2m-.2 2C5.6 4 4 5.6 4 7.6v8.8C4 18.4 5.6 20 7.6 20h8.8c2 0 3.6-1.6 3.6-3.6V7.6C20 5.6 18.4 4 16.4 4H7.6m9.65 1.5c.7 0 1.25.55 1.25 1.25S17.95 8 17.25 8s-1.25-.55-1.25-1.25.55-1.25 1.25-1.25M12 7c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5m0 2c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
                      </svg>
                    </a>
                  )}
                  {socials.facebook && (
                    <a 
                      href={socials.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors text-white/80 hover:text-white"
                      title="Facebook"
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M17 2H7C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5zm-5 15.5c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm7-11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                      </svg>
                    </a>
                  )}
                  {socials.twitter && (
                    <a 
                      href={socials.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors text-white/80 hover:text-white"
                      title="Twitter"
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M22.46 6c-.85.38-1.78.64-2.75.76 1-.6 1.76-1.55 2.12-2.68-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.52-1.53-2.66 0-4.82 2.16-4.82 4.82 0 .38.04.75.13 1.1-4-.2-7.55-2.12-9.92-5.04-.42.72-.66 1.55-.66 2.44 0 1.67.85 3.15 2.14 4.01-.79-.02-1.53-.24-2.18-.6v.06c0 2.34 1.66 4.29 3.87 4.73-.4.11-.83.17-1.27.17-.31 0-.62-.03-.92-.08.62 1.94 2.43 3.35 4.57 3.39-1.67 1.31-3.78 2.09-6.07 2.09-.39 0-.78-.02-1.17-.07 2.18 1.4 4.77 2.21 7.55 2.21 9.06 0 14.01-7.5 14.01-14.01 0-.21 0-.42-.02-.63.96-.69 1.8-1.56 2.46-2.55z"/>
                      </svg>
                    </a>
                  )}
                  {socials.website && (
                    <a 
                      href={socials.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors text-white/80 hover:text-white"
                      title="Website"
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Store Hours */}
          {business.openTime && business.closeTime && (
            <div className="bg-[#2a2a2a] rounded-[20px] p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 text-white/60">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white m-0">Store Hours</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-base font-medium text-white">Open Hours</span>
                  <span className="text-base text-white/80">{storeHours}</span>
                </div>
              </div>
            </div>
          )}

          {/* Location & Directions */}
          <div className="bg-[#2a2a2a] rounded-[20px] p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 text-white/60">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white m-0">Location</h3>
            </div>
            <div className="mb-4">
              <iframe
                src={
                  business.lat && business.lng
                    ? `https://www.google.com/maps?q=${business.lat},${business.lng}&hl=en&z=14&output=embed`
                    : `https://www.google.com/maps?q=${encodeURIComponent(business.location + ', ' + business.barangay + ', Philippines')}&hl=en&z=14&output=embed`
                }
                width="100%"
                height="200"
                className="sm:h-[250px]"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${business.name} Location`}
              ></iframe>
            </div>
            <button 
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-[#0f4c75] to-[#1b627d] hover:shadow-[0_4px_15px_rgba(15,76,117,0.4)] text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5" 
              onClick={handleGetDirections}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/>
              </svg>
              Get Directions
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Discussions Section - Separate container at bottom */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 md:pb-10">
        <div className="bg-[#2a2a2a] rounded-[20px] p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/5">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Discussions</h2>
          
          {/* Create Discussion Form */}
          {user ? (
            <form onSubmit={handleCreateDiscussion} className="mb-8">
              <div className="flex gap-3 mb-3">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    value={newDiscussionContent}
                    onChange={(e) => setNewDiscussionContent(e.target.value)}
                    placeholder="Share your thoughts about this business..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#6ab8d8] focus:border-transparent text-white placeholder:text-white/50"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-white/60">
                      {newDiscussionContent.length}/1000 characters
                    </span>
                    <button
                      type="submit"
                      disabled={!newDiscussionContent.trim() || submittingDiscussion}
                      className="px-4 py-2 bg-gradient-to-br from-[#0f4c75] to-[#1b627d] hover:shadow-[0_4px_15px_rgba(15,76,117,0.4)] text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      {submittingDiscussion ? 'Posting...' : 'Post Discussion'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/80 text-sm">
                <a href="/login" className="text-[#6ab8d8] hover:text-[#8bc5d9] hover:underline font-medium transition-colors">Sign in</a> to join the discussion
              </p>
            </div>
          )}

          {/* Discussions List */}
          {discussionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3c72]"></div>
            </div>
          ) : discussions.length > 0 ? (
            <div className="space-y-6">
              {discussions.map((discussion) => (
                <div key={discussion.id} className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                  {/* Main Discussion */}
                  <div className="flex gap-3 mb-4">
                    {discussion.user.image ? (
                      <img 
                        src={discussion.user.image} 
                        alt={discussion.user.name} 
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {discussion.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{discussion.user.name}</h4>
                        <span className="text-sm text-white/60">{formatDate(discussion.createdAt)}</span>
                      </div>
                      <p className="text-white/80 leading-relaxed whitespace-pre-wrap mb-3">{discussion.content}</p>
                      
                      {/* Reply Button */}
                      {user && (
                        <button
                          onClick={() => setReplyingTo(replyingTo === discussion.id ? null : discussion.id)}
                          className="flex items-center gap-2 text-sm text-white/70 hover:text-[#6ab8d8] transition-colors"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M10 9V5l-7 7 7 7v-4c1.17 0 2.34.17 3.5.5 2.5 1 4.5 3.5 5.5 6.5 1.5-4.5 4-8.5 7-10.5-3-1-6-1-9 0z"/>
                          </svg>
                          {replyingTo === discussion.id ? 'Cancel Reply' : 'Reply'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reply Form */}
                  {user && replyingTo === discussion.id && (
                    <div className="ml-0 sm:ml-[52px] mb-4">
                      <form onSubmit={(e) => { e.preventDefault(); handleReply(discussion.id); }} className="flex gap-3">
                        {user.image ? (
                          <img 
                            src={user.image} 
                            alt={user.name} 
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <textarea
                            value={replyContent[discussion.id] || ''}
                            onChange={(e) => setReplyContent({ ...replyContent, [discussion.id]: e.target.value })}
                            placeholder={`Reply to ${discussion.user.name}...`}
                            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#6ab8d8] focus:border-transparent text-white placeholder:text-white/50 text-sm"
                            rows={2}
                            maxLength={500}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-white/50">
                              {(replyContent[discussion.id] || '').length}/500 characters
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleCancelReply(discussion.id)}
                                className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!replyContent[discussion.id]?.trim() || submittingReply[discussion.id]}
                                className="px-3 py-1.5 text-sm bg-gradient-to-br from-[#0f4c75] to-[#1b627d] hover:shadow-[0_4px_15px_rgba(15,76,117,0.4)] text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                              >
                                {submittingReply[discussion.id] ? 'Posting...' : 'Post Reply'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Show/Hide Replies Toggle for Main Discussion */}
                  {discussion.replies && discussion.replies.length > 0 && (
                    <div className="mt-3 ml-0 sm:ml-[52px]">
                      <button
                        onClick={() => toggleReplies(discussion.id)}
                        className="flex items-center gap-2 text-sm text-white/70 hover:text-[#6ab8d8] transition-colors"
                      >
                        <svg 
                          viewBox="0 0 24 24" 
                          width="16" 
                          height="16" 
                          fill="currentColor"
                          className={`transition-transform ${expandedReplies[discussion.id] !== false ? 'rotate-90' : ''}`}
                        >
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                        {expandedReplies[discussion.id] === false
                          ? `Show ${countTotalReplies(discussion.replies)} ${countTotalReplies(discussion.replies) === 1 ? 'reply' : 'replies'}`
                          : `Hide ${countTotalReplies(discussion.replies)} ${countTotalReplies(discussion.replies) === 1 ? 'reply' : 'replies'}`
                        }
                      </button>
                    </div>
                  )}

                  {/* Replies - Rendered recursively */}
                  {discussion.replies && discussion.replies.length > 0 && expandedReplies[discussion.id] !== false && (
                    <div className="mt-4">
                      {discussion.replies.map((reply) => renderReply(reply, 0, 0))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" className="text-white/40 mx-auto mb-4">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <p className="text-white/60">No discussions yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
