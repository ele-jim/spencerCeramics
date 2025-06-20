// Adds a scroll/swipe prompt to page 1 if the user hasn't interacted
(function(){
  // Detect if user has interacted
  let interacted = false;
  function markInteracted() {
    interacted = true;
    const prompt = document.querySelector('.scroll-prompt');
    if (prompt) prompt.style.opacity = 0;
    window.removeEventListener('scroll', markInteracted);
    window.removeEventListener('keydown', markInteracted);
    window.removeEventListener('mousedown', markInteracted);
    window.removeEventListener('touchstart', markInteracted);
    window.removeEventListener('wheel', markInteracted);
  }

  // Create the prompt element
  function createPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'scroll-prompt';
    // Detect mobile
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    prompt.innerHTML = `
      <div class="prompt-text">${isMobile ? 'Swipe up' : 'Scroll down'}</div>
      <div class="prompt-arrow">&#8595;</div>
    `;
    document.querySelector('.wallpaper-container').appendChild(prompt);
  }

  // Only run on page 1
  document.addEventListener('DOMContentLoaded', function() {
    const wallpaperContainer = document.querySelector('.wallpaper-container');
    if (wallpaperContainer) {
      wallpaperContainer.addEventListener('wallpaperReady', function() {
        createPrompt();
        // Hide prompt on any interaction
        // These listeners are safe here as markInteracted checks for prompt existence
        window.addEventListener('scroll', markInteracted);
        window.addEventListener('keydown', markInteracted);
        window.addEventListener('mousedown', markInteracted);
        window.addEventListener('touchstart', markInteracted);
        window.addEventListener('wheel', markInteracted);
      });
    } else {
        // This case should ideally not happen if HTML structure is as expected.
        console.warn('.wallpaper-container not found on DOMContentLoaded for page1-prompt.js. Scroll prompt may not function correctly.');
    }
  });
})();
