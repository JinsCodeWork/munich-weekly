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
    description: 'Munich Weekly Photography Community is dedicated to showcasing the wonderful works of student photographers in Munich. Different themes every week, each work is a unique perspective.',
    // Image caption at the bottom (displayed at the bottom on hover)
    imageCaption: 'Photographer: Max Mustermann | Marienplatz, Munich | June 2023'
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