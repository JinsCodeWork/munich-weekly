/**
 * Promotion Admin Debug Helper
 * Provides debugging utilities for promotion authentication issues
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface PromotionDebugHelperProps {
  // 可以在将来添加回调函数用于处理认证问题
}

export const PromotionDebugHelper: React.FC<PromotionDebugHelperProps> = () => {
  const { user, token, isAuthenticated, hasRole, logout } = useAuth();

  const handleAuthRefresh = () => {
    // Force token refresh by clearing and redirecting to login
    logout();
    window.location.href = '/login?redirect=/account/promotion-settings';
  };

  const handleTokenDebug = () => {
    const storedToken = localStorage.getItem('jwt');
    console.log('=== JWT Token Debug ===');
    console.log('Token from context:', !!token);
    console.log('Token from localStorage:', !!storedToken);
    
    if (storedToken) {
      try {
        const base64Url = storedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        
        console.log('User ID from token:', payload.sub);
        console.log('Token issued at:', new Date(payload.iat * 1000));
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Time until expiry:', Math.floor((payload.exp * 1000 - Date.now()) / 60000), 'minutes');
        console.log('Is expired:', Date.now() >= (payload.exp * 1000 - 30000));
        
        alert(`Token Debug Info:
User ID: ${payload.sub}
Expires: ${new Date(payload.exp * 1000).toLocaleString()}
Minutes left: ${Math.floor((payload.exp * 1000 - Date.now()) / 60000)}
Is expired: ${Date.now() >= (payload.exp * 1000 - 30000)}`);
      } catch (e) {
        console.error('Token parsing failed:', e);
        alert('Token parsing failed - token may be corrupted');
      }
    } else {
      alert('No JWT token found in localStorage');
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-yellow-900">Authentication Required</h3>
            <p className="text-yellow-700">Please log in to access promotion settings.</p>
          </div>
          <Button onClick={() => window.location.href = '/login?redirect=/account/promotion-settings'}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (!hasRole('admin')) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-900">Admin Access Required</h3>
            <p className="text-red-700">
              You are logged in as <strong>{user?.nickname}</strong> with role <strong>{user?.role}</strong>, 
              but admin privileges are required for promotion settings.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTokenDebug}>
              Debug Token
            </Button>
            <Button onClick={handleAuthRefresh}>
              Re-login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-green-900">✅ Authentication OK</h3>
          <p className="text-green-700">
            Logged in as <strong>{user?.nickname}</strong> with <strong>admin</strong> privileges.
          </p>
        </div>
        <Button variant="outline" onClick={handleTokenDebug}>
          Debug Token
        </Button>
      </div>
    </div>
  );
}; 