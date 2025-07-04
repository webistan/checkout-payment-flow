import React, { useEffect } from 'react';
import { IoCloseSharp, IoCheckmarkCircle, IoWarning } from 'react-icons/io5';

import './Notification.css';

const Notification = ({ type = 'success', message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <IoCheckmarkCircle size={20} />;
      case 'error':
        return <IoWarning size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className={`notification ${type}`}>
      {getIcon()}
      <span style={{ marginLeft: '10px', flex: 1 }}>{message}</span>
      <button className='notification-close-button' onClick={onClose}>
        <IoCloseSharp size={18} />
      </button>
    </div>
  );
};

export default Notification;
