import { Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ element }) => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const plan = searchParams.get('plan');
  const duration = searchParams.get('duration');

  const isDirectNavigation = location.state?.from === 'logout';

  if (loading) {
    return (
      <div className='global-loader'>
        <div className='btn-loader' style={{ width: '50px', height: '50px' }}></div>
      </div>
    );
  }

  if (user && !isDirectNavigation) {
    if (plan && duration && user) {
      return <Navigate to={`/checkout?plan=${plan}&duration=${duration}`} replace />;
    }
  }

  return <div style={{ width: '100%', height: '100%' }}>{element}</div>;
};

export default PublicRoute;
