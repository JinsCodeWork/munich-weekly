/**
 * Application configuration file
 * Centralized management of configurable content for future changes via admin panel
 */

/**
 * Home page configuration
 */
export const homePageConfig = {
  // Hero image configuration for home page
  heroImage: {
    // Image URL, can be updated from CMS or admin panel in the future
    // Use path format compatible with existing CDN system
    imageUrl: '/images/home/hero.jpg',
    // Image description text (displayed in the center on hover)
    description: 'A weekly celebration of munich student photography — each image, a distinct point of view',
    // Image caption at the bottom (displayed at the bottom on hover)
    imageCaption: 'Alpspitz, Bavaria'
  },
  
  // Page introduction text
  introText: {
    title: 'Your Eyes, Your Story',
    description: 'Join our local weekly photography events, submit your works, vote for your favorite photos, and grow together with student photography enthusiasts in Munich.',
  }
};

/**
 * Site metadata configuration
 */
export const siteConfig = {
  title: 'Munich Weekly Photography Platform',
  description: 'Weekly showcase and voting platform for Munich student photography works',
  url: 'https://munichweekly.art',
}; 