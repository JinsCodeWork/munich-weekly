/**
 * Promotion configuration hook
 * Manages the state of promotion configuration for navigation display
 */

import { useState, useEffect } from 'react';
import { PromotionConfig } from '@/types/promotion';
import { getEnabledPromotionConfig } from '@/api/promotion';

export const usePromotionConfig = () => {
  const [promotionConfig, setPromotionConfig] = useState<PromotionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotionConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const config = await getEnabledPromotionConfig();
        setPromotionConfig(config);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load promotion configuration');
        setPromotionConfig(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotionConfig();
  }, []);

  return {
    promotionConfig,
    loading,
    error,
    refreshConfig: () => {
      const fetchPromotionConfig = async () => {
        try {
          setLoading(true);
          setError(null);
          const config = await getEnabledPromotionConfig();
          setPromotionConfig(config);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load promotion configuration');
          setPromotionConfig(null);
        } finally {
          setLoading(false);
        }
      };
      fetchPromotionConfig();
    }
  };
}; 