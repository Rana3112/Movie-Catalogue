import { Route } from 'react-router-dom';
import StreamingHome from './pages/StreamingHome';
import MovieDetail from './pages/MovieDetail';
import TVDetail from './pages/TVDetail';
import AnimeDetail from './pages/AnimeDetail';
import PlayerPage from './pages/PlayerPage';
import SearchPage from './pages/SearchPage';
import StreamingListPage from './pages/StreamingListPage';
import GenresPage from './pages/GenresPage';

export const StreamingRoutes = (
  <>
    <Route path="/streaming" element={<StreamingHome />} />
    <Route path="/streaming/movie/:id" element={<MovieDetail />} />
    <Route path="/streaming/tv/:id" element={<TVDetail />} />
    <Route path="/streaming/anime/:id" element={<AnimeDetail />} />
    <Route path="/streaming/player" element={<PlayerPage />} />
    <Route path="/streaming/search" element={<SearchPage />} />
    <Route path="/streaming/list/:category/:collection" element={<StreamingListPage />} />
    <Route path="/streaming/genres" element={<GenresPage />} />
  </>
);
