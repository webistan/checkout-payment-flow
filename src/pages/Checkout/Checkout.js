import React from "react";
import Checkout from "../../components/Checkout";
import { useAuth } from "../../context/AuthContext";

const CheckoutPage = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="main-content">
      <Checkout />
    </div>
  );
};

export default CheckoutPage;
