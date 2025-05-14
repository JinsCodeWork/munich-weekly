// components/Header.tsx
import React from 'react';

export default function Header() {
    // 定义内联样式（使用React.CSSProperties类型）
    const headerStyles: {[key: string]: React.CSSProperties} = {
      container: {
        display: 'grid',
        gridTemplateColumns: '200px 1fr 100px', // 固定宽度的logo区域，自动宽度的导航区，固定宽度的登录区
        alignItems: 'center',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.75rem 1rem'
      },
      logo: {
        display: 'flex',
        alignItems: 'center'
      },
      logoImg: {
        width: '32px',
        height: '32px',
        marginRight: '8px'
      },
      nav: {
        display: 'flex',
        paddingLeft: '10px' // 导航栏左侧额外空间
      },
      navLink: {
        marginRight: '24px',
        fontSize: '0.875rem',
        color: '#4B5563',
        cursor: 'pointer'
      },
      login: {
        textAlign: 'right' as const,
        fontSize: '0.875rem',
        color: '#4B5563',
        cursor: 'pointer'
      }
    };

    return (
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div style={headerStyles.container}>
          {/* Logo 和标题区域 */}
          <div style={headerStyles.logo}>
            <div style={headerStyles.logoImg}>
              <img 
                src="/logo.svg" 
                alt="Munich Weekly Logo" 
                style={{width: '100%', height: '100%', objectFit: 'contain'}}
              />
            </div>
            <div className="text-xl font-bold tracking-wide">Munich Weekly</div>
          </div>
          
          {/* 导航菜单 */}
          <div style={headerStyles.nav} className="hidden md:flex">
            <a href="#" style={headerStyles.navLink}>Gallery</a>
            <a href="#" style={headerStyles.navLink}>Submit</a>
            <a href="#" style={headerStyles.navLink}>Vote</a>
            <a href="#" style={headerStyles.navLink}>About</a>
          </div>
          
          {/* 登录按钮 */}
          <div style={headerStyles.login} className="hidden md:block">
            Login
          </div>
        </div>
      </header>
    );
  }