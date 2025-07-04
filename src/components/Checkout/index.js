import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaLongArrowAltLeft, FaCheck, FaLock, FaCreditCard, FaShieldAlt } from "react-icons/fa";
import { createUpdateUser, getPlans } from "../../lib/firebaseFunction";
import { handlePayment as handlePaymentService } from "../../utils/razorpayService";
import styles from "./checkout.module.css";
import { useAuth } from "../../context/AuthContext";
import { getProgressiveDiscountSummary, getModifiedDescription } from "../../utils/helper/checkout";
import CheckoutLoader from "../common/Loader/CheckoutLoader";

const Checkout = () => {
  const [selectedYears, setSelectedYears] = useState(6);
  const [pricing, setPricing] = useState({
    price: 0,
    original: 0,
    savings: 0,
    discount: 0,
  });
  const [currentPlan, setCurrentPlan] = useState({});
  const [pricingOptions, setPricingOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnnually, setIsAnnually] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setNotificationSuccess, setNotificationError, isOutsideIndia } = useAuth();
  const planName = searchParams.get("plan") || "basic";
  const duration = searchParams.get("duration") || "yearly";

  // Currency symbol
  const currencySymbol = isOutsideIndia ? "$" : "₹";

  useEffect(() => {
    (async () => {
      setIsPlanLoading(true);
      try {
        const plans = await getPlans({ isOutsideIndia });
        const selectedPlan = plans.plans.find((p) => p.title.toLowerCase().includes(planName.toLowerCase()));
        setCurrentPlan({ ...selectedPlan, title: selectedPlan.title });
      } catch (error) {
        console.error("Error loading plan:", error);
        setNotificationError("Failed to load plan details. Please try again.");
      } finally {
        setIsPlanLoading(false);
      }
    })();
  }, [isOutsideIndia]);

  useEffect(() => {
    if (duration === "yearly") {
      setIsAnnually(true);
    } else {
      setIsAnnually(false);
    }
  }, [duration]);

  useEffect(() => {
    if (Object.keys(currentPlan).length) {
      if (isAnnually) {
        const summaryData = getProgressiveDiscountSummary({
          basePrice: currentPlan.yearlyPrice,
          minDiscount: currentPlan.minDiscountYearly,
          maxDiscount: currentPlan.maxDiscountYearly,
        });
        const finalPricingOptions = summaryData.map((summary, i) => {
          return {
            price: summary.finalPrice,
            original: summary.yearlyBasePrice,
            discountPrice: summary.discountPrice,
            savings: summary.totalSaved,
            discount: summary.discount,
          };
        });

        setPricingOptions(finalPricingOptions);
        setPricing(finalPricingOptions[selectedYears - 1]);
      } else {
        setPricing({
          price: currentPlan.monthlyPrice,
        });
        setPricingOptions([]);
        setSelectedYears(1);
      }
    }
  }, [currentPlan, isAnnually]);

  useEffect(() => {
    let timer;
    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isSuccess && countdown === 0) {
      navigate("/dashboard");
    }
    return () => clearTimeout(timer);
  }, [isSuccess, countdown]);

  // Handle duration change
  const handleDurationChange = (e) => {
    const years = parseInt(e.target.value);
    setSelectedYears(years);
    const selectedOption = pricingOptions.find((opt, idx) => idx + 1 === years);
    setPricing(selectedOption);
  };

  // Handle payment button click
  const handlePayment = () => {
    setIsLoading(true);

    // Select the correct plan ID based on billing cycle
    let planId;
    if (isAnnually) {
      planId = currentPlan.planIds[selectedYears - 1];
    } else {
      planId = currentPlan.monthlyPlanId;
    }

    handlePaymentService(
      {
        ...currentPlan,
        isAnnual: isAnnually,
        price: pricing.price,
        totalYears: isAnnually ? selectedYears : 1,
        planId: planId,
        isOutsideIndia,
        userId: user.uid,
      },
      user,
      {
        userEmail: user.email,
        fullName: user.fullName,
        onSuccess: async (response) => {
          console.log("Payment successful", response);

          const res = await createUpdateUser({ currentPlan: response }, undefined, isOutsideIndia);
          if (!res.success) {
            setNotificationError(res.error || "Failed to update plan");
          } else {
            setNotificationSuccess(`Successfully upgraded to ${currentPlan.title} plan!`);
          }
          setIsLoading(false);
          setIsSuccess(true);
          setCountdown(3);
        },
        onError: (error) => {
          console.error("Payment failed", error);
          setNotificationError(error || "Payment failed. Please try again.");
          setIsLoading(false);
        },
        onDismiss: () => {
          setIsLoading(false);
        },
      },
      user.currentPlan
    );
  };

  // Get displayed period text
  const getPeriodText = () => {
    if (!isAnnually) {
      return "Monthly • Recurring payment";
    }
    return `${selectedYears} Year${selectedYears > 1 ? "s" : ""} • One-time payment`;
  };

  // Calculate breakdown values
  const getBreakdownValues = () => {
    if (!isAnnually) {
      return {
        description: "Monthly Subscription",
        originalPrice: currentPlan?.monthlyPrice || 0,
        discount: 0,
        savings: 0,
        total: currentPlan?.monthlyPrice || 0,
      };
    }

    const basePrice = currentPlan?.yearlyPrice || pricing.original || 0;

    return {
      description: `${selectedYears} Year${selectedYears > 1 ? "s" : ""} at Base Price`,
      originalPrice: basePrice * (selectedYears || 1),
      discount: pricing.discount || 0,
      savings: pricing.savings || 0,
      discountPrice: pricing.discountPrice || 0,
      total: pricing.price || 0,
    };
  };

  return (
    <>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/dashboard" className={styles.logo}>
            <div className={styles.logoContainer}>
              <img src="/officeiq_icon_white.png" alt="Office IQ Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <span>
              AI Studio <sup>Beta</sup>
            </span>
          </Link>
          <Link to={"/settings?page=plans"} className={styles.backLink}>
            <FaLongArrowAltLeft />
            <span>Back to Pricing</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.container}>
          {isPlanLoading ? (
            <CheckoutLoader />
          ) : (
            <div className={styles.checkoutGrid}>
              {/* Plan Details */}
              <div className={styles.planDetails}>
                <div className={styles.planHeader}>
                  <div className={styles.planBadge}>Best Value</div>
                  <h1 className={styles.planName}>{`${currentPlan?.title} Plan`}</h1>
                  <p className={styles.planDescription}>Perfect for growing businesses with AI-powered features and priority support.</p>
                </div>

                {/* Duration Selector */}
                {!!pricingOptions.length && (
                  <div className={styles.durationSection}>
                    <h3 className={styles.durationTitle}>Choose Duration</h3>
                    <div className={styles.selectWrapper}>
                      <select id="duration" className={styles.durationSelect} value={selectedYears} onChange={handleDurationChange}>
                        {pricingOptions.map((option, index) => (
                          <option key={index} value={index + 1}>
                            {index + 1} Year{index > 0 ? "s" : ""} - {currencySymbol}
                            {option.price.toLocaleString("en-IN")}
                            {` (Save ${option.discount}%)`}
                          </option>
                        ))}
                      </select>
                      <span className={styles.selectArrow}>▼</span>
                    </div>
                  </div>
                )}

                {/* Cost Breakdown */}
                <div className={styles.costBreakdown}>
                  <div className={styles.breakdownTitle}>Cost Breakdown</div>
                  {Object.keys(currentPlan).length > 0 && (
                    <>
                      <div className={styles.breakdownRow}>
                        <span className={styles.breakdownLabel}>{getBreakdownValues().description}</span>
                        <span className={styles.breakdownValue}>
                          {currencySymbol}
                          {getBreakdownValues().originalPrice.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {getBreakdownValues().savings > 0 && (
                        <div className={styles.breakdownRow}>
                          <span className={`${styles.breakdownLabel} ${styles.breakdownSavings}`}>
                            Volume Discount ({getBreakdownValues().discount}%)
                          </span>
                          <span className={`${styles.breakdownValue} ${styles.breakdownSavings}`}>
                            - {currencySymbol}
                            {getBreakdownValues().discountPrice.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}

                      <div className={`${styles.breakdownRow} ${styles.breakdownRowLast}`}>
                        <span className={styles.breakdownLabel}>Your Total</span>
                        <span className={styles.breakdownValue}>
                          {currencySymbol}
                          {getBreakdownValues().total.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Key Features */}
                <div className={styles.featuresSection}>
                  <h3 className={styles.featuresTitle}>Key Features Included</h3>
                  <ul className={styles.featuresList}>
                    {currentPlan?.getIn &&
                      currentPlan.getIn.map((feature, index) => (
                        <li key={index}>
                          <span className={styles.checkIcon}>
                            <FaCheck />
                          </span>{" "}
                          <span>{getModifiedDescription(feature, currentPlan, isAnnually, selectedYears)}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {/* Payment Section */}
              <div className={styles.paymentSection}>
                <div className={styles.paymentCard}>
                  <h2 className={styles.paymentTitle}>Complete Purchase</h2>

                  {/* Pricing Display */}
                  <div className={styles.pricingDisplay}>
                    {pricing.savings > 0 && (
                      <div className={styles.originalPrice} id="originalPrice">
                        {currencySymbol}
                        {pricing.original.toLocaleString("en-IN")}
                      </div>
                    )}
                    <div className={styles.currentPrice} id="currentPrice">
                      {currencySymbol}
                      {pricing.price.toLocaleString("en-IN")}
                    </div>
                    <div className={styles.pricePeriod} id="pricePeriod">
                      {getPeriodText()}
                    </div>
                    {pricing.savings > 0 && (
                      <div className={styles.savingsBadge} id="savingsBadge">
                        Save {currencySymbol}
                        {pricing.savings.toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>

                  {/* Security */}
                  <div className={styles.securityItems}>
                    <div className={styles.securityItem}>
                      <span className={styles.securityIcon}>
                        <FaLock />
                      </span>
                      <span>SSL Encrypted</span>
                    </div>
                    <div className={styles.securityItem}>
                      <span className={styles.securityIcon}>
                        <FaCreditCard />
                      </span>
                      <span>Secure Payment</span>
                    </div>
                    <div className={styles.securityItem}>
                      <span className={styles.securityIcon}>
                        <FaShieldAlt />
                      </span>
                      <span>PCI Compliant</span>
                    </div>
                  </div>

                  {/* Pay Button */}
                  <button
                    className={`${styles.payButton} ${isLoading ? styles.loading : ""} ${isSuccess ? styles.success : ""}`}
                    onClick={handlePayment}
                    disabled={isLoading || isSuccess}
                  >
                    {isLoading ? (
                      <>
                        <div className={styles.loadingSpinner}></div>
                        <span>Processing...</span>
                      </>
                    ) : isSuccess ? (
                      <>
                        <span className={styles.successCheck}>
                          <FaCheck />
                        </span>
                        <span>Redirecting to dashboard... {countdown}</span>
                      </>
                    ) : (
                      <>
                        <span>
                          <FaCreditCard />
                        </span>
                        <span className={styles.payText}>
                          Pay Now {currencySymbol}
                          {pricing.price.toLocaleString("en-IN")}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Checkout;
