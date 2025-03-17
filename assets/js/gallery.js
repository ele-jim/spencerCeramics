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
 * PATTERN-BASED TESTIMONIAL ASSIGNMENT
 ************************************/

/**
 * Revised pattern:
 *   rowPattern = [1, 3, 2, 3]
 *   colStepPattern = [1, 2, 1, 2]
 *
 * - Start at column=0.
 * - For each testimonial i:
 *     row = rowPattern[i % rowPattern.length]
 *     place testimonial at (row, currentCol)
 *     currentCol += colStepPattern[i % colStepPattern.length]
 *     if currentCol > 4 => stop.
 */
function assignTestimonialsPattern(galleryData) {
  const rowPattern = [1, 3, 2, 3];     // shifted each row up by 1
  const colStepPattern = [1, 2, 1, 2];
  let currentCol = 0;

  // Prepare row assignments for all 5 rows (0..4)
  const rowAssignments = { 0: [], 1: [], 2: [], 3: [], 4: [] };

  // Go through each testimonial in the order they appear in the JSON
  for (let i = 0; i < galleryData.testimonials.length; i++) {
    const row = rowPattern[i % rowPattern.length];
    // Place testimonial at (row, currentCol)
    rowAssignments[row].push({
      testimonial: galleryData.testimonials[i],
      position: currentCol
    });

    // Move the column index by the next step
    currentCol += colStepPattern[i % colStepPattern.length];

    // If we've exceeded the total columns (4 is max), stop placing more
    if (currentCol > 4) {
      console.warn(`Column index exceeded (max is 4). Stopping at testimonial #${i+1}.`);
      break;
    }
  }
  return rowAssignments;
}

/************************************
 * MAIN LOGIC
 ************************************/
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

      const rowCount = 5;     // total rows (0..4)
      const itemsPerRow = 5;  // columns (0..4)

      // Apply our updated pattern-based assignment
      globalTestimonialAssignments = assignTestimonialsPattern(data);

      buildGallery(data, rowCount, itemsPerRow);
      initializeManualDrag();

      // Wait until images load before calling setStaggeredStart
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

  /**
   * Build the gallery by creating 5 rows, each with 5 items.
   * If testimonials have been assigned to a row, splice them in.
   */
  function buildGallery(galleryData, rowCount, itemsPerRow) {
    for (let i = 0; i < rowCount; i++) {
      const row = document.createElement('div');
      row.className = 'scroll-row';
      row.dataset.rowIndex = i;
      
      const track = document.createElement('div');
      track.className = 'scroll-track';
      
      const rowItems = getImagesForRow(galleryData, i, itemsPerRow);
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

  /**
   * Build an array of 5 image objects for this row,
   * then splice in any assigned testimonials at the right columns.
   */
  function getImagesForRow(galleryData, rowIndex, itemsPerRow) {
    const { images } = galleryData;
    let rowItems = [];
    const startIdx = (rowIndex * itemsPerRow) % images.length;
    for (let i = 0; i < itemsPerRow; i++) {
      const imageIndex = (startIdx + i) % images.length;
      rowItems.push(images[imageIndex]);
    }
    // Insert testimonials (if any) for this row
    if (globalTestimonialAssignments[rowIndex]) {
      globalTestimonialAssignments[rowIndex].forEach(assignment => {
        rowItems.splice(assignment.position, 1, {
          type: 'testimonial',
          ...assignment.testimonial
        });
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
        const itemWidth = firstItem.offsetWidth + 10; 
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

  // Helper to wrap an offset in [-d, 0] for continuous scrolling
  function wrapOffset(offset, d) {
    return ((offset % d) + d) % d - d;
  }

  // Manual drag logic, unchanged
  function initializeManualDrag() {
    const container = document.querySelector('.scroll-container');
    let startX = 0, isDragging = false, resumeTimeout;
    
    const dragStart = (pageX) => {
      clearTimeout(resumeTimeout);
      pauseAllRows();
      isDragging = true;
      startX = pageX;
    };
    
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
    
    const endDrag = () => {
      if (isDragging) {
        isDragging = false;
        resumeTimeout = setTimeout(() => resumeAllRows(), 2000);
      }
    };
    
    container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragStart(e.pageX);
    });
    container.addEventListener('mousemove', (e) => {
      dragMove(e.pageX);
    });
    container.addEventListener('mouseup', endDrag);
    container.addEventListener('mouseleave', endDrag);
    
    container.addEventListener('touchstart', (e) => {
      dragStart(e.touches[0].pageX);
    });
    container.addEventListener('touchmove', (e) => {
      dragMove(e.touches[0].pageX);
    });
    container.addEventListener('touchend', endDrag);
    
    container.addEventListener('wheel', (e) => {
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
        track.dataset.initialOffset = newOffset;
      });
      resumeTimeout = setTimeout(() => resumeAllRows(), 2000);
    }, { passive: false });
  }
});
