document.addEventListener('DOMContentLoaded', async () => {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  const totalSlots = 30; // Number of slots (images + text)
  const testimonials = [
      { text: "Fantastic craftsmanship!", name: "John Doe", stars: "⭐⭐⭐⭐⭐" },
      { text: "Highly recommend!", name: "Sarah W.", stars: "⭐⭐⭐⭐⭐" },
      { text: "Great attention to detail.", name: "Mark T.", stars: "⭐⭐⭐⭐" }
  ];

  async function fetchGalleryFilenames() {
      try {
          const response = await fetch('images/gallery/gallery.json');
          if (!response.ok) throw new Error(`Failed to fetch gallery.json: ${response.statusText}`);
          return await response.json();
      } catch (error) {
          console.error('Error fetching gallery JSON:', error);
          return [];
      }
  }

  const filenames = await fetchGalleryFilenames();
  if (filenames.length === 0) {
      gallery.innerHTML = "<p>No images found.</p>";
      return;
  }

  filenames.sort(() => Math.random() - 0.5); // Shuffle images

  for (let i = 0; i < totalSlots; i++) {
      const div = document.createElement('div');

      if (Math.random() > 0.7 && testimonials.length > 0) {
          // Add a testimonial
          const testimonial = testimonials.pop();
          div.className = 'text-slot';
          div.innerHTML = `<p>"${testimonial.text}"<br><strong>- ${testimonial.name}</strong><br>${testimonial.stars}</p>`;
      } else {
          // Add an image
          const img = document.createElement('img');
          img.src = `images/gallery/${filenames[i % filenames.length]}`;
          img.alt = `Gallery image ${i + 1}`;
          img.loading = 'lazy';
          div.className = 'image-slot';
          div.appendChild(img);
      }
      
      gallery.appendChild(div);
  }

  // Clone gallery content for infinite scrolling effect
  const clone = gallery.cloneNode(true);
  clone.id = "gallery-clone";
  document.getElementById('gallery-container').appendChild(clone);
});
