/**
 * Social Authentication Module
 * 
 * Exports all social authentication related components and hooks.
 */

// Types
export * from './types';

// Service
export { SocialAuthService, socialAuthService } from './social-service';

// Provider & Hooks
export { SocialAuthProvider, useIsSignedIn, useProviderSignIn, useSocialAuth } from './social-provider';

// Additional hooks (useSocialAuth is already exported from provider)
export { useSocialSignIn } from './use-social-auth';
