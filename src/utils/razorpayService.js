// RazorPay Integration Service

import { calculateNextMonthYear } from './helper';
import { getTokenId } from '../context/AuthContext';
import { calculateFeatureValue, calculateStorageValue } from './helper/checkout';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CREATE_SUBSCRIPTION_URL = process.env.REACT_APP_RAZORPAY_CREATE_SUBSCRIPTION;
const VERIFICATION_URL = process.env.REACT_APP_RAZORPAY_VERIFICATION_URL;
const UPDATE_SUBSCRIPTION_URL = process.env.REACT_APP_UPDATE_SUBSCRIPTION;
const CANCEL_SUBSCRIPTION_URL = process.env.REACT_APP_CANCEL_SUBSCRIPTION;

const createSubscription = async (planDetails, token) => {
  try {
    const response = await fetch(CREATE_SUBSCRIPTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planId: planDetails.planId,
        total_count: planDetails.isAnnual ? 3 : 12,
        quantity: 1,
        isOutsideIndia: planDetails.isOutsideIndia,
        userId: planDetails.userId,
      }),
    });

    const res = await response.json();
    return res.subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Failed to create subscription');
  }
};

const initializePayment = async (details, planDetails, callbacks) => {
  const options = {
    key: planDetails.isOutsideIndia
      ? process.env.REACT_APP_USD_RAZORPAY_KEY_ID
      : process.env.REACT_APP_RAZORPAY_KEY_ID,
    amount: details.amount,
    currency: details.currency,
    name: 'OfficeIQ',
    description: `${planDetails.title} Plan Subscription`,
    subscription_id: details.id,
    handler: callbacks.onSuccess,
    prefill: {
      name: callbacks.fullName,
      email: callbacks.userEmail,
    },
    image: '/officeIQ_icon.png',
    theme: {
      color: '#f7a01d',
    },
    modal: {
      ondismiss: callbacks.onDismiss,
    },
  };

  const razorpayInstance = new window.Razorpay(options);
  razorpayInstance.open();
};

export const cancelSubscription = async (subscriptionId, token) => {
  try {
    const response = await fetch(`${CANCEL_SUBSCRIPTION_URL}?subsId=${subscriptionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const res = await response.json();
    return {
      status: 'ok',
      ...res,
    };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
};

export const handlePayment = async (planDetails, user, callbacks, currentSubscription) => {
  try {
    // Handle free plan or end of cycle plan changes
    const currentTime = Math.floor(Date.now() / 1000);
    const token = await getTokenId();

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      throw new Error('Failed to load Razorpay script');
    }

    const isEndOfCycle = true;

    const subscriptionDetail = await createSubscription(planDetails, token);

    await initializePayment(subscriptionDetail, planDetails, {
      userEmail: user.email,
      fullName: user.fullName,
      onSuccess: async (response) => {
        try {
          const verificationResponse = await fetch(VERIFICATION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_signature: response.razorpay_signature,
              razorpay_payment_id: response.razorpay_payment_id,
              subscription_id: response.razorpay_subscription_id,
              currentSubscriptionId: currentSubscription?.subscriptionId || '',
              endOfCycle: isEndOfCycle,
              isOutsideIndia: planDetails.isOutsideIndia,
            }),
          });

          const verification = await verificationResponse.json();
          if (verification.status === 'ok') {
            const successResponse = {
              subscriptionId: response.razorpay_subscription_id,
              features: {
                ...planDetails.features,
                hostingDuration: planDetails.isAnnual
                  ? `${planDetails.totalYears} Years`
                  : `1 Month`,
                imageEditing: calculateFeatureValue(
                  planDetails.features.imageEditing,
                  planDetails.isAnnual,
                  planDetails.totalYears,
                ),
                conversationalAiContentUpdate: calculateFeatureValue(
                  planDetails.features.conversationalAiContentUpdate,
                  planDetails.isAnnual,
                  planDetails.totalYears,
                ),
                monthlyVisitorLimit: calculateFeatureValue(
                  planDetails.features.monthlyVisitorLimit,
                  planDetails.isAnnual,
                  planDetails.totalYears,
                ),
                workspaceStorageLimit: calculateStorageValue(
                  planDetails.features.workspaceStorageLimit,
                  planDetails.isAnnual,
                  planDetails.totalYears,
                ),
                websiteModificationsUpdates: calculateFeatureValue(
                  planDetails.features.websiteModificationsUpdates,
                  planDetails.isAnnual,
                  planDetails.totalYears,
                ),
              },
              isAnnual: planDetails.isAnnual,
              title: planDetails.title.split(' ')[0],
              price: planDetails.price,
              planId: planDetails.planId,
              startDate: currentTime,
              totalYears: planDetails.totalYears,
              nextBillingDate: planDetails.isAnnual
                ? calculateNextMonthYear({ isMonthly: false, totalYear: planDetails.totalYears })
                : calculateNextMonthYear({ isMonthly: true }),
            };

            if (isEndOfCycle && verification?.cancelSubscription?.current_end) {
              successResponse.endDate = verification.cancelSubscription.current_end;
            }

            callbacks.onSuccess(successResponse);
          } else {
            callbacks.onError('Payment verification failed');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          callbacks.onError('Payment verification failed');
        }
      },
      onDismiss: () => callbacks.onDismiss(),
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    callbacks.onError(error.message);
  }
};
