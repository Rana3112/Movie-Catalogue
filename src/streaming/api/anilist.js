import axios from 'axios';

const ANILIST_URL = 'https://graphql.anilist.co';

const query = async (gql, variables) => {
  const res = await axios.post(ANILIST_URL, { query: gql, variables });
  return res.data.data;
};

const MEDIA_FRAGMENT = `
  id idMal
  title { romaji english native }
  description(asHtml: false)
  coverImage { large extraLarge color }
  bannerImage
  averageScore popularity episodes status season seasonYear
  genres format
  studios(isMain: true) { nodes { id name } }
  nextAiringEpisode { airingAt episode }
  trailer { id site }
`;

export const ANIME_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

const getCurrentAnimeSeason = () => {
  const now = new Date();
  const month = now.getMonth();
  return {
    season: month < 3 ? 'WINTER' : month < 6 ? 'SPRING' : month < 9 ? 'SUMMER' : 'FALL',
    year: now.getFullYear(),
  };
};

const toPageResult = (page) => ({
  results: page.media || [],
  page: page.pageInfo?.currentPage || 1,
  total_pages: page.pageInfo?.lastPage || 1,
  hasNextPage: Boolean(page.pageInfo?.hasNextPage),
});

export const getTrendingAnime = () =>
  query(`
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `, { page: 1, perPage: 20 }).then(d => d.Page.media);

export const getPopularAnime = () =>
  query(`
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `, { page: 1, perPage: 20 }).then(d => d.Page.media);

export const getSeasonalAnime = () => {
  const { season, year } = getCurrentAnimeSeason();
  return query(`
    query ($season: MediaSeason, $year: Int) {
      Page(page: 1, perPage: 20) {
        media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `, { season, year }).then(d => d.Page.media);
};

export const getAnimeCollectionPage = (collection, page = 1) => {
  if (collection === 'seasonal') {
    const { season, year } = getCurrentAnimeSeason();
    return query(`
      query ($page: Int, $perPage: Int, $season: MediaSeason, $year: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { currentPage lastPage hasNextPage total }
          media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
            ${MEDIA_FRAGMENT}
          }
        }
      }
    `, { page, perPage: 24, season, year }).then(d => toPageResult(d.Page));
  }

  const sort = collection === 'popular' ? 'POPULARITY_DESC' : 'TRENDING_DESC';
  return query(`
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { currentPage lastPage hasNextPage total }
        media(sort: ${sort}, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `, { page, perPage: 24 }).then(d => toPageResult(d.Page));
};

export const getAnimeByGenre = (genre, page = 1) =>
  query(`
    query ($page: Int, $perPage: Int, $genre: String) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { currentPage lastPage hasNextPage total }
        media(genre: $genre, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `, { page, perPage: 24, genre }).then(d => toPageResult(d.Page));

export const getAnimeDetail = (id) =>
  query(`
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FRAGMENT}
      }
    }
  `, { id }).then(d => d.Media);

export const searchAnime = (search) =>
  query(`
    query ($search: String) {
      Page(page: 1, perPage: 15) {
        media(search: $search, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `, { search }).then(d => d.Page.media);
