import styles from './CheckoutLoader.module.css';

const CheckoutLoader = () => {
  return (
    <div className={styles.checkoutLoaderContainer}>
      <div className={styles.checkoutLoader}>
        <div className={styles.checkoutLoaderCard}>
          <div className={styles.loaderHeader}>
            <div className={styles.loaderLogo}></div>
            <div className={styles.loaderBack}></div>
          </div>
          <div className={styles.loaderContent}>
            <div className={styles.loaderLeftColumn}>
              <div className={styles.loaderPlanHeader}>
                <div className={styles.loaderBadge}></div>
                <div className={styles.loaderTitle}></div>
                <div className={styles.loaderDescription}></div>
              </div>
              <div className={styles.loaderBreakdown}>
                <div className={styles.loaderBreakdownTitle}></div>
                <div className={styles.loaderBreakdownRow}></div>
                <div className={styles.loaderBreakdownRow}></div>
                <div className={styles.loaderBreakdownRow}></div>
              </div>
            </div>
            <div className={styles.loaderRightColumn}>
              <div className={styles.loaderPaymentCard}>
                <div className={styles.loaderPaymentTitle}></div>
                <div className={styles.loaderPriceDisplay}></div>
                <div className={styles.loaderSecurityItems}></div>
                <div className={styles.loaderPayButton}></div>
                <div className={styles.loaderGuarantee}></div>
              </div>
            </div>
          </div>
        </div>
        {/* <div className={styles.checkoutLoaderSpinner}></div> */}
        {/* <p className={styles.checkoutLoaderText}>Loading plan details...</p> */}
      </div>
    </div>
  );
};

export default CheckoutLoader;
