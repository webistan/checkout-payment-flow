import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='global-loader'>
        <div className='btn-loader' style={{ width: '50px', height: '50px' }}></div>
      </div>
    );
  }

  return (
    <>
      <div className='dashboard-container' style={{ height: '100vh' }}>
        {children}
      </div>
    </>
  );
};

export default ProtectedRoute;
