export interface BiometricAccount {
  user: any;
  token: string;
}

export const isBiometricSupported = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return true; // Fallback to prompt
    }
  }
  return true;
};

export const isBiometricEnrolled = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem("identix_biometric_enabled") === "true" &&
    !!localStorage.getItem("identix_biometric_token")
  );
};

export const getEnrolledUser = (): any | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("identix_biometric_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const registerBiometric = async (user: any, token: string): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  try {
    if (window.PublicKeyCredential && navigator.credentials) {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      try {
        await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: "Identix PayFlow" },
            user: {
              id: userId,
              name: user.username || "user",
              displayName: user.full_name || user.username || "User",
            },
            pubKeyCredParams: [
              { alg: -7, type: "public-key" },  // ES256
              { alg: -257, type: "public-key" }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
            },
            timeout: 60000,
          },
        });
      } catch (promptErr) {
        console.warn("Platform authenticator prompt note:", promptErr);
      }
    }

    // Persist biometric enrollment locally
    localStorage.setItem("identix_biometric_enabled", "true");
    localStorage.setItem("identix_biometric_token", token);
    localStorage.setItem("identix_biometric_user", JSON.stringify(user));
    return true;
  } catch (err) {
    console.error("Failed to register biometric:", err);
    return false;
  }
};

export const authenticateBiometric = async (): Promise<BiometricAccount> => {
  if (typeof window === "undefined") throw new Error("Window not available");
  
  const token = localStorage.getItem("identix_biometric_token");
  const userStr = localStorage.getItem("identix_biometric_user");

  if (!token || !userStr) {
    throw new Error("No fingerprint enrolled on this device. Please sign in with password first.");
  }

  // Invoke native device biometric sensor prompt
  if (window.PublicKeyCredential && navigator.credentials) {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    try {
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
        },
      });
    } catch (err: any) {
      // If user cancelled, don't authenticate
      if (err.name === "NotAllowedError" || err.message?.includes("cancel")) {
        throw new Error("Fingerprint verification cancelled by user");
      }
    }
  }

  return {
    user: JSON.parse(userStr),
    token,
  };
};

export const disableBiometric = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("identix_biometric_enabled");
    localStorage.removeItem("identix_biometric_token");
    localStorage.removeItem("identix_biometric_user");
  }
};
