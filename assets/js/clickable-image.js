(function(){
    // Create the modal element and add it to the document.
    const modal = document.createElement('div');
    modal.id = 'modal-viewer';
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      cursor: pointer;
      justify-content: center;
      align-items: center;
    `;
    document.body.appendChild(modal);
    
    // Click-to-close functionality for the modal.
    modal.addEventListener('click', () => {
      modal.style.display = 'none';
      modal.innerHTML = ''; // Clear modal content.
      if (typeof resumeAllRows === 'function') {
        resumeAllRows();
      }
    });
    
    // Event delegation: Listen for clicks anywhere on the document.
    document.addEventListener('click', (e) => {
      const target = e.target;
      // Check if the clicked element is an image in the gallery folder.
      if (target.tagName.toLowerCase() === 'img' && target.src.includes('images/gallery/')) {
        // Prevent any other click actions.
        e.stopPropagation();
        // Pause the auto-scroll if available.
        if (typeof pauseAllRows === 'function') {
          pauseAllRows();
        }
        // Display the modal with the clicked image.
        modal.innerHTML = `<img src="${target.src}" alt="${target.alt}" style="max-width: 90%; max-height: 90vh; object-fit: contain;">`;
        modal.style.display = 'flex';
      }
    });
  })();
  