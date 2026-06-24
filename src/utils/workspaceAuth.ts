import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { auth } from "../firebase";

// In-memory cache for the Google OAuth Access Token (does not survive reload)
let cachedAccessToken: string | null = null;

// The standard Gmail scopes requested and approved by the user
export const GMAIL_SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.labels"
];

/**
 * Updates the in-memory cache of the access token.
 */
export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
  if (token) {
    localStorage.setItem("agrosensix_gmail_connected", "true");
  } else {
    localStorage.removeItem("agrosensix_gmail_connected");
  }
}

/**
 * Returns the currently cached access token.
 */
export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Initiates the Google Sign-in popup with explicit Gmail scopes
 * to retrieve a fresh OAuth Access Token.
 */
export async function connectGmail(): Promise<{ user: User; accessToken: string } | null> {
  try {
    const provider = new GoogleAuthProvider();
    // Add all necessary Gmail scopes
    GMAIL_SCOPES.forEach(scope => provider.addScope(scope));
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google Access Token for Gmail scopes.");
    }

    setCachedAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error) {
    console.error("[Workspace Auth] Gmail connection popup failed:", error);
    throw error;
  }
}

/**
 * Clears the cached session token.
 */
export function disconnectGmail() {
  setCachedAccessToken(null);
}
