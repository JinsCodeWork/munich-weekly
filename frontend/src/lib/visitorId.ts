import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

const VISITOR_ID_COOKIE_NAME = 'visitorId';
const VISITOR_ID_COOKIE_EXPIRES_DAYS = 365;

/**
 * Retrieves the visitor ID from cookies. If not found, generates a new one,
 * stores it in cookies, and returns it.
 * 
 * @returns The visitor ID string.
 */
export const getOrGenerateVisitorId = (): string => {
  let visitorId = Cookies.get(VISITOR_ID_COOKIE_NAME);

  if (!visitorId) {
    visitorId = uuidv4();
    Cookies.set(VISITOR_ID_COOKIE_NAME, visitorId, { 
      expires: VISITOR_ID_COOKIE_EXPIRES_DAYS,
      path: '/', // Make it available site-wide
      sameSite: 'Lax' // Recommended for most cases
    });
    console.log('Generated new visitorId:', visitorId);
  } else {
    console.log('Found existing visitorId:', visitorId);
  }
  return visitorId;
}; 