import { useAuth } from '../context/AuthContext';

export function useRoles() {
  const { currentUser } = useAuth();

  const isAdmin = currentUser?.role === 'admin';
  const isViewer = currentUser?.role === 'viewer';

  return {
    isAdmin,
    isViewer,
    currentRole: currentUser?.role
  };
}