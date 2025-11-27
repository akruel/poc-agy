import { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { authService } from '../services/auth';
import { UserMenu } from './UserMenu';
import { LogIn, Mail, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

export function LoginButton() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const profile = await authService.getUserProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSendingLink(true);
    try {
      await authService.signInWithOtp(email);
      toast.success('Link de login enviado para seu email!', {
        id: 'login-link-sent',
        duration: 3000,
        closeButton: false,
      });
      setShowEmailInput(false);
      setEmail('');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao enviar link de login');
    } finally {
      setSendingLink(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-9 w-24 rounded-full" />;
  }

  if (user && !user.isAnonymous) {
    return <UserMenu user={user} onLogout={loadUser} />;
  }

  if (showEmailInput) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
        <form onSubmit={handleSendLink} className="flex items-center gap-2">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="pl-9 pr-3 h-9 rounded-full w-48 sm:w-64 bg-background"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={sendingLink}
            size="sm"
            className="rounded-full"
          >
            {sendingLink ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowEmailInput(false)}
          className="h-8 w-8 rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setShowEmailInput(true)}
      variant="secondary"
      className="rounded-full"
    >
      <LogIn className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">Fazer Login</span>
    </Button>
  );
}
