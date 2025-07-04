import React from 'react';
import './CircularLoader.css';

const CircularLoader = ({ className }) => {
  return (
    <div className={`circular-loader ${className || ''}`}>
      <div className='loader-circle'></div>
    </div>
  );
};

export default CircularLoader;
