// Theme logic: set theme as early as possible
(function() {
  const userTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (userTheme === 'dark' || (!userTheme && systemPrefersDark)) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
})();

document.addEventListener('DOMContentLoaded', function() {
  // All your previous JS code from <script> in index.html goes here
  const API_KEY = '8775a144-93d5-4737-bcb1-f7bf4d5cc6ef'; // Your newsapi.ai API key
  const newsContainer = document.getElementById('news');
  const regionsContainer = document.getElementById('regions');
  const newsSearch = document.getElementById('news-search');
  const regionSearch = document.getElementById('region-search');
  const newsError = document.getElementById('news-error');
  const regionError = document.getElementById('region-error');
  const errorDiv = document.getElementById('error');
  const loadingDiv = document.getElementById('loading');
  const tabNews = document.getElementById('tab-news');
  const tabPokemon = document.getElementById('tab-pokemon');
  const newsSection = document.getElementById('news-section');
  const pokemonSection = document.getElementById('pokemon-section');
  const newsSearchBar = document.getElementById('news-search-bar');
  const regionSearchBar = document.getElementById('region-search-bar');
  const loadMoreNewsBtn = document.getElementById('load-more-news');
  const loadMorePokemonBtn = document.getElementById('load-more-pokemon');
  let news = [];
  let regions = [];
  let newsPage = 1;
  let newsQuery = 'world';
  let newsHasMore = true;
  let pokemonOffset = 0;
  let pokemonHasMore = true;
  let searchingPokemon = false;

  // Mock news data fallback
  const mockNews = [
    { title: "Global Tech Summit 2025 Announced", body: "The annual tech summit will showcase AI innovations and new technologies in 2025.", url: "#", image: "https://via.placeholder.com/300x160?text=Tech+Summit" },
    { title: "New Environmental Policies in Europe", body: "EU introduces stricter emissions regulations to combat climate change.", url: "#", image: "https://via.placeholder.com/300x160?text=Environment" },
    { title: "Space Exploration Milestone Reached", body: "New satellite launched to study distant galaxies and cosmic phenomena.", url: "#", image: "https://via.placeholder.com/300x160?text=Space" },
    { title: "Breakthrough in Renewable Energy", body: "Scientists develop more efficient solar panels for widespread adoption.", url: "#", image: "https://via.placeholder.com/300x160?text=Renewable+Energy" },
    { title: "Global Sports Event Planned for 2026", body: "Major international sports event to promote unity and competition.", url: "#", image: "https://via.placeholder.com/300x160?text=Sports" }
  ];

  // Utility functions
  function showError(message, target = errorDiv) {
    target.textContent = message;
    target.classList.remove('hidden');
  }
  function hideError(target = errorDiv) {
    target.classList.add('hidden');
  }
  function showLoading() {
    loadingDiv.classList.remove('hidden');
  }
  function hideLoading() {
    loadingDiv.classList.add('hidden');
  }
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  async function fetchWithRetry(url, options, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(url, { ...options, timeout: 5000 });
        return response.data;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  function validateSearchInput(query, errorElement) {
    if (!query || query.length < 2) {
      showError('Please enter at least 2 characters to search.', errorElement);
      return false;
    }
    hideError(errorElement);
    return true;
  }

  // Fetch News with pagination
  async function fetchNews(query = 'world', page = 1, append = false) {
    if (!validateSearchInput(query, newsError)) {
      hideLoading();
      return;
    }
    showLoading();
    try {
      const response = await fetchWithRetry('https://eventregistry.org/api/v1/article/getArticles', {
        params: {
          resultType: 'articles',
          keyword: query,
          keywordOper: 'or',
          lang: 'eng',
          articlesSortBy: 'rel',
          apiKey: API_KEY,
          articlesPage: page,
          articlesCount: 9
        }
      });
      if (response.error) throw new Error(response.error);
      const newArticles = response.articles.results
        .filter(article => article.image && article.title && article.body)
        .map(article => ({
          title: article.title,
          body: article.body,
          url: article.url,
          image: article.image
        }));
      if (append) {
        news = news.concat(newArticles);
      } else {
        news = newArticles;
      }
      newsHasMore = newArticles.length === 9;
      displayNews(news);
      loadMoreNewsBtn.classList.toggle('hidden', !newsHasMore);
      hideError();
      hideLoading();
    } catch (error) {
      showError('Failed to fetch news. Displaying mock news data.');
      if (!append) news = mockNews;
      displayNews(news);
      loadMoreNewsBtn.classList.add('hidden');
      hideLoading();
    }
  }
  function displayNews(articles) {
    newsContainer.innerHTML = '';
    if (articles.length === 0) {
      newsContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 dark:text-gray-400">No news articles found.</div>';
      return;
    }
    articles.forEach(article => {
      const card = document.createElement('article');
      card.className = 'news-card animate-fade-in';
      card.innerHTML = `
        <div class="relative">
          <img src="${article.image}" alt="${article.title}" class="w-full h-52 object-cover rounded-t-xl" loading="lazy" />
          <span class="badge absolute top-3 left-3 select-none">NEWS</span>
        </div>
        <div class="p-5 flex flex-col flex-1">
          <h3 class="text-lg font-bold mb-2 line-clamp-2">${article.title}</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow">${article.body ? article.body.slice(0, 120) + '...' : 'No description available.'}</p>
          <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="mt-auto inline-block text-blue-600 dark:text-yellow-300 font-semibold hover:underline transition-colors" aria-label="Read more about ${article.title}">Read More →</a>
        </div>
      `;
      newsContainer.appendChild(card);
    });
  }
  loadMoreNewsBtn.addEventListener('click', () => {
    newsPage++;
    fetchNews(newsQuery, newsPage, true);
  });

  // Fetch Pokémon list with pagination
  async function fetchRegions(offset = 0, append = false) {
    showLoading();
    try {
      const response = await fetchWithRetry('https://pokeapi.co/api/v2/pokemon', {
        params: { limit: 12, offset }
      });
      const pokemonList = response.results;
      const pokemons = await Promise.all(pokemonList.map(async (pokemon) => {
        try {
          const details = await axios.get(pokemon.url, { timeout: 5000 });
          return {
            name: { common: details.data.name.charAt(0).toUpperCase() + details.data.name.slice(1) },
            height: details.data.height,
            weight: details.data.weight,
            types: details.data.types.map(t => t.type.name),
            sprite: details.data.sprites.front_default || 'https://via.placeholder.com/120?text=No+Image'
          };
        } catch {
          return null;
        }
      }));
      const newPokemons = pokemons.filter(p => p);
      if (append) {
        regions = regions.concat(newPokemons);
      } else {
        regions = newPokemons;
      }
      pokemonHasMore = pokemonList.length === 12;
      displayRegions(regions);
      loadMorePokemonBtn.classList.toggle('hidden', !pokemonHasMore && !searchingPokemon);
      hideError();
      hideLoading();
    } catch (error) {
      showError('Failed to fetch Pokémon data. Please check your connection and try again.');
      loadMorePokemonBtn.classList.add('hidden');
      hideLoading();
    }
  }
  function displayRegions(regions) {
    regionsContainer.innerHTML = '';
    if (regions.length === 0) {
      regionsContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 dark:text-gray-400">No Pokémon found.</div>';
      return;
    }
    regions.forEach(region => {
      const card = document.createElement('article');
      card.className = 'region-card animate-fade-in';
      card.innerHTML = `
        <div class="relative w-32 h-32 mx-auto mb-3 rounded-full bg-white shadow-lg overflow-hidden flex items-center justify-center">
          <img src="${region.sprite}" alt="${region.name.common}" class="w-28 h-28 object-contain" loading="lazy" />
          <span class="badge badge-pokemon absolute top-3 left-3 select-none">Pokémon</span>
        </div>
        <h3 class="text-lg font-bold text-center mb-2">${region.name.common}</h3>
        <div class="flex flex-wrap justify-center gap-1 mb-2">
          ${region.types.map(type => `<span class="badge badge-pokemon">${type}</span>`).join('')}
        </div>
        <p class="text-gray-600 dark:text-gray-300 text-sm text-center"><strong>Height:</strong> ${(region.height / 10).toFixed(1)} m</p>
        <p class="text-gray-600 dark:text-gray-300 text-sm text-center"><strong>Weight:</strong> ${(region.weight / 10).toFixed(1)} kg</p>
      `;
      regionsContainer.appendChild(card);
    });
  }
  loadMorePokemonBtn.addEventListener('click', () => {
    pokemonOffset += 12;
    fetchRegions(pokemonOffset, true);
  });

  // Search handlers with debounce
  const debouncedFetchNews = debounce((query) => {
    newsQuery = query || 'world';
    newsPage = 1;
    fetchNews(newsQuery, newsPage, false);
  }, 500);

  newsSearch.addEventListener('input', () => {
    debouncedFetchNews(newsSearch.value.trim());
  });

  const debouncedPokemonSearch = debounce(() => {
    const searchTerm = regionSearch.value.trim();
    if (!searchTerm) {
      searchingPokemon = false;
      pokemonOffset = 0;
      fetchRegions(0, false);
      return;
    }
    if (!validateSearchInput(searchTerm, regionError)) {
      displayRegions([]);
      return;
    }
    searchingPokemon = true;
    showLoading();
    axios.get(`https://pokeapi.co/api/v2/pokemon/${searchTerm.toLowerCase()}`, { timeout: 5000 })
      .then(response => {
        const details = response.data;
        const pokemon = {
          name: { common: details.name.charAt(0).toUpperCase() + details.name.slice(1) },
          height: details.height,
          weight: details.weight,
          types: details.types.map(t => t.type.name),
          sprite: details.sprites.front_default || 'https://via.placeholder.com/120?text=No+Image'
        };
        displayRegions([pokemon]);
        hideError(regionError);
        loadMorePokemonBtn.classList.add('hidden');
      })
      .catch(() => {
        displayRegions([]);
        showError('No Pokémon found with that name.', regionError);
        loadMorePokemonBtn.classList.add('hidden');
      })
      .finally(() => {
        hideLoading();
      });
  }, 400);

  regionSearch.addEventListener('input', debouncedPokemonSearch);

  // Tabs logic with ARIA attributes
  function activateTab(tab) {
    if (tab === 'news') {
      tabNews.classList.add('active');
      tabNews.setAttribute('aria-selected', 'true');
      tabNews.tabIndex = 0;
      tabPokemon.classList.remove('active');
      tabPokemon.setAttribute('aria-selected', 'false');
      tabPokemon.tabIndex = -1;

      newsSection.style.display = '';
      pokemonSection.style.display = 'none';
      newsSearchBar.style.display = '';
      regionSearchBar.style.display = 'none';
      newsSearch.focus();
    } else {
      tabNews.classList.remove('active');
      tabNews.setAttribute('aria-selected', 'false');
      tabNews.tabIndex = -1;
      tabPokemon.classList.add('active');
      tabPokemon.setAttribute('aria-selected', 'true');
      tabPokemon.tabIndex = 0;

      newsSection.style.display = 'none';
      pokemonSection.style.display = '';
      newsSearchBar.style.display = 'none';
      regionSearchBar.style.display = '';
      regionSearch.focus();
    }
  }
  tabNews.addEventListener('click', () => activateTab('news'));
  tabPokemon.addEventListener('click', () => activateTab('pokemon'));

  // Keyboard navigation for tabs
  tabNews.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      tabPokemon.focus();
    }
  });
  tabPokemon.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      tabNews.focus();
    }
  });

  // Dark mode toggle (improved)
  const themeToggle = document.getElementById('theme-toggle');
  const sunIcon = document.getElementById('sun');
  const moonIcon = document.getElementById('moon');
  function updateThemeIconAndLabel() {
    const isDark = document.body.classList.contains('dark');
    sunIcon.classList.toggle('hidden', isDark);
    moonIcon.classList.toggle('hidden', !isDark);
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIconAndLabel();
  });
  // On load, set correct icon/label
  updateThemeIconAndLabel();

  // Initial fetch
  fetchNews();
  fetchRegions();
}); 