import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { MovieCard } from '../components/MovieCard';
import { Share2, Check } from 'lucide-react';

export const MyList: React.FC = () => {
  const { myList } = useStore();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    // For POC: Create a JSON string of IDs and encode it in the URL
    // In a real app, this would save to a DB and return a short ID
    const listData = myList.map(item => ({ id: item.id, type: item.media_type }));

    const encodedData = btoa(JSON.stringify(listData));
    const url = `${window.location.origin}/shared?data=${encodedData}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Minha Lista</h1>
        {myList.length > 0 && (
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
            {copied ? 'Link Copiado!' : 'Compartilhar Lista'}
          </button>
        )}
      </div>

      {myList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {myList.map((item) => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl mb-2">Sua lista está vazia</p>
          <p className="text-sm">Adicione filmes e séries para assistir depois.</p>
        </div>
      )}
    </div>
  );
};
