import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';
import { listService } from '../services/listService';

export function JoinListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'input' | 'confirm' | 'joining' | 'success' | 'error'>('loading');
  const [listName, setListName] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Extract and validate role from URL
  const roleParam = searchParams.get('role');
  const role: 'editor' | 'viewer' = roleParam === 'editor' || roleParam === 'viewer' ? roleParam : 'viewer';

  useEffect(() => {
    if (!id) return;
    
    const init = async () => {
      try {
        // Fetch list name
        const name = await listService.getListName(id);
        setListName(name);

        // Check current user
        const profile = await authService.getUserProfile();
        if (profile && !profile.isAnonymous) {
          if (profile.displayName) {
            setMemberName(profile.displayName);
            setStatus('confirm');
            return;
          }
        }
        
        setStatus('input');
      } catch (err) {
        console.error(err);
        setStatus('error');
        setError('Failed to load list details.');
      }
    };
    
    init();
  }, [id]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    setStatus('joining');
    try {
      await listService.joinList(id!, memberName, role);
      setStatus('success');
      setTimeout(() => {
        navigate(`/lists/${id}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('Failed to join list.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
      {status === 'loading' && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p>Loading list details...</p>
        </>
      )}

      {status === 'input' && (
        <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-2 text-center">Join List</h1>
          <p className="text-gray-400 text-center mb-2">
            You've been invited to join <span className="text-white font-semibold">"{listName}"</span>
          </p>
          <div className="text-center mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              role === 'editor' 
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                : 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
            }`}>
              {role === 'editor' ? '✏️ Editor' : '👁️ Visualizador'}
            </span>
            <p className="text-xs text-gray-500 mt-2">
              {role === 'editor' 
                ? 'Você poderá adicionar e remover itens desta lista' 
                : 'Você terá acesso apenas para visualizar esta lista'}
            </p>
          </div>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-white"
                placeholder="Enter your name"
                required
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Join List
            </button>
          </form>
        </div>
      )}

      {status === 'confirm' && (
        <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Join List</h1>
          <p className="text-gray-300 mb-6">
            Entrando na lista <span className="font-semibold text-white">"{listName}"</span> como <span className="font-semibold text-primary">{memberName}</span>
          </p>
          
          <div className="mb-6">
             <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              role === 'editor' 
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                : 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
            }`}>
              {role === 'editor' ? '✏️ Editor' : '👁️ Visualizador'}
            </span>
          </div>

          <button
            onClick={handleJoin}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-md transition-colors mb-3"
          >
            Confirmar
          </button>
          
          <button
            onClick={() => setStatus('input')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Entrar com outro nome
          </button>
        </div>
      )}

      {status === 'joining' && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p>Joining list...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <p className="text-xl">Successfully joined list!</p>
          <p className="text-gray-400 mt-2">Redirecting...</p>
        </>
      )}

      {status === 'error' && (
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">✕</div>
          <p className="text-xl mb-2">Something went wrong</p>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/lists')}
            className="text-primary hover:underline"
          >
            Go to My Lists
          </button>
        </div>
      )}
    </div>
  );
}
