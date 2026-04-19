/**
 * Viral Reddit Tracker
 * A real-time dashboard for tracking trending Reddit content
 */

// ===================================
// Configuration & State
// ===================================
const CONFIG = {
    baseUrl: 'https://www.reddit.com',
    corsProxy: 'https://corsproxy.io/?',
    useCorsProxy: true, // Set to false if deploying to production
    postsPerPage: 25,
    imageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    defaultCategory: 'popular',
    defaultSort: 'hot'
};

const state = {
    currentSubreddit: CONFIG.defaultCategory,
    currentSort: CONFIG.defaultSort,
    afterToken: null,
    isLoading: false,
    posts: []
};

// ===================================
// DOM Elements
// ===================================
const elements = {
    postsGrid: document.getElementById('postsGrid'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    retryBtn: document.getElementById('retryBtn'),
    loadMoreContainer: document.getElementById('loadMoreContainer'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    backToTop: document.getElementById('backToTop'),
    navButtons: document.querySelectorAll('.nav-btn'),
    sortButtons: document.querySelectorAll('.sort-btn')
};

// ===================================
// Utility Functions
// ===================================

/**
 * Format large numbers to readable format (e.g., 12500 -> 12.5k)
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
}

/**
 * Format time ago from Unix timestamp
 */
function timeAgo(timestamp) {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);

    const intervals = [
        { label: 'y', seconds: 31536000 },
        { label: 'mo', seconds: 2592000 },
        { label: 'd', seconds: 86400 },
        { label: 'h', seconds: 3600 },
        { label: 'm', seconds: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count}${interval.label} ago`;
        }
    }

    return 'just now';
}

/**
 * Decode HTML entities in text
 */
function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

/**
 * Check if URL is an image
 */
function isImageUrl(url) {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return CONFIG.imageExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * Get clean image URL from Reddit post
 */
function getImageUrl(post) {
    // Check direct URL
    if (isImageUrl(post.url)) {
        return post.url;
    }

    // Check preview images
    if (post.preview?.images?.[0]?.source?.url) {
        return decodeHTML(post.preview.images[0].source.url);
    }

    return null;
}

/**
 * Get video URL from Reddit post
 */
function getVideoUrl(post) {
    // Reddit hosted video
    if (post.is_video && post.media?.reddit_video?.fallback_url) {
        return post.media.reddit_video.fallback_url;
    }

    // Crosspost video
    if (post.crosspost_parent_list?.[0]?.media?.reddit_video?.fallback_url) {
        return post.crosspost_parent_list[0].media.reddit_video.fallback_url;
    }

    return null;
}

/**
 * Get thumbnail URL
 */
function getThumbnailUrl(post) {
    const validThumbnail = post.thumbnail &&
        !['self', 'default', 'nsfw', 'spoiler', ''].includes(post.thumbnail) &&
        post.thumbnail.startsWith('http');

    return validThumbnail ? post.thumbnail : null;
}

// ===================================
// Reddit Post Parser
// ===================================

/**
 * Parse a Reddit post and determine its media type and content
 */
function parseRedditPost(post) {
    const data = post.data;

    // Filter NSFW content
    if (data.over_18) {
        return null;
    }

    const parsed = {
        id: data.id,
        title: decodeHTML(data.title),
        subreddit: data.subreddit_name_prefixed,
        author: data.author,
        score: data.score,
        numComments: data.num_comments,
        createdUtc: data.created_utc,
        permalink: `${CONFIG.baseUrl}${data.permalink}`,
        url: data.url,
        selftext: data.selftext ? decodeHTML(data.selftext).substring(0, 300) : null,
        mediaType: 'text', // default
        mediaUrl: null,
        thumbnailUrl: null,
        isExternal: false
    };

    // Check for video content
    const videoUrl = getVideoUrl(data);
    if (videoUrl) {
        parsed.mediaType = 'video';
        parsed.mediaUrl = videoUrl;
        return parsed;
    }

    // Check for image content
    const imageUrl = getImageUrl(data);
    if (imageUrl) {
        parsed.mediaType = 'image';
        parsed.mediaUrl = imageUrl;
        return parsed;
    }

    // Check for external link with thumbnail
    if (data.url && !data.is_self && !data.url.includes('reddit.com')) {
        parsed.mediaType = 'link';
        parsed.isExternal = true;
        parsed.thumbnailUrl = getThumbnailUrl(data);
    }

    return parsed;
}

// ===================================
// Card Rendering
// ===================================

/**
 * Create media element based on post type
 */
function createMediaElement(post) {
    const container = document.createElement('div');
    container.className = 'post-media';

    switch (post.mediaType) {
        case 'image':
            const img = document.createElement('img');
            img.src = post.mediaUrl;
            img.alt = post.title;
            img.loading = 'lazy';
            img.onerror = () => {
                container.style.display = 'none';
            };
            container.appendChild(img);
            break;

        case 'video':
            const video = document.createElement('video');
            video.src = post.mediaUrl;
            video.controls = true;
            video.muted = true;
            video.preload = 'metadata';
            video.playsInline = true;
            video.onerror = () => {
                container.style.display = 'none';
            };
            container.appendChild(video);
            break;

        case 'link':
            if (post.thumbnailUrl) {
                const thumbImg = document.createElement('img');
                thumbImg.src = post.thumbnailUrl;
                thumbImg.alt = post.title;
                thumbImg.loading = 'lazy';
                thumbImg.onerror = () => {
                    container.innerHTML = '<div class="thumbnail-placeholder">🔗</div>';
                };
                container.appendChild(thumbImg);
            } else {
                container.innerHTML = '<div class="thumbnail-placeholder">🔗</div>';
            }

            const badge = document.createElement('div');
            badge.className = 'external-link-badge';
            badge.innerHTML = '🔗 External Link';
            container.appendChild(badge);
            break;

        default:
            // Text-only post, show placeholder
            if (!post.selftext) {
                container.innerHTML = '<div class="thumbnail-placeholder">📝</div>';
            } else {
                return null; // No media container needed for text posts
            }
    }

    return container;
}

/**
 * Create a post card element
 */
function createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.setAttribute('data-post-id', post.id);

    // Header
    const header = document.createElement('div');
    header.className = 'post-header';
    header.innerHTML = `
        <span class="subreddit-name">${post.subreddit}</span>
        <span class="post-time">${timeAgo(post.createdUtc)}</span>
    `;
    card.appendChild(header);

    // Media
    const mediaElement = createMediaElement(post);
    if (mediaElement) {
        card.appendChild(mediaElement);
    }

    // Body
    const body = document.createElement('div');
    body.className = 'post-body';

    const title = document.createElement('h2');
    title.className = 'post-title';
    title.textContent = post.title;
    body.appendChild(title);

    if (post.selftext && post.mediaType === 'text') {
        const selftext = document.createElement('p');
        selftext.className = 'post-selftext';
        selftext.textContent = post.selftext + (post.selftext.length >= 300 ? '...' : '');
        body.appendChild(selftext);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'post-footer';
    footer.innerHTML = `
        <div class="post-stats">
            <span class="stat upvotes">
                <span class="stat-icon">⬆️</span>
                <span>${formatNumber(post.score)}</span>
            </span>
            <span class="stat comments">
                <span class="stat-icon">💬</span>
                <span>${formatNumber(post.numComments)}</span>
            </span>
        </div>
        <a href="${post.permalink}" target="_blank" rel="noopener noreferrer" class="view-btn">
            View on Reddit →
        </a>
    `;

    body.appendChild(footer);
    card.appendChild(body);

    return card;
}

/**
 * Create skeleton loading cards
 */
function createSkeletonCards(count = 6) {
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton skeleton-media"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
        `;
        fragment.appendChild(skeleton);
    }

    return fragment;
}

// ===================================
// API Functions
// ===================================

/**
 * Fetch posts from Reddit API
 */
async function fetchPosts(subreddit, sort, after = null) {
    const redditUrl = new URL(`${CONFIG.baseUrl}/r/${subreddit}/${sort}.json`);
    redditUrl.searchParams.set('limit', CONFIG.postsPerPage);
    redditUrl.searchParams.set('raw_json', '1');

    if (after) {
        redditUrl.searchParams.set('after', after);
    }

    // Use CORS proxy if enabled (for local development)
    const fetchUrl = CONFIG.useCorsProxy
        ? `${CONFIG.corsProxy}${encodeURIComponent(redditUrl.toString())}`
        : redditUrl.toString();

    const response = await fetch(fetchUrl);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Load posts and render them
 */
async function loadPosts(append = false) {
    if (state.isLoading) return;

    state.isLoading = true;

    // UI Updates
    if (!append) {
        elements.postsGrid.innerHTML = '';
        elements.postsGrid.appendChild(createSkeletonCards());
        elements.loadMoreContainer.style.display = 'none';
    } else {
        elements.loadMoreBtn.disabled = true;
        elements.loadMoreBtn.querySelector('.load-more-text').style.display = 'none';
        elements.loadMoreBtn.querySelector('.load-more-spinner').style.display = 'block';
    }

    elements.loading.style.display = append ? 'none' : 'flex';
    elements.error.style.display = 'none';

    try {
        const data = await fetchPosts(
            state.currentSubreddit,
            state.currentSort,
            append ? state.afterToken : null
        );

        // Update state
        state.afterToken = data.data.after;

        // Parse and filter posts
        const newPosts = data.data.children
            .map(parseRedditPost)
            .filter(post => post !== null);

        if (append) {
            state.posts = [...state.posts, ...newPosts];
        } else {
            state.posts = newPosts;
            elements.postsGrid.innerHTML = '';
        }

        // Render posts
        const fragment = document.createDocumentFragment();
        newPosts.forEach(post => {
            fragment.appendChild(createPostCard(post));
        });
        elements.postsGrid.appendChild(fragment);

        // Show/hide load more button
        elements.loadMoreContainer.style.display = state.afterToken ? 'flex' : 'none';

    } catch (error) {
        console.error('Error fetching posts:', error);

        if (!append) {
            elements.postsGrid.innerHTML = '';
            elements.error.style.display = 'flex';
        } else {
            // Show error toast or alert for load more failures
            alert('Failed to load more posts. Please try again.');
        }
    } finally {
        state.isLoading = false;
        elements.loading.style.display = 'none';

        // Reset load more button
        elements.loadMoreBtn.disabled = false;
        elements.loadMoreBtn.querySelector('.load-more-text').style.display = 'inline';
        elements.loadMoreBtn.querySelector('.load-more-spinner').style.display = 'none';
    }
}

// ===================================
// Event Handlers
// ===================================

/**
 * Handle category navigation click
 */
function handleNavClick(e) {
    const btn = e.target.closest('.nav-btn');
    if (!btn || btn.classList.contains('active')) return;

    // Update active state
    elements.navButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update state and load posts
    state.currentSubreddit = btn.dataset.subreddit;
    state.afterToken = null;
    loadPosts();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Handle sort button click
 */
function handleSortClick(e) {
    const btn = e.target.closest('.sort-btn');
    if (!btn || btn.classList.contains('active')) return;

    // Update active state
    elements.sortButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update state and load posts
    state.currentSort = btn.dataset.sort;
    state.afterToken = null;
    loadPosts();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Handle scroll for back-to-top button visibility
 */
function handleScroll() {
    const scrolled = window.scrollY > 500;
    elements.backToTop.classList.toggle('visible', scrolled);
}

/**
 * Scroll back to top
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================
// Initialization
// ===================================

function init() {
    // Add event listeners
    elements.navButtons.forEach(btn => {
        btn.addEventListener('click', handleNavClick);
    });

    elements.sortButtons.forEach(btn => {
        btn.addEventListener('click', handleSortClick);
    });

    elements.loadMoreBtn.addEventListener('click', () => loadPosts(true));
    elements.retryBtn.addEventListener('click', () => loadPosts());
    elements.backToTop.addEventListener('click', scrollToTop);

    // Scroll listener with throttle
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial load
    loadPosts();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
