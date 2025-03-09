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
  
  // Attach manual drag listeners on each row
  function initializeManualDrag() {
    const rows = document.querySelectorAll('.scroll-row');
    rows.forEach(row => {
      let startX = 0, initialOffset = 0, isDragging = false;
      const track = row.querySelector('.scroll-track');
      
      row.addEventListener('mousedown', (e) => {
        e.preventDefault();
        pauseAllRows();
        isDragging = true;
        startX = e.pageX;
        const computedStyle = window.getComputedStyle(track);
        const matrix = new DOMMatrixReadOnly(computedStyle.transform);
        initialOffset = matrix.m41;
      });
      
      row.addEventListener('touchstart', (e) => {
        pauseAllRows();
        isDragging = true;
        startX = e.touches[0].pageX;
        const computedStyle = window.getComputedStyle(track);
        const matrix = new DOMMatrixReadOnly(computedStyle.transform);
        initialOffset = matrix.m41;
      });
      
      row.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const delta = e.pageX - startX;
        track.style.transform = `translateX(${initialOffset + delta}px)`;
      });
      
      row.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const delta = e.touches[0].pageX - startX;
        track.style.transform = `translateX(${initialOffset + delta}px)`;
      });
      
      row.addEventListener('mouseleave', () => {
        if (isDragging) {
          isDragging = false;
          setTimeout(() => resumeAllRows(), 2000);
        }
      });
      
      row.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          setTimeout(() => resumeAllRows(), 2000);
        }
      });
      
      row.addEventListener('touchend', () => {
        if (isDragging) {
          isDragging = false;
          setTimeout(() => resumeAllRows(), 2000);
        }
      });
    });
  }
});
