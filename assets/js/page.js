// Global object to record testimonial positions (for staggering testimonials)
const testimonialPositions = {};

// Global helper functions to pause/resume all rows
function pauseAllRows() {
  document.querySelectorAll('.scroll-track').forEach(track => {
    const computedStyle = window.getComputedStyle(track);
    const matrix = new DOMMatrixReadOnly(computedStyle.transform);
    const currentX = matrix.m41;
    track.style.animation = 'none';
    track.style.transform = `translateX(${currentX}px)`;
    // Save the current offset for use during manual dragging/wheeling
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

// Expose these functions globally for clickable-image.js to use
window.pauseAllRows = pauseAllRows;
window.resumeAllRows = resumeAllRows;

document.addEventListener('DOMContentLoaded', function() {
  const scrollContainer = document.querySelector('.scroll-container');
  scrollContainer.innerHTML = '<div class="loading-indicator">Loading gallery...</div>';
  
  fetch('/images/gallery/gallery.json')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      scrollContainer.innerHTML = '';
      buildGallery(data);
      initializeManualDrag();
      
      const imagesLoaded = new Promise(resolve => {
        const images = document.querySelectorAll('.scroll-item img');
        let loadedCount = 0;
        if (images.length === 0) { resolve(); return; }
        images.forEach(img => {
          if (img.complete) {
            loadedCount++;
            if (loadedCount === images.length) resolve();
          } else {
            img.addEventListener('load', () => {
              loadedCount++;
              if (loadedCount === images.length) resolve();
            });
            img.addEventListener('error', () => {
              loadedCount++;
              if (loadedCount === images.length) resolve();
            });
          }
        });
      });
      imagesLoaded.then(setStaggeredStart);
    })
    .catch(error => {
      console.error('Error loading gallery data:', error);
      scrollContainer.innerHTML = '<div class="loading-indicator">Error loading gallery. Please try again later.</div>';
    });
  
  function buildGallery(galleryData) {
    const rowCount = 5;
    for (let i = 0; i < rowCount; i++) {
      const row = document.createElement('div');
      row.className = 'scroll-row';
      row.dataset.rowIndex = i;
      
      const track = document.createElement('div');
      track.className = 'scroll-track';
      
      const rowItems = getImagesForRow(galleryData, i);
      rowItems.forEach(item => {
        if (item.type === 'testimonial') {
          const testimonial = document.createElement('div');
          testimonial.className = 'testimonial';
          testimonial.innerHTML = `
            <p>"${item.quote}"</p>
            <p>- ${item.author}</p>
            <div class="testimonial-stars">${generateStars(item.rating)}</div>
          `;
          track.appendChild(testimonial);
        } else {
          const imageItem = document.createElement('div');
          imageItem.className = 'scroll-item';
          const img = document.createElement('img');
          img.src = item.path;
          img.alt = item.alt || 'Gallery image';
          imageItem.appendChild(img);
          track.appendChild(imageItem);
        }
      });
      
      // Duplicate for seamless looping
      track.innerHTML += track.innerHTML;
      row.appendChild(track);
      scrollContainer.appendChild(row);
    }
  }
  
  function getImagesForRow(galleryData, rowIndex) {
    const { images, testimonials } = galleryData;
    const itemsPerRow = 5;
    let rowItems = [];
    const startIdx = (rowIndex * itemsPerRow) % images.length;
    for (let i = 0; i < itemsPerRow; i++) {
      const imageIndex = (startIdx + i) % images.length;
      rowItems.push(images[imageIndex]);
    }
    if (testimonials && testimonials.length > 0 && rowIndex % 2 === 0) {
      let availablePositions = [];
      for (let pos = 1; pos < itemsPerRow - 1; pos++) {
        availablePositions.push(pos);
      }
      if (testimonialPositions[rowIndex - 2] !== undefined) {
        availablePositions = availablePositions.filter(pos => pos !== testimonialPositions[rowIndex - 2]);
      }
      const chosenPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      testimonialPositions[rowIndex] = chosenPos;
      rowItems.splice(chosenPos, 1, {
        type: 'testimonial',
        ...testimonials[rowIndex % testimonials.length]
      });
    }
    return rowItems;
  }
  
  function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (halfStar) stars += '☆';
    for (let i = 0; i < emptyStars; i++) stars += '☆';
    return stars;
  }
  
  function setStaggeredStart() {
    const tracks = document.querySelectorAll('.scroll-row .scroll-track');
    tracks.forEach(track => {
      const rowIndex = parseInt(track.parentElement.dataset.rowIndex);
      const firstItem = track.querySelector('.scroll-item, .testimonial');
      if (firstItem) {
        const itemWidth = firstItem.offsetWidth + 10; // margin adjustment: 0 5px each side
        if (rowIndex % 2 === 1) {
          track.style.setProperty('--start-offset', `-${itemWidth / 2}px`);
        } else {
          track.style.setProperty('--start-offset', `0px`);
        }
      }
      const scrollDistance = track.scrollWidth / 2;
      track.style.setProperty('--scroll-distance', `${scrollDistance}px`);
    });
  }
  
  // Helper function to wrap an offset within the continuous range ([-d, 0])
  function wrapOffset(offset, d) {
    // Adjust for negative modulo results.
    return ((offset % d) + d) % d - d;
  }
  
  // Updated manual drag for the whole container with continuous scrolling
  // and allowing vertical scroll events (when vertical delta is dominant)
  function initializeManualDrag() {
    const container = document.querySelector('.scroll-container');
    let startX = 0, isDragging = false, resumeTimeout;
    
    // When drag starts, pause auto scrolling and record initial offsets
    const dragStart = (pageX) => {
      clearTimeout(resumeTimeout);
      pauseAllRows();
      isDragging = true;
      startX = pageX;
    };
    
    // On drag move, update all tracks based on the delta and wrap the offset
    const dragMove = (pageX) => {
      if (!isDragging) return;
      const delta = pageX - startX;
      document.querySelectorAll('.scroll-track').forEach(track => {
        const initialOffset = parseFloat(track.dataset.initialOffset) || 0;
        const scrollDistance = track.scrollWidth / 2;
        let newOffset = initialOffset + delta;
        newOffset = wrapOffset(newOffset, scrollDistance);
        track.style.transform = `translateX(${newOffset}px)`;
      });
    };
    
    // End drag and resume auto scrolling after 2 seconds
    const endDrag = () => {
      if (isDragging) {
        isDragging = false;
        resumeTimeout = setTimeout(() => resumeAllRows(), 2000);
      }
    };
    
    // Mouse events
    container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragStart(e.pageX);
    });
    container.addEventListener('mousemove', (e) => {
      dragMove(e.pageX);
    });
    container.addEventListener('mouseup', endDrag);
    container.addEventListener('mouseleave', endDrag);
    
    // Touch events
    container.addEventListener('touchstart', (e) => {
      dragStart(e.touches[0].pageX);
    });
    container.addEventListener('touchmove', (e) => {
      dragMove(e.touches[0].pageX);
    });
    container.addEventListener('touchend', endDrag);
    
    // Wheel events for horizontal scrolling:
    // Only intercept if horizontal delta is larger than vertical delta.
    container.addEventListener('wheel', (e) => {
      // If vertical scroll is dominant, let the event pass for page.js vertical scroll.
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        return;
      }
      
      e.preventDefault();
      clearTimeout(resumeTimeout);
      pauseAllRows();
      
      document.querySelectorAll('.scroll-track').forEach(track => {
        const initialOffset = parseFloat(track.dataset.initialOffset) || 0;
        const scrollDistance = track.scrollWidth / 2;
        let newOffset = initialOffset - e.deltaX;
        newOffset = wrapOffset(newOffset, scrollDistance);
        track.style.transform = `translateX(${newOffset}px)`;
        // Update dataset so subsequent interactions use the new offset
        track.dataset.initialOffset = newOffset;
      });
      
      resumeTimeout = setTimeout(() => resumeAllRows(), 2000);
    });
  }
});
