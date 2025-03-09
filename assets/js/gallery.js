document.addEventListener('DOMContentLoaded', async () => {
  console.log("gallery.js is running!");

  const gallery = document.getElementById('gallery');
  if (!gallery) {
      console.error("Gallery container not found!");
      return;
  }

  async function fetchGalleryFilenames() {
      try {
          const response = await fetch('images/gallery/gallery.json');
          if (!response.ok) throw new Error(`Failed to fetch gallery.json: ${response.statusText}`);
          
          console.log("Successfully fetched gallery.json");
          return await response.json();
      } catch (error) {
          console.error('Error fetching gallery JSON:', error);
          return [];
      }
  }

  const filenames = await fetchGalleryFilenames();
  console.log("Fetched filenames:", filenames);

  if (filenames.length === 0) {
      console.warn("No images found in gallery.json");
      gallery.innerHTML = "<p>No images found.</p>";
      return;
  }

  filenames.sort(() => Math.random() - 0.5); // Shuffle images

  // **Dynamically Calculate Columns & Rows**
  const isMobile = window.innerWidth < 768;
  const rowCount = 5; // **Always 5 rows**
  const columnCount = isMobile ? 3 : 5; // 3 columns for mobile, 5 for desktop

  const totalImagesNeeded = rowCount * columnCount; // **Ensure exactly enough images**
  while (filenames.length < totalImagesNeeded) {
      filenames.push(...filenames); // **Duplicate images to fill grid if needed**
  }

  gallery.innerHTML = ""; // 🔥 Ensure we clear any old images before adding new ones

  filenames.slice(0, totalImagesNeeded).forEach((file, i) => {
      const div = document.createElement('div');
      div.className = 'image-slot';

      // 🔥 **Ensure images start from row 1**
      const row = Math.floor(i / columnCount) + 1;
      const column = (i % columnCount) + 1;

      div.style.gridRowStart = row;
      div.style.gridColumnStart = column;

      const img = document.createElement('img');
      img.src = `images/gallery/${file}`;
      img.alt = `Gallery image ${i + 1}`;
      img.loading = 'lazy';

      div.appendChild(img);
      gallery.appendChild(div);
  });

  console.log(`Total Images Added: ${gallery.children.length} (Rows: ${rowCount}, Columns: ${columnCount})`);
});
