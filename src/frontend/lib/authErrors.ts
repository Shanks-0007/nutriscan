/**
 * Converts Firebase Auth error codes into user-friendly messages.
 */
export const getAuthErrorMessage = (error: any): string => {
  if (!error || !error.code) return error?.message || 'An unexpected error occurred';

  switch (error.code) {
    case 'auth/popup-closed-by-user':
      return 'The sign-in popup was closed before completion. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'The sign-in process was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please enable popups for this site.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in the Firebase Console. Go to Authentication > Sign-in method and enable Email/Password and Google.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      // Return a cleaned up version of the error message if we don't have a specific case
      return error.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'Authentication failed';
  }
};
