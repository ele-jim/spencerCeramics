// This script loads image filenames from a JSON file and populates the herringbone gallery.
// Each "tile" (image-slot) will fill its allocated space (the area between grout lines).

document.addEventListener('DOMContentLoaded', async () => {
  const gallery = document.getElementById('gallery');
  const slotSize = 200; // Must match CSS --s

  // Create positions for a 4x4 grid (16 slots)
  const slots = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      slots.push({ x: col * slotSize, y: row * slotSize });
    }
  }

  // Fetch image filenames from the JSON file in /images/gallery
  async function fetchGalleryFilenames() {
    try {
      const response = await fetch('images/gallery/gallery.json');
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    } catch (error) {
      console.error('Error fetching gallery JSON:', error);
      return [];
    }
  }

  // Helper: Wait for an image to load, then add an orientation class and reveal it.
  function handleImageLoad(img) {
    return new Promise(resolve => {
      img.onload = () => {
        if (img.naturalHeight > img.naturalWidth) {
          img.classList.add('portrait');
        } else {
          img.classList.add('landscape');
        }
        img.style.opacity = '1';
        resolve();
      };
    });
  }

  const filenames = await fetchGalleryFilenames();
  if (filenames.length === 0) {
    gallery.innerHTML = "<p>No images found.</p>";
    return;
  }

  // Shuffle the filenames array
  filenames.sort(() => Math.random() - 0.5);

  // For each slot, assign an image (reusing images if necessary)
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const imageFile = filenames[i % filenames.length];

    const slotDiv = document.createElement('div');
    slotDiv.className = 'image-slot';
    // Center the image-slot within its 200px cell by adding a 10px offset
    slotDiv.style.left = `${slot.x + 10}px`;
    slotDiv.style.top = `${slot.y + 10}px`;

    const img = document.createElement('img');
    // Use the folder /images/gallery for the image source
    img.src = `images/gallery/${imageFile}`;
    img.alt = `Gallery image ${i + 1}`;
    img.loading = 'lazy';

    await handleImageLoad(img);

    slotDiv.appendChild(img);
    gallery.appendChild(slotDiv);
  }
});
