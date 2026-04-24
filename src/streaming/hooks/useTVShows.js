import { useQuery } from '@tanstack/react-query';
import * as tmdb from '../api/tmdb';

export const useTrendingTV = () =>
  useQuery({ queryKey: ['tv', 'trending'], queryFn: tmdb.getTrendingTV, staleTime: 1000 * 60 * 10 });

export const usePopularTV = () =>
  useQuery({ queryKey: ['tv', 'popular'], queryFn: tmdb.getPopularTV, staleTime: 1000 * 60 * 10 });

export const useTVDetail = (id) =>
  useQuery({ queryKey: ['tv', id], queryFn: () => tmdb.getTVDetail(id), enabled: !!id });

export const useTVEpisodes = (tvId, season) =>
  useQuery({
    queryKey: ['tv', tvId, 'season', season],
    queryFn: () => tmdb.getTVSeasonEpisodes(tvId, season),
    enabled: !!tvId && !!season,
  });
