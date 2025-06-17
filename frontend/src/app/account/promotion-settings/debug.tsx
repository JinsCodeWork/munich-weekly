'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function PromotionDebug() {
  const { user, token, isAuthenticated, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Debug authentication state
  const debugAuth = () => {
    console.log('=== Authentication Debug ===');
    console.log('User:', user);
    console.log('Token exists:', !!token);
    console.log('Is authenticated:', isAuthenticated());
    console.log('Has admin role:', hasRole('admin'));
    
    const tokenFromStorage = localStorage.getItem('jwt');
    console.log('Token from localStorage:', tokenFromStorage ? 'Present' : 'Missing');
    
    if (tokenFromStorage) {
      try {
        const base64Url = tokenFromStorage.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        console.log('Token payload:', payload);
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Token is expired:', Date.now() >= (payload.exp * 1000 - 30000));
      } catch (e) {
        console.error('Token parsing failed:', e);
      }
    }
    
    setResult(`
Authentication State:
- User: ${user ? `${user.nickname} (${user.role})` : 'Not logged in'}
- Token: ${token ? 'Present' : 'Missing'}
- Is Authenticated: ${isAuthenticated()}
- Has Admin Role: ${hasRole('admin')}
- LocalStorage Token: ${tokenFromStorage ? 'Present' : 'Missing'}
    `);
  };

  const testAPI = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const token = localStorage.getItem('jwt');
      console.log('JWT Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('/api/promotion/admin/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
      if (response.ok) {
        setResult(`Success: ${responseText}`);
      } else {
        setResult(`Error ${response.status}: ${responseText}`);
      }
    } catch (error) {
      console.error('Request failed:', error);
      setResult(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testPublicAPI = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await fetch('/api/promotion/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Public API Response status:', response.status);
      const responseText = await response.text();
      console.log('Public API Response body:', responseText);
      
      if (response.ok) {
        setResult(`Public API Success: ${responseText}`);
      } else {
        setResult(`Public API Error ${response.status}: ${responseText}`);
      }
    } catch (error) {
      console.error('Public API Request failed:', error);
      setResult(`Public API Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <h1 className="text-2xl font-bold mb-4">Promotion API Debug</h1>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={debugAuth}
            variant="outline"
          >
            Debug Auth State
          </Button>
          
          <Button
            onClick={testPublicAPI}
            disabled={loading}
            variant="secondary"
          >
            {loading ? 'Testing...' : 'Test Public API'}
          </Button>
          
          <Button
            onClick={testAPI}
            disabled={loading}
            variant="primary"
          >
            {loading ? 'Testing...' : 'Test Admin API'}
          </Button>
        </div>
        
        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </div>
    </Container>
  );
} 