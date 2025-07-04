import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Tooltip } from "react-tooltip";
import { onAuthStateChanged, getIdToken, signInWithCustomToken } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { convertToBlobUrl, detectLocation } from "../utils/helper";
import Notification from "../components/common/Notification/Notification";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const getTokenId = async () => {
  const newToken = await getIdToken(auth.currentUser, true);
  return newToken;
};

const CUSTOM_TOKEN = process.env.NEXT_PUBLIC_CUSTOM_TOKEN_API;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDocUnsubscribed, setUserDocUnsubscribed] = useState(null);
  const [notificationError, setNotificationError] = useState(null);
  const [notificationSuccess, setNotificationSuccess] = useState(false);
  const [isOutsideIndia, setIsOutsideIndia] = useState(true);

  // Add a ref to track manual logout state
  const isManualLogoutRef = useRef(false);

  useEffect(() => {
    const uid = Cookies.get("__uuid") || "";

    if (uid) {
      (async () => {
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
            // setUser(userCredential.user);
            console.log("logged in");
          } else {
            window.location.href = "/invalid-user";
          }
        } catch (error) {
          setLoading(false);
          console.error("Error signing in with custom token:", error.message);
          window.location.href = "/invalid-user";
        }
      })();
    } else {
      window.location.href = "/invalid-user";
    }
  }, []);

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
        const userRef = doc(db, `users/${currentUser.uid}`);
        userDocUnsubscribe = onSnapshot(userRef, async (doc) => {
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
              uid: currentUser.uid,
              isFirstLogin: "isFirstLogin" in detail ? detail.isFirstLogin : true,
              isOutsideIndia: outsideIndia,
            });
          }
          setLoading(false);
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
