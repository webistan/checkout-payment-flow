const AccessibleRoute = ({ children }) => {
  // Render the component with different functionality based on auth status
  return (
    <div className='dashboard-container' style={{ height: '100vh' }}>
      {children}
    </div>
  );
};

export default AccessibleRoute;
