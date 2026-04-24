import { useQuery } from '@tanstack/react-query';
import * as tmdb from '../api/tmdb';

export const useTrendingMovies = () =>
  useQuery({ queryKey: ['movies', 'trending'], queryFn: tmdb.getTrendingMovies, staleTime: 1000 * 60 * 10 });

export const usePopularMovies = () =>
  useQuery({ queryKey: ['movies', 'popular'], queryFn: tmdb.getPopularMovies, staleTime: 1000 * 60 * 10 });

export const useTopRatedMovies = () =>
  useQuery({ queryKey: ['movies', 'topRated'], queryFn: tmdb.getTopRatedMovies, staleTime: 1000 * 60 * 10 });

export const useMovieDetail = (id) =>
  useQuery({ queryKey: ['movie', id], queryFn: () => tmdb.getMovieDetail(id), enabled: !!id });
