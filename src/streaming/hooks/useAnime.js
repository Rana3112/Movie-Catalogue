import { useQuery } from '@tanstack/react-query';
import * as anilist from '../api/anilist';

export const useTrendingAnime = () =>
  useQuery({ queryKey: ['anime', 'trending'], queryFn: anilist.getTrendingAnime, staleTime: 1000 * 60 * 10 });

export const usePopularAnime = () =>
  useQuery({ queryKey: ['anime', 'popular'], queryFn: anilist.getPopularAnime, staleTime: 1000 * 60 * 10 });

export const useSeasonalAnime = () =>
  useQuery({ queryKey: ['anime', 'seasonal'], queryFn: anilist.getSeasonalAnime, staleTime: 1000 * 60 * 30 });

export const useAnimeDetail = (id) =>
  useQuery({ queryKey: ['anime', id], queryFn: () => anilist.getAnimeDetail(id), enabled: !!id });
