import React from 'react';
import { Thumbnail } from '@/components/ui/Thumbnail';

export default function MainHeader() {
    return (
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'white',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: '200px 1fr 100px',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Logo 和标题区域 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', marginRight: '8px' }}>
              <Thumbnail 
                src="/logo.svg" 
                alt="Munich Weekly Logo" 
                width={32}
                height={32}
                objectFit="contain"
              />
            </div>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              letterSpacing: '0.025em'
            }}>Munich Weekly</div>
          </div>
          
          {/* 导航菜单 */}
          <div style={{ 
            display: 'flex',
            paddingLeft: '0'
          }}>
            <a href="#" style={{ 
              marginRight: '24px',
              fontSize: '0.875rem',
              color: '#4B5563'
            }}>Gallery</a>
            <a href="#" style={{ 
              marginRight: '24px',
              fontSize: '0.875rem',
              color: '#4B5563'
            }}>Submit</a>
            <a href="#" style={{ 
              marginRight: '24px',
              fontSize: '0.875rem',
              color: '#4B5563'
            }}>Vote</a>
            <a href="#" style={{ 
              marginRight: '24px',
              fontSize: '0.875rem',
              color: '#4B5563'
            }}>About</a>
          </div>
          
          {/* 登录按钮 */}
          <div style={{ 
            textAlign: 'right',
            fontSize: '0.875rem',
            color: '#4B5563',
            cursor: 'pointer'
          }}>
            Login
          </div>
        </div>
      </header>
    );
} 