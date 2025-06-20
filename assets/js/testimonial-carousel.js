// Simple testimonial carousel logic
document.addEventListener('DOMContentLoaded', function() {
  const testimonialCardsContainer = document.querySelector('.testimonial-cards');
  const leftBtn = document.querySelector('.testimonial-arrow.left');
  const rightBtn = document.querySelector('.testimonial-arrow.right');
  const dotsContainer = document.querySelector('.testimonial-dots');
  let testimonials = [];
  let current = 0;

  // Fetch testimonials from gallery.json
  fetch('images/gallery/gallery.json')
    .then(res => res.json())
    .then(data => {
      // Only use images with both a quote and an author/person
      testimonials = data.images
        .map((img, i) => ({
          img: img.path,
          quote: img.quote || '',
          author: img.author || img.person || '',
          alt: img.alt || '',
          idx: i
        }))
        .filter(t => t.quote && t.author);

      if (testimonials.length === 0) {
        testimonialCardsContainer.innerHTML = '<div class="testimonial no-testimonials active">No testimonials available at this time.</div>';
        dotsContainer.innerHTML = '';
        return;
      }

      // Render testimonial cards
      testimonialCardsContainer.innerHTML = testimonials.map((t, i) => `
        <div class="testimonial${i === 0 ? ' active' : ''}">
          <img class="testimonial-img" src="${t.img}" alt="${t.alt}">
          <div class="testimonial-comment">${t.quote}</div>
          <div class="testimonial-name">— ${t.author}</div>
        </div>
      `).join('');

      // Render dots
      dotsContainer.innerHTML = testimonials.map((t, i) => `
        <span class="testimonial-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>
      `).join('');

      // Set up carousel logic
      const testimonialEls = testimonialCardsContainer.querySelectorAll('.testimonial');
      const dots = dotsContainer.querySelectorAll('.testimonial-dot');

      function updateDots(idx) {
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === idx);
        });
      }
      function showTestimonial(idx) {
        testimonialEls.forEach((t, i) => {
          t.classList.toggle('active', i === idx);
        });
        updateDots(idx);
      }
      leftBtn.addEventListener('click', function() {
        current = (current - 1 + testimonials.length) % testimonials.length;
        showTestimonial(current);
      });
      rightBtn.addEventListener('click', function() {
        current = (current + 1) % testimonials.length;
        showTestimonial(current);
      });
      dots.forEach((dot, i) => {
        dot.addEventListener('click', function() {
          current = i;
          showTestimonial(current);
        });
      });
      // Swipe support
      let startX = null;
      testimonialCardsContainer.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
      });
      testimonialCardsContainer.addEventListener('touchend', function(e) {
        if (startX === null) return;
        let endX = e.changedTouches[0].clientX;
        if (endX - startX > 40) {
          leftBtn.click();
        } else if (startX - endX > 40) {
          rightBtn.click();
        }
        startX = null;
      });
    });
});
