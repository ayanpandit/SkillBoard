import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This will handle the auth redirect
    // Supabase client will automatically detect the auth flow from the URL
    const handleAuthRedirect = async () => {
      try {
        // The hash fragment contains tokens which will be automatically detected and stored
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth redirect:', error);
          navigate('/');
        } else {
          // Redirect to home page or dashboard after successful auth
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to handle auth redirect:', error);
        navigate('/');
      }
    };

    handleAuthRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <div className="animate-pulse">
        <h2 className="text-2xl font-bold mb-4">Processing your authentication...</h2>
        <p>You'll be redirected shortly.</p>
      </div>
    </div>
  );
};

export default AuthRedirect;
