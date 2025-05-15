// components/Header.tsx
import React from 'react';
import { Thumbnail } from '@/components/ui/Thumbnail';

export default function Header() {
    // Define inline styles (using React.CSSProperties type)
    const headerStyles: {[key: string]: React.CSSProperties} = {
      container: {
        display: 'grid',
        gridTemplateColumns: '200px 1fr 100px', // Fixed width logo area, auto width nav area, fixed width login area
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
        paddingLeft: '10px' // Extra space on the left of nav bar
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
          {/* Logo and title area */}
          <div style={headerStyles.logo}>
            <div style={headerStyles.logoImg}>
              <Thumbnail 
                src="/logo.svg" 
                alt="Munich Weekly Logo" 
                width={32}
                height={32}
                objectFit="contain"
              />
            </div>
            <div className="text-xl font-bold tracking-wide">Munich Weekly</div>
          </div>
          
          {/* Navigation menu */}
          <div style={headerStyles.nav} className="hidden md:flex">
            <a href="#" style={headerStyles.navLink}>Gallery</a>
            <a href="#" style={headerStyles.navLink}>Submit</a>
            <a href="#" style={headerStyles.navLink}>Vote</a>
            <a href="#" style={headerStyles.navLink}>About</a>
          </div>
          
          {/* Login button */}
          <div style={headerStyles.login} className="hidden md:block">
            Login
          </div>
        </div>
      </header>
    );
  }