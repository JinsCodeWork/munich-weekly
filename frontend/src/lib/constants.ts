/**
 * 应用常量
 * 集中管理应用中使用的常量值，方便维护和修改
 */

// 站点信息
export const SITE = {
  name: 'Munich Weekly',
  description: 'Photography submissions and voting platform.',
  url: 'https://munich-weekly.com',
};

// API路径
export const API_PATHS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  me: '/api/users/me',
  photos: '/api/photos',
  votes: '/api/votes',
};

// 导航链接
export const NAV_LINKS = [
  { label: 'Gallery', href: '/gallery' },
  { label: 'Submit', href: '/submit' },
  { label: 'Vote', href: '/vote' },
  { label: 'About', href: '/about' },
];

// 本地存储键
export const STORAGE_KEYS = {
  token: 'jwt',
  theme: 'theme',
};

// 主题变量
export const THEME = {
  colors: {
    primary: '#3B82F6', // blue-500
    secondary: '#6B7280', // gray-500
    accent: '#F59E0B', // amber-500
    background: '#F9FAFB', // gray-50
    text: {
      primary: '#111827', // gray-900
      secondary: '#4B5563', // gray-600
      light: '#9CA3AF', // gray-400
    },
  },
  // 断点
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
}; 