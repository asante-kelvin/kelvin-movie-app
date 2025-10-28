/**
 * MovieApp Class for managing TMDB API interactions and UI.
 * This version includes:
 * - Dynamic hero background section
 * - Explore button scroll feature
 * - Functional dynamic navigation (with active state)
 * - Functional movie card click and trailer button binding
 * - Responsive Hamburger Menu Logic
 */

class MovieApp {
    // ==========================
    // TMDB API CONFIGURATION
    // ==========================
    #API_KEY = '2602c1bb2310dbebd7db9ad4ec320981';
    #BASE_URL = 'https://api.themoviedb.org/3';
    #IMG_BASE_URL = 'https://image.tmdb.org/t/p/';
    #POSTER_SIZE = 'w500';
    #DEFAULT_MOVIE_URL = `${this.#BASE_URL}/movie/popular?api_key=${this.#API_KEY}&language=en-US&page=1`;

    // ==========================
    // DOM ELEMENTS
    // ==========================
    constructor() {
        this.DOM = {
            movieContainer: document.getElementById('movie-container'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            movieModal: document.getElementById('movie-modal'),
            modalContent: document.getElementById('modal-content'),
            sectionTitle: document.getElementById('section-title'),
            navLinks: document.getElementById('nav-links'),
            hero: document.getElementById('hero'),
            heroTitle: document.getElementById('hero-title'),
            heroInfo: document.getElementById('hero-info'),
            exploreBtn: document.getElementById('explore-btn'),
            // NEW: Menu icon for mobile toggle
            menuIcon: document.getElementById('menu-icon'),
        };

        this.bindEvents();
        this.init();
    }

    // ==========================
    // INITIALIZATION & EVENTS
    // ==========================
    init() {
        // Loads initial movies and sets 'popular-link' as active on load
        this.loadMovies(this.#DEFAULT_MOVIE_URL, 'Popular Movies');
        this.setHeroBackground();
        const popularLink = document.getElementById('popular-link');
        if (popularLink) {
             popularLink.classList.add('active');
        }
    }

    bindEvents() {
        // Search
        this.DOM.searchBtn.addEventListener('click', () => this.handleSearch());
        this.DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Navigation (event delegation)
        this.DOM.navLinks.addEventListener('click', (e) => this.handleNavigation(e));

        // NEW: Hamburger Menu Toggle
        if (this.DOM.menuIcon) {
            this.DOM.menuIcon.addEventListener('click', () => this.handleMenuToggle());
        }

        // Modal close
        this.DOM.movieModal.addEventListener('click', (e) => {
            // Checks if the click was on the dark background or the close button
            if (e.target === this.DOM.movieModal || e.target.classList.contains('close-btn')) {
                this.closeModal();
            }
        });

        // Explore Button Scroll
        if (this.DOM.exploreBtn) {
            this.DOM.exploreBtn.addEventListener('click', () => {
                this.DOM.movieContainer.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    // ==========================
    // API FETCHING LOGIC
    // ==========================
    async fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('❌ Error fetching data:', error);
            this.DOM.movieContainer.innerHTML = `<p class="error-message">Could not fetch data. Please try again later.</p>`;
            return null;
        }
    }

    async loadMovies(url, title) {
        const data = await this.fetchData(url);
        if (data && data.results) {
            this.DOM.sectionTitle.textContent = title;
            this.renderMovieCards(data.results);
        }
        
        // NEW: Close menu after navigation on mobile
        if (window.innerWidth <= 768 && this.DOM.navLinks.classList.contains('active')) {
             this.handleMenuToggle();
        }
    }

    async setHeroBackground() {
        try {
            const response = await fetch(`${this.#BASE_URL}/movie/popular?api_key=${this.#API_KEY}&language=en-US&page=1`);
            const data = await response.json();
            const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];

            if (randomMovie && randomMovie.backdrop_path) {
                this.DOM.hero.style.backgroundImage = `url(${this.#IMG_BASE_URL}original${randomMovie.backdrop_path})`;
                this.DOM.heroTitle.textContent = randomMovie.title;
                this.DOM.heroInfo.textContent = `${randomMovie.release_date.split('-')[0]} • ⭐ ${randomMovie.vote_average.toFixed(1)}`;
            }
        } catch (error) {
            console.error('❌ Error loading hero background:', error);
        }
    }

    // ==========================
    // UI RENDERING
    // ==========================
    renderMovieCard(movie) {
        const { id, title, poster_path, vote_average } = movie;
        const posterUrl = poster_path
            ? `${this.#IMG_BASE_URL}${this.#POSTER_SIZE}${poster_path}`
            : 'https://via.placeholder.com/200x300?text=No+Poster';

        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.dataset.id = id;
        movieCard.innerHTML = `
          <img src="${posterUrl}" alt="${title}">
          <div class="movie-info">
            <h3>${title}</h3>
            <span class="rating">⭐ ${vote_average ? vote_average.toFixed(1) : 'N/A'}</span>
          </div>
        `;

        // Event listener for card click to open modal
        movieCard.addEventListener('click', () => this.getMovieDetails(id));
        return movieCard;
    }

    renderMovieCards(movies) {
        this.DOM.movieContainer.innerHTML = '';
        if (movies.length === 0) {
            this.DOM.movieContainer.innerHTML = `<p class="error-message">No movies found for this search/category.</p>`;
            return;
        }
        movies.forEach((movie) => this.DOM.movieContainer.appendChild(this.renderMovieCard(movie)));
    }

    // ==========================
    // MODAL LOGIC
    // ==========================
    async getMovieDetails(id) {
        const detailsURL = `${this.#BASE_URL}/movie/${id}?api_key=${this.#API_KEY}&language=en-US`;
        const data = await this.fetchData(detailsURL);

        if (data) {
            this.renderModalContent(data);
            this.DOM.movieModal.style.display = 'flex';

            // Binding the trailer button AFTER the new content is rendered
            const trailerBtn = document.getElementById('trailer-btn');
            if (trailerBtn) trailerBtn.addEventListener('click', () => this.getMovieTrailer(id));
        }
    }

    renderModalContent(data) {
        const posterUrl = data.poster_path
            ? `${this.#IMG_BASE_URL}w780${data.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Poster';

        this.DOM.modalContent.innerHTML = `
          <button class="close-btn">&times;</button>
          <div class="modal-poster">
              <img src="${posterUrl}" alt="${data.title}">
          </div>
          <div class="modal-details">
              <h2>${data.title}</h2>
              <div class="modal-info-bar">
                  <span class="info-item">⭐ ${data.vote_average.toFixed(1)}</span>
                  <span class="info-item">📅 ${data.release_date}</span>
                  <span class="info-item">🎬 ${data.runtime || 'N/A'} min</span>
              </div>
              <p class="tagline">${data.tagline || ''}</p>
              <p class="overview">${data.overview}</p>
              <div class="genres">
                  ${data.genres.map((g) => `<span class="genre-tag">${g.name}</span>`).join('')}
              </div>
              <button id="trailer-btn" class="btn-primary">▶ Watch Trailer</button>
          </div>
        `;
    }

    async getMovieTrailer(id) {
        const trailerURL = `${this.#BASE_URL}/movie/${id}/videos?api_key=${this.#API_KEY}&language=en-US`;
        const data = await this.fetchData(trailerURL);

        if (data && data.results.length > 0) {
            const trailer = data.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube');
            if (trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
            else alert('🚫 No official trailer found.');
        } else {
            alert('🚫 Video data not available.');
        }
    }

    closeModal() {
        this.DOM.movieModal.style.display = 'none';
    }
    
    // ==========================
    // MENU HANDLER (NEW)
    // ==========================
    handleMenuToggle() {
        this.DOM.navLinks.classList.toggle('active');
        this.DOM.menuIcon.classList.toggle('open');
    }

    // ==========================
    // NAVIGATION HANDLERS
    // ==========================
    handleSearch() {
        const query = this.DOM.searchInput.value.trim();
        if (query) {
            const searchURL = `${this.#BASE_URL}/search/movie?api_key=${this.#API_KEY}&query=${encodeURIComponent(query)}`;
            this.loadMovies(searchURL, `Search Results for: "${query}"`);
            this.DOM.searchInput.value = '';
            
            // Remove active class from nav links when searching
            document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
            
            // NEW: Close menu after search on mobile
            if (window.innerWidth <= 768 && this.DOM.navLinks.classList.contains('active')) {
                 this.handleMenuToggle();
            }
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const target = e.target.closest('a');
        if (!target) return;

        let url = this.#DEFAULT_MOVIE_URL;
        let title = 'Popular Movies';

        // Set URL and Title based on ID
        switch (target.id) {
            case 'popular-link':
                url = `${this.#BASE_URL}/movie/popular?api_key=${this.#API_KEY}&language=en-US&page=1`;
                title = 'Popular Movies';
                break;
            case 'top-rated-link':
                url = `${this.#BASE_URL}/movie/top_rated?api_key=${this.#API_KEY}&language=en-US&page=1`;
                title = 'Top Rated Movies';
                break;
            case 'upcoming-link':
                url = `${this.#BASE_URL}/movie/upcoming?api_key=${this.#API_KEY}&language=en-US&page=1`;
                title = 'Upcoming Movies';
                break;
            case 'home-link':
                url = this.#DEFAULT_MOVIE_URL;
                title = 'Popular Movies';
                break;
            default:
                // Prevents accidental reloading if target is not a known link
                return;
        }

        // 1. Load the new data
        this.loadMovies(url, title);

        // 2. Update the active class for visual feedback
        document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
        target.classList.add('active');

        // 3. Smoothly scroll to the movie container
        this.DOM.movieContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
}

// ==========================
// APP START
//==========================
window.addEventListener('load', () => new MovieApp());