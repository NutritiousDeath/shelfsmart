import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setIsLoadingAuth(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

const loadUserProfile = async (authUser) => {
  try {
    const { data: member, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (error || !member) {
      // If we can't find the team member, sign out completely
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      return;
    }

    setUser({
      id: authUser.id,
      email: authUser.email,
      full_name: member?.full_name || authUser.email,
      role: member?.role || 'employee',
      department: member?.department,
      sub_department: member?.sub_department,
      teamMemberId: member?.id,
    });
    setIsAuthenticated(true);
  } catch (err) {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  } finally {
    setIsLoadingAuth(false);
  }
};

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    window.location.hash = '/login';
  };

  const navigateToLogin = () => {
    window.location.hash = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      logout,
      navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
