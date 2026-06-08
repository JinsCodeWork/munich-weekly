/**
 * Anonymous voting identity is issued and verified by the backend through the
 * signed HttpOnly mw_vote_anon cookie. Frontend code must not generate or
 * persist a JS-writable visitor ID as an authoritative voting identity.
 */
export const AUTHORITATIVE_VOTE_ANON_COOKIE = "mw_vote_anon";
