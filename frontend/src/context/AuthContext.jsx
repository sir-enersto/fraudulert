import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Force refresh to get latest claims
          await user.getIdToken(true);
          const tokenResult = await user.getIdTokenResult();
          
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            role: tokenResult.claims.role || 'viewer',
            organisation: tokenResult.claims.org
          });
        } catch (error) {
          console.error('Error getting token claims:', error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
  
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}