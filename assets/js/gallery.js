document.addEventListener('DOMContentLoaded', function() {
  // Fetch the gallery JSON data
  fetch('/images/gallery/gallery.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Build the gallery with the JSON data
      buildGallery(data);
      
      // Initialize scrolling behavior after gallery is built
      initializeScrollBehavior();
      
      // Set staggered start positions after images load
      setTimeout(setStaggeredStart, 100);
    })
    .catch(error => {
      console.error('There was a problem fetching the gallery data:', error);
    });
  
  function buildGallery(galleryData) {
    const scrollContainer = document.querySelector('.scroll-container');
    scrollContainer.innerHTML = ''; // Clear any placeholder content
    
    // Create the specified number of rows
    const rowCount = 5; // Adjust as needed
    
    for (let i = 0; i < rowCount; i++) {
      // Create a row
      const row = document.createElement('div');
      row.className = 'scroll-row';
      
      // Determine direction based on row index
      const isEven = i % 2 === 1;
      
      // Get a subset of images for this row
      const rowImages = getImagesForRow(galleryData, i, isEven);
      
      // Add images to the row
      rowImages.forEach(item => {
        if (item.type === 'testimonial') {
          // Create testimonial
          const testimonial = document.createElement('div');
          testimonial.className = 'testimonial';
          testimonial.innerHTML = `
            <p>"${item.quote}"</p>
            <p>- ${item.author}</p>
            <div class="testimonial-stars">${generateStars(item.rating)}</div>
          `;
          row.appendChild(testimonial);
        } else {
          // Create image item
          const imageItem = document.createElement('div');
          imageItem.className = 'scroll-item';
          
          const img = document.createElement('img');
          img.src = item.path;
          img.alt = item.alt || 'Gallery image';
          
          imageItem.appendChild(img);
          row.appendChild(imageItem);
        }
      });
      
      // Add duplicate items for seamless scrolling
      const originalItems = Array.from(row.children);
      originalItems.forEach(item => {
        const clone = item.cloneNode(true);
        row.appendChild(clone);
      });
      
      scrollContainer.appendChild(row);
    }
  }
  
  function getImagesForRow(galleryData, rowIndex, isEven) {
    const { images, testimonials } = galleryData;
    const itemsPerRow = 5; // Adjust as needed
    
    // Create a mix of images and possibly testimonials
    let rowItems = [];
    
    // Use different sections of the images array for different rows
    const startIdx = (rowIndex * itemsPerRow) % images.length;
    
    for (let i = 0; i < itemsPerRow; i++) {
      const imageIndex = (startIdx + i) % images.length;
      rowItems.push(images[imageIndex]);
    }
    
    // Add testimonials with spacing constraints (not adjacent)
    if (testimonials && testimonials.length > 0) {
      // Only add testimonial to some rows
      if (rowIndex % 2 === 0 && rowIndex < testimonials.length) {
        // Place testimonial at a random position that's not at the edge
        const position = Math.floor(Math.random() * (itemsPerRow - 2)) + 1;
        
        // Remove the image at this position and insert testimonial
        rowItems.splice(position, 1, {
          type: 'testimonial',
          ...testimonials[rowIndex % testimonials.length]
        });
      }
    }
    
    // For even rows, reverse the order to create visual variety
    return isEven ? rowItems.reverse() : rowItems;
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
  
  function initializeScrollBehavior() {
    const scrollRows = document.querySelectorAll('.scroll-row');
    
    // Handle manual scrolling
    scrollRows.forEach(row => {
      let pauseTimer;
      let isDragging = false;
      let startX;
      let scrollLeft;
      
      // Start dragging
      row.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - row.offsetLeft;
        scrollLeft = row.scrollLeft;
        row.classList.add('paused');
        clearTimeout(pauseTimer);
      });
      
      // Stop dragging
      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          
          // Resume animation after 2 seconds
          pauseTimer = setTimeout(() => {
            row.classList.remove('paused');
          }, 2000);
        }
      });
      
      // Handle dragging motion
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - row.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        row.scrollLeft = scrollLeft - walk;
      });
      
      // Handle touch events for mobile
      row.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].pageX - row.offsetLeft;
        scrollLeft = row.scrollLeft;
        row.classList.add('paused');
        clearTimeout(pauseTimer);
      });
      
      window.addEventListener('touchend', () => {
        if (isDragging) {
          isDragging = false;
          
          // Resume animation after 2 seconds
          pauseTimer = setTimeout(() => {
            row.classList.remove('paused');
          }, 2000);
        }
      });
      
      window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const x = e.touches[0].pageX - row.offsetLeft;
        const walk = (x - startX) * 2;
        row.scrollLeft = scrollLeft - walk;
      });
    });
  }
  
  function setStaggeredStart() {
    const oddRows = document.querySelectorAll('.scroll-row:nth-child(odd)');
    const evenRows = document.querySelectorAll('.scroll-row:nth-child(even)');
    
    // For odd rows (1, 3, 5), start with half an image off-screen
    oddRows.forEach(row => {
      // Calculate width of first image + margin
      const firstItem = row.querySelector('.scroll-item');
      if (firstItem) {
        const itemWidth = firstItem.offsetWidth + 20; // 20px for margins
        row.style.transform = `translateX(-${itemWidth / 2}px)`;
      }
    });
    
    // For even rows (2, 4), start from the middle of sequence
    evenRows.forEach(row => {
      if (row.scrollWidth > row.clientWidth) {
        row.style.transform = `translateX(-${row.scrollWidth / 4}px)`;
      }
    });
  }
});