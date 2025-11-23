import { supabase } from '../lib/supabase';

export const authService = {
  async initializeAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('Error signing in anonymously:', error);
        return null;
      }
      
      return data.user?.id;
    }

    return session.user.id;
  },

  async getUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }
};
