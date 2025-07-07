import { createContext, useState, useEffect, useContext, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Tooltip } from "react-tooltip";
import { onAuthStateChanged, getIdToken, signInWithCustomToken } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { convertToBlobUrl, detectLocation } from "../utils/helper";
import Notification from "../components/common/Notification/Notification";
import { useNavigate, useSearchParams } from "react-router-dom";
import { decryptData } from "../utils/crypto";

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const getTokenId = async () => {
  const newToken = await getIdToken(auth.currentUser, true);
  return newToken;
};

const CUSTOM_TOKEN = process.env.REACT_APP_CUSTOM_TOKEN_API || "https://customtoken-k6w4uioz4a-uc.a.run.app";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDocUnsubscribed, setUserDocUnsubscribed] = useState(null);
  const [notificationError, setNotificationError] = useState(null);
  const [notificationSuccess, setNotificationSuccess] = useState(false);
  const [searchParamsData, setSearchParamsData] = useState({});
  const [isOutsideIndia, setIsOutsideIndia] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Add a ref to track manual logout state
  const isManualLogoutRef = useRef(false);

  // Helper function to extract user ID from encrypted data
  const extractUserIdFromEncryptedData = (encryptedData) => {
    try {
      const result = decryptData(encryptedData);
      setSearchParamsData(result);
      const uid = result.userId || result.uid || result.data;

      if (!uid) {
        console.error("Decrypted result:", result);
        return null;
      }

      return uid;
    } catch (error) {
      console.error("Decryption failed:", error);
      console.error("Failed encrypted data:", encryptedData);
      return null;
    }
  };

  // Helper function to sign in with custom token
  const signInWithCustomTokenAsync = async (uid) => {
    try {
      setLoading(true);
      const response = await fetch(`${CUSTOM_TOKEN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid }),
      });
      const customToken = await response.json();
      const userCredential = await signInWithCustomToken(auth, customToken.token);

      setLoading(false);
      if (userCredential?.user?.uid) {
        console.log("logged in");
        return true;
      } else {
        return false;
      }
    } catch (error) {
      setLoading(false);
      console.error("Error signing in with custom token:", error.message);
      return false;
    }
  };

  // Helper function to process user document data
  const processUserDocument = async (doc, currentUser, userId, outsideIndia) => {
    if (doc.exists() && currentUser) {
      const detail = { ...doc.data() };

      if (detail.image) {
        convertToBlobUrl(detail.image).then((imageUrl) => {
          detail.image = imageUrl || "";
        });
      } else {
        detail.image = "";
      }

      setUser({
        ...detail,
        uid: userId,
        isFirstLogin: "isFirstLogin" in detail ? detail.isFirstLogin : true,
        isOutsideIndia: outsideIndia,
      });
    }
    setLoading(false);
  };

  // Effect to handle URL-based authentication
  useEffect(() => {
    // Only run on /checkout page
    if (window.location.pathname !== "/checkout") return;

    const encryptedData = searchParams.get("data");
    if (!encryptedData) return;

    // Always decode URI component before decryption
    let decodedData;
    try {
      decodedData = decodeURIComponent(encryptedData);
    } catch (e) {
      decodedData = encryptedData;
    }

    const uid = extractUserIdFromEncryptedData(decodedData);

    if (!uid) {
      navigate("/invalid-user");
      return;
    }

    (async () => {
      const signInSuccess = await signInWithCustomTokenAsync(uid);

      if (!signInSuccess) {
        navigate("/invalid-user");
      }
    })();
  }, [searchParams]);

  // Effect to handle authentication state changes
  useEffect(() => {
    let userDocUnsubscribe = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If this is triggered after a manual logout, don't redirect back to dashboard
      if (isManualLogoutRef.current && !currentUser) {
        isManualLogoutRef.current = false;
        setUser(null);
        setLoading(false);
        return;
      }

      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
        return;
      }

      if (currentUser && currentUser.email) {
        // Use detectLocation function
        const outsideIndia = await detectLocation();
        setIsOutsideIndia(outsideIndia);

        // Get userId from localStorage (set by URL decryption) or use currentUser.uid
        const userId = currentUser.uid;

        const userRef = doc(db, `users/${userId}`);
        userDocUnsubscribe = onSnapshot(userRef, async (doc) => {
          await processUserDocument(doc, currentUser, userId, outsideIndia);
        });
        setUserDocUnsubscribed(() => userDocUnsubscribe);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      // Set manual logout flag to true
      isManualLogoutRef.current = true;

      if (userDocUnsubscribed) {
        userDocUnsubscribed();
        setUserDocUnsubscribed(null);
      }

      // Clear userId from localStorage
      localStorage.removeItem("userId");

      // Set user to null before calling Firebase signOut
      setUser(null);
      setLoading(true); // Set loading to prevent flash of protected content

      // Then sign out from Firebase
      await auth.signOut();
      setLoading(false);
      // window.location.href = "/";
      return true;
    } catch (error) {
      isManualLogoutRef.current = false; // Reset flag in case of error
      console.error("Error signing out:", error);
      setLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    searchParamsData,
    isOutsideIndia,
    loading,
    setLoading,
    setNotificationError,
    setNotificationSuccess,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {(notificationError || notificationSuccess) && (
        <Notification
          type={(notificationError && "error") || (notificationSuccess && "success")}
          message={notificationError || notificationSuccess}
          onClose={() => (notificationError ? setNotificationError(null) : setNotificationSuccess(false))}
        />
      )}
      {/* 
      data-tooltip-id= "tooltip-studio-ai" 
      data-tooltip-content= text here which you what to show in tooltip
      or
      'data-tooltip-html':
                'Image upload limit reached. Upgrade your plan <br /> to unlock more advanced image editing options.',
       */}
      <Tooltip id="tooltip-studio-ai" style={{ zIndex: 9999999 }} render={({ content = "" }) => <span>{content}</span>} place="bottom" />
      {children}
    </AuthContext.Provider>
  );
}
