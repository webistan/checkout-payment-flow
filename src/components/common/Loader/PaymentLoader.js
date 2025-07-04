import './PaymentLoader.css';

const PaymentLoader = () => {
  return (
    <div className='paymentLoaderContainer'>
      <div className='paymentLoader'>
        <div className='paymentLoaderSpinner'></div>
        <p className='paymentLoaderText'>Processing payment..</p>
      </div>
    </div>
  );
};

export default PaymentLoader;
