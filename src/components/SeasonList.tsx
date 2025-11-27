import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { tmdb } from '../services/tmdb';
import { useStore } from '../store/useStore';
import type { Episode } from '../types';
import { EpisodeListSkeleton } from './skeletons';
import { useSeasonProgress } from '../hooks/useSeasonProgress';
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Card } from "@/components/ui/card"

interface SeasonListProps {
  tvId: number;
  seasons: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    air_date: string;
    poster_path: string | null;
  }[];
}

export const SeasonList: React.FC<SeasonListProps> = ({ tvId, seasons }) => {
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { 
    isEpisodeWatched, 
    markEpisodeAsWatched, 
    markEpisodeAsUnwatched,
    markSeasonAsWatched,
    markSeasonAsUnwatched,
    getSeasonProgress
  } = useStore();

  const handleSeasonToggle = async (e: React.MouseEvent, seasonNumber: number, totalEpisodes: number) => {
    e.stopPropagation(); // Prevent expanding/collapsing
    
    const { watchedCount } = getSeasonProgress(tvId, seasonNumber);
    const isFullyWatched = watchedCount === totalEpisodes && totalEpisodes > 0;

    if (isFullyWatched) {
      markSeasonAsUnwatched(tvId, seasonNumber);
    } else {
      try {
        let seasonEpisodes = episodes;
        // If episodes are not loaded or belong to a different season, fetch them
        if (expandedSeason !== seasonNumber || episodes.length === 0) {
           const data = await tmdb.getSeasonDetails(tvId, seasonNumber);
           seasonEpisodes = data.episodes;
        }
        
        markSeasonAsWatched(tvId, seasonNumber, seasonEpisodes);
      } catch (error) {
        console.error('Error fetching season details:', error);
        toast.error('Erro ao marcar temporada como assistida / não assistida');
      }
    }
  };

  const handleExpandSeason = async (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null);
      return;
    }

    setExpandedSeason(seasonNumber);
    setLoading(true);
    try {
      const data = await tmdb.getSeasonDetails(tvId, seasonNumber);
      setEpisodes(data.episodes);
    } catch (error) {
      console.error('Error fetching episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEpisodeWatched = (episode: Episode) => {
    if (isEpisodeWatched(tvId, episode.id)) {
      markEpisodeAsUnwatched(tvId, episode.id);
    } else {
      markEpisodeAsWatched(tvId, episode.id, episode.season_number, episode.episode_number);
    }
  };

  // Filter out season 0 (Specials) if desired, or keep it. Usually season 0 is specials.
  const sortedSeasons = [...seasons].sort((a, b) => a.season_number - b.season_number);

  // Component to show progress for a season
  const SeasonProgress: React.FC<{ seasonNumber: number; totalEpisodes: number }> = ({ seasonNumber, totalEpisodes }) => {
    const progress = useSeasonProgress(tvId, seasonNumber, totalEpisodes);
    
    if (progress.watchedCount === 0) return null;
    
    const progressPercentage = totalEpisodes > 0 ? (progress.watchedCount / totalEpisodes) * 100 : 0;
    // Shadcn Progress doesn't support custom colors easily via props, using default primary color.
    // If needed, we can use utility classes or inline styles on the indicator if exposed, 
    // but standard Shadcn Progress is clean.
    
    return (
      <div className="flex items-center gap-2 text-xs w-full max-w-[200px]">
        <span className="text-muted-foreground whitespace-nowrap">{progress.watchedCount}/{totalEpisodes}</span>
        <Progress value={progressPercentage} className="h-1.5" />
      </div>
    );
  };

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-xl font-bold mb-4">Temporadas</h2>
      <div className="space-y-2">
        {sortedSeasons.map((season) => (
          <Card key={season.id} className="overflow-hidden border-border bg-card">
            <Collapsible
              open={expandedSeason === season.season_number}
              onOpenChange={() => handleExpandSeason(season.season_number)}
            >
              <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-4 flex-1 cursor-pointer">
                    {season.poster_path ? (
                      <img
                        src={tmdb.getImageUrl(season.poster_path, 'w300')}
                        alt={season.name}
                        className="w-12 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        N/A
                      </div>
                    )}
                    <div className="text-left space-y-1 flex-1">
                      <h3 className="font-semibold text-foreground">{season.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {season.episode_count} episódios • {season.air_date ? new Date(season.air_date).getFullYear() : 'N/A'}
                      </p>
                      <SeasonProgress seasonNumber={season.season_number} totalEpisodes={season.episode_count} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleSeasonToggle(e, season.season_number, season.episode_count)}
                    className={`rounded-full z-10 ${
                      getSeasonProgress(tvId, season.season_number).watchedCount === season.episode_count && season.episode_count > 0
                        ? 'text-green-500 hover:text-green-600 hover:bg-green-500/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={getSeasonProgress(tvId, season.season_number).watchedCount === season.episode_count ? "Marcar como não assistido" : "Marcar como assistido"}
                  >
                    {getSeasonProgress(tvId, season.season_number).watchedCount === season.episode_count && season.episode_count > 0 ? (
                      <Eye size={20} />
                    ) : (
                      <EyeOff size={20} />
                    )}
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon">
                      {expandedSeason === season.season_number ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <CollapsibleContent>
                <div className="border-t border-border bg-muted/30">
                  {loading ? (
                    <EpisodeListSkeleton />
                  ) : (
                    <div className="divide-y divide-border">
                      {episodes.map((episode) => {
                        const isWatched = isEpisodeWatched(tvId, episode.id);
                        return (
                          <div key={episode.id} className="p-3 md:p-4 hover:bg-accent/50 transition-colors">
                            <div className="flex gap-3 md:gap-4">
                              <div className="relative flex-shrink-0 w-24 md:w-32 aspect-video bg-muted rounded overflow-hidden">
                                {episode.still_path ? (
                                  <img
                                    src={tmdb.getImageUrl(episode.still_path, 'w300')}
                                    alt={episode.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                    Sem imagem
                                  </div>
                                )}
                                <div className="absolute top-1 left-1 bg-black/60 px-1 md:px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-medium text-white">
                                  Ep. {episode.episode_number}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm md:text-base text-foreground truncate pr-2">{episode.name}</h4>
                                    <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground mt-1">
                                      <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {episode.air_date ? new Date(episode.air_date).toLocaleDateString('pt-BR') : 'TBA'}
                                      </span>
                                      <span>•</span>
                                      <span>{episode.vote_average.toFixed(1)} ★</span>
                                    </div>
                                  </div>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleEpisodeWatched(episode)}
                                    className={`rounded-full flex-shrink-0 h-8 w-8 ${
                                      isWatched 
                                        ? 'text-green-500 hover:text-green-600 hover:bg-green-500/10' 
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    title={isWatched ? "Marcar como não assistido" : "Marcar como assistido"}
                                  >
                                    {isWatched ? <Eye size={16} /> : <EyeOff size={16} />}
                                  </Button>
                                </div>
                                
                                <p className="text-xs md:text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {episode.overview || "Sinopse não disponível."}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
};
