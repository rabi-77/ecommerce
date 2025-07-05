import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

const GoogleAuthHandler = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleGoogleAuth = async () => {
      try {
        // parameters from URL
        const tokenAccess = searchParams.get('tokenAccess');
        const tokenRefresh = searchParams.get('tokenRefresh');
        const userDataParam = searchParams.get('userData');
        
        if (!tokenAccess || !userDataParam) {
          console.error('Missing required auth parameters');
          toast.error('Authentication failed: Missing data');
          navigate('/login');
          return;
        }
        
        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userDataParam));
        
        // Store in localStorage first
        localStorage.setItem('tokenAccess', tokenAccess);
        localStorage.setItem('tokenRefresh', tokenRefresh || '');
        localStorage.setItem('user', JSON.stringify(userData));
        
        dispatch({
          type: 'auth/login/fulfilled',
          payload: {
            user: userData,
            tokenAccess,
            tokenRefresh: tokenRefresh || ''
          }
        });
        
        toast.success('Successfully logged in with Google');
        
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Google auth error:', error);
        toast.error('Failed to process Google login');
        navigate('/login');
      }
    };
    
    if (searchParams.has('tokenAccess') || searchParams.has('userData')) {
      handleGoogleAuth();
    }
  }, [searchParams, dispatch, navigate]);
  
  return null;
};

export default GoogleAuthHandler;
