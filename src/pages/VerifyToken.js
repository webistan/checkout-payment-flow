/* eslint-disable no-unused-expressions */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { createUpdateUser } from '../lib/firebaseFunction';

function VerifyToken() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const email = searchParams.get('email');
  const plan = searchParams.get('plan');
  const duration = searchParams.get('duration');

  useEffect(() => {
    async function verifyEmailLink() {
      const isEmailLink = await isSignInWithEmailLink(auth, window.location.href);

      if (isEmailLink) {
        try {
          // Complete the sign-in process
          const result = await signInWithEmailLink(auth, email, window.location.href);

          if (result.user) {
            const data = {
              email,
              lastLoginTime: new Date().toISOString(),
            };
            const res = await createUpdateUser(data, undefined, false);
            if (!res.success) {
              setError('Error updating user data. Please try again.');
              navigate('/');
              return;
            }

            if (plan && duration) {
              navigate(`/checkout?plan=${plan}&duration=${duration}`, { replace: true });
              return;
            } else {
              navigate(`/dashboard`, { replace: true });
            }
          }
        } catch (error) {
          console.error('Error signing in with email link:', error);
          setError('Error verifying email link. Please try again.');
          navigate('/');
        }
      }
    }

    email ? verifyEmailLink() : null;
  }, [email, plan, duration]);

  if (error) {
    return <div className='error-message'>{error}</div>;
  }

  return (
    <div className='centered-page'>
      {email ? <h3>Verifying email link, please wait...</h3> : <>Wrong Url</>}
    </div>
  );
}

export default VerifyToken;
