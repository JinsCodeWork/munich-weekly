'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { getPromotionConfigForAdmin } from '@/api/promotion';
import { PromotionConfig } from '@/types/promotion';

/**
 * Test component to verify promotion configuration behavior
 * Especially for edge cases when no config exists
 */
export default function PromotionTestDebug() {
  const [config, setConfig] = useState<PromotionConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testConfigLoad = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing promotion config load...');
      const configData = await getPromotionConfigForAdmin();
      console.log('Config response:', configData);
      
      setConfig(configData);
      
      const hasValidId = configData && configData.id && configData.id > 0;
      
      setResult(`
Config loaded successfully:
- ID: ${configData?.id || 'null/undefined'}
- Is Enabled: ${configData?.isEnabled}
- Nav Title: &quot;${configData?.navTitle || ''}&quot;
- Page URL: &quot;${configData?.pageUrl || ''}&quot;
- Has Valid ID: ${hasValidId}
- Can Use Image Manager: ${hasValidId ? 'YES' : 'NO - Need to save config first'}
      `);
    } catch (error) {
      console.error('Config load failed:', error);
      setResult(`Config load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testImageAPIWithInvalidId = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // Test what happens when we call image API with null/undefined configId
      const response = await fetch('/api/promotion/admin/images?configId=null', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
          'Content-Type': 'application/json',
        }
      });
      
      const responseText = await response.text();
      
      setResult(`
Image API test with invalid configId:
- Status: ${response.status}
- Response: ${responseText}
- Expected: 400 Bad Request (which is correct behavior)
      `);
    } catch (error) {
      setResult(`Image API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <h1 className="text-2xl font-bold mb-4">Promotion Configuration Test</h1>
      <p className="text-gray-600 mb-6">
        This page tests the promotion configuration behavior and edge cases.
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={testConfigLoad}
            disabled={loading}
            variant="primary"
          >
            {loading ? 'Testing...' : 'Test Config Load'}
          </Button>
          
          <Button
            onClick={testImageAPIWithInvalidId}
            disabled={loading}
            variant="secondary"
          >
            {loading ? 'Testing...' : 'Test Image API (Invalid ID)'}
          </Button>
        </div>
        
        {config && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Current Config State:</h3>
            <div className="text-sm text-blue-800">
              <p><strong>Has Valid ID for Image Manager:</strong> {config.id && config.id > 0 ? '✅ YES' : '❌ NO'}</p>
              <p><strong>ID:</strong> {config.id || 'null/undefined'}</p>
              <p><strong>Title:</strong> &quot;{config.navTitle || ''}&quot;</p>
              <p><strong>URL:</strong> &quot;{config.pageUrl || ''}&quot;</p>
            </div>
          </div>
        )}
        
        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </div>
    </Container>
  );
} 