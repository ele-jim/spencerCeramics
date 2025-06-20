/************************************
 * GLOBALS & HELPER FUNCTIONS
 ************************************/
let globalTestimonialAssignments = {};

function pauseAllRows() {
  document.querySelectorAll('.scroll-track').forEach(track => {
    const computedStyle = window.getComputedStyle(track);
    const matrix = new DOMMatrixReadOnly(computedStyle.transform);
    const currentX = matrix.m41;
    track.style.animation = 'none';
    track.style.transform = `translateX(${currentX}px)`;
    track.dataset.initialOffset = currentX;
  });
}

function resumeAllRows() {
  document.querySelectorAll('.scroll-track').forEach(track => {
    const computedStyle = window.getComputedStyle(track);
    const matrix = new DOMMatrixReadOnly(computedStyle.transform);
    const currentX = matrix.m41;
    track.style.setProperty('--start-offset', `${currentX}px`);
    track.style.animation = 'scrollLeft 30s linear infinite';
  });
}

// Expose these functions globally
window.pauseAllRows = pauseAllRows;
window.resumeAllRows = resumeAllRows;

/************************************
 * MAIN LOGIC
 ************************************/
document.addEventListener('DOMContentLoaded', function() {
  // Load testimonials when the DOM is ready
  fetch('/images/gallery/gallery.json')
    .then(res => res.json())
    .then(data => {
      setupTestimonialCarousel(data.testimonials);
    })
    .catch(error => console.error('Error loading testimonials:', error));
});

/**
 * Sets up the testimonial carousel with horizontal scrolling and arrow navigation
 */
function setupTestimonialCarousel(testimonials) {
  // Get the necessary elements
  const cardsContainer = document.querySelector('#page2 .testimonial-cards');
  const leftArrow = document.querySelector('#page2 .testimonial-arrow.left');
  const rightArrow = document.querySelector('#page2 .testimonial-arrow.right');
  
  if (!cardsContainer) return;
  
  // Clear any existing content
  cardsContainer.innerHTML = '';
  
  // Create the testimonial row container
  const row = document.createElement('div');
  row.className = 'testimonial-row';
  row.style.display = 'flex';
  row.style.flexDirection = 'row';
  row.style.flexWrap = 'nowrap';
  row.style.overflowX = 'auto';
  row.style.scrollBehavior = 'smooth';
  row.style.gap = '20px';
  row.style.padding = '20px';
  row.style.width = '100%';
  row.style.scrollbarWidth = 'none'; // Hide scrollbar in Firefox
  row.style.msOverflowStyle = 'none'; // Hide scrollbar in IE/Edge
  
  // Add testimonial cards
  testimonials.forEach(item => {
    const card = document.createElement('div');
    card.className = 'testimonial-vertical-card';
    card.style.flex = '0 0 auto';
    card.style.width = '280px';
    card.style.margin = '0 15px';
    card.style.padding = '20px';
    card.style.backgroundColor = '#fff';
    card.style.borderRadius = '15px';
    card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.style.textAlign = 'center';
    
    card.innerHTML = `
      <img class="testimonial-img" src="${item.img || '/images/icons/profile-placeholder.svg'}" alt="${item.author}" onerror="this.src='/images/icons/profile-placeholder.svg'" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;">
      <div class="testimonial-comment" style="margin-bottom: 10px; font-style: italic;">${item.quote}</div>
      <div class="testimonial-name" style="font-weight: bold;">${item.author}</div>
    `;
    
    row.appendChild(card);
  });
  
  cardsContainer.appendChild(row);
  
  // Set up arrow navigation if arrows exist
  if (leftArrow && rightArrow) {
    setupArrowNavigation(row, leftArrow, rightArrow);
  }
}



/**
 * Sets up arrow navigation for the testimonial carousel
 */
function setupArrowNavigation(row, leftArrow, rightArrow) {
  // Function to calculate scroll amount based on card width
  const getScrollAmount = () => {
    const card = row.querySelector('div');
    return card ? card.offsetWidth + 20 : 300; // Card width + gap
  };
  
  // Update arrow states based on scroll position
  const updateArrowStates = () => {
    const atStart = row.scrollLeft <= 5;
    const atEnd = row.scrollLeft >= row.scrollWidth - row.clientWidth - 5;
    
    leftArrow.disabled = atStart;
    leftArrow.style.opacity = atStart ? '0.5' : '1';
    
    rightArrow.disabled = atEnd;
    rightArrow.style.opacity = atEnd ? '0.5' : '1';
  };
  
  // Set up click handlers for arrows
  leftArrow.addEventListener('click', () => {
    row.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    setTimeout(updateArrowStates, 500);
  });
  
  rightArrow.addEventListener('click', () => {
    row.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    setTimeout(updateArrowStates, 500);
  });
  
  // Update arrow states on scroll
  row.addEventListener('scroll', updateArrowStates);
  
  // Initialize arrow states
  updateArrowStates();
  
  // Add touch swipe support
  let startX = null;
  let startScrollLeft = 0;
  
  row.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startScrollLeft = row.scrollLeft;
    row.style.scrollBehavior = 'auto';
  }, { passive: true });
  
  row.addEventListener('touchmove', (e) => {
    if (!startX) return;
    const x = e.touches[0].clientX;
    const distance = startX - x;
    row.scrollLeft = startScrollLeft + distance;
  }, { passive: true });
  
  row.addEventListener('touchend', () => {
    startX = null;
    row.style.scrollBehavior = 'smooth';
    updateArrowStates();
  }, { passive: true });
}
