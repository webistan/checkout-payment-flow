import './Loader.css';

/* className = 'loading-primary' | default: "white" */
const CircularLoader = ({ className = '' }) => {
  return (
    <>
      <span className={`loading-spinner ${className}`} />
    </>
  );
};

export default CircularLoader;
