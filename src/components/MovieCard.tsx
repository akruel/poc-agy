import React from 'react';
import type { ContentItem } from '../types';
import { tmdb } from '../services/tmdb';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MovieCardProps {
  item: ContentItem;
}

export const MovieCard: React.FC<MovieCardProps> = ({ item }) => {
  const title = item.media_type === 'movie' ? item.title : item.name;
  const date = item.media_type === 'movie' ? item.release_date : item.first_air_date;
  const year = date ? new Date(date).getFullYear() : 'N/A';

  return (
    <Link 
      to={`/details/${item.media_type}/${item.id}`}
      className="group relative block bg-gray-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-200 shadow-lg"
    >
      <div className="aspect-[2/3] w-full">
        <img 
          src={tmdb.getImageUrl(item.poster_path, 'w500')} 
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white font-semibold px-4 py-2 bg-primary rounded-full">Ver Detalhes</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-white truncate" title={title}>{title}</h3>
        <div className="flex items-center justify-between text-gray-400 text-sm mt-1">
          <span>{year}</span>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star size={14} fill="currentColor" />
            <span>{item.vote_average.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
