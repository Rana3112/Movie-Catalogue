import { useQuery } from '@tanstack/react-query';
import { searchMovies, searchTV } from '../api/tmdb';
import { searchAnime } from '../api/anilist';

export const useUnifiedSearch = (query, enabled) => {
  const movies = useQuery({
    queryKey: ['search', 'movies', query],
    queryFn: () => searchMovies(query),
    enabled: enabled && query.length > 1,
    staleTime: 1000 * 60 * 5,
  });

  const tv = useQuery({
    queryKey: ['search', 'tv', query],
    queryFn: () => searchTV(query),
    enabled: enabled && query.length > 1,
    staleTime: 1000 * 60 * 5,
  });

  const anime = useQuery({
    queryKey: ['search', 'anime', query],
    queryFn: () => searchAnime(query),
    enabled: enabled && query.length > 1,
    staleTime: 1000 * 60 * 5,
  });

  return {
    movies: movies.data ?? [],
    tvShows: tv.data ?? [],
    anime: anime.data ?? [],
    isLoading: movies.isLoading || tv.isLoading || anime.isLoading,
  };
};
