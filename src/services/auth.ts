import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';
import { migrationService } from './migrationService';

export const authService = {
  async initializeAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Check for pending migration
      const oldUserId = localStorage.getItem('migration_old_user_id');
      if (oldUserId && oldUserId !== session.user.id) {
        try {
          await this.migrateAnonymousData(oldUserId, session.user.id);
        } catch (error) {
          console.error('Migration failed during init:', error);
        } finally {
          localStorage.removeItem('migration_old_user_id');
        }
      }

      // Check and update display_name if missing
      const { user } = session;
      const meta = user.user_metadata;
      if (!meta.display_name && !meta.full_name && !meta.name && user.email) {
        const displayName = user.email.split('@')[0];
        await supabase.auth.updateUser({
          data: { display_name: displayName }
        });
      }

      return session.user.id;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('Error signing in anonymously:', error);
      return null;
    }
    
    return data.user?.id;
  },

  async getUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  },

  async signInWithOtp(email: string) {
    // Save current anonymous ID for migration
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.is_anonymous) {
      localStorage.setItem('migration_old_user_id', user.id);
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      throw error;
    }
  },

  async signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem('migration_old_user_id');
    // After sign out, re-initialize anonymous auth
    await this.initializeAuth();
    window.location.reload();
  },

  async isAnonymous() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.is_anonymous ?? false;
  },

  async getUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      displayName: user.user_metadata.full_name || user.user_metadata.name,
      avatarUrl: user.user_metadata.avatar_url || user.user_metadata.picture,
      provider: user.app_metadata.provider,
      isAnonymous: user.is_anonymous ?? false
    };
  },

  async migrateAnonymousData(oldUserId: string, newUserId: string) {
    return migrationService.migrateAnonymousUserData(oldUserId, newUserId);
  }
};
