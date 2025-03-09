// Function to initialize the modal viewer
function initializeModalViewer(options = {}) {
    // Create the modal element
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

    // Click-to-close functionality for the modal
    modal.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.innerHTML = ''; // Clear modal content
        if (typeof resumeAllRows === 'function') {
            resumeAllRows();
        }
    });

    // Only target images in the gallery folder (assuming relative path "images/gallery/")
    const imageSelector = options.imageSelector || 'img[src^="images/gallery/"]';
    const images = document.querySelectorAll(imageSelector);

    images.forEach((img) => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            if (typeof pauseAllRows === 'function') {
                pauseAllRows();
            }
            modal.innerHTML = `<img src="${img.src}" alt="${img.alt}" style="max-width: 90%; max-height: 90vh; object-fit: contain;">`;
            modal.style.display = 'flex';
        });
    });
}

// Automatically initialize modal viewer on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeModalViewer();
});
