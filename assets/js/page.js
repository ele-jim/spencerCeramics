// Immediately update the persistent title (and its color) based on the new title.
function updatePersistentTitle(newTitle) {
  const titleEl = document.getElementById('persistentTitle');
  const currentTitle = titleEl.dataset.currentTitle || "";
  
  // Determine text color: if the new title is "Endorsements" or "Our Work", use white; otherwise, black.
  const newColor = (newTitle === "Endorsements" || newTitle === "Our Work") ? "#fff" : "#262626";
  titleEl.style.color = newColor;
  document.querySelectorAll('.page-menu li').forEach(li => {
    li.style.color = newColor;
  });
  
  // Only update if the title is different.
  if (currentTitle === newTitle) return;
  
  // Immediately update the text and record the new title.
  titleEl.textContent = newTitle;
  titleEl.dataset.currentTitle = newTitle;
}

// Toggle the navigation menu when the persistent title is clicked.
// When the menu is opened, hide the persistent title; when closed, show it.
document.getElementById('persistentTitle').addEventListener('click', function(e) {
  e.stopPropagation();
  const menu = document.getElementById('pageMenu');
  if (menu.style.display === 'block') {
    menu.style.display = 'none';
    this.style.display = 'block';
  } else {
    menu.style.display = 'block';
    this.style.display = 'none';
  }
});

// Hide the menu if clicking outside of it, ensuring the persistent title reappears.
document.addEventListener('click', function() {
  const menu = document.getElementById('pageMenu');
  if (menu.style.display === 'block') {
    menu.style.display = 'none';
    document.getElementById('persistentTitle').style.display = 'block';
  }
});

// When a menu option is clicked, scroll to that page and update the persistent title.
document.querySelectorAll('.page-menu li').forEach(item => {
  item.addEventListener('click', function(e) {
    e.stopPropagation();
    const targetId = this.getAttribute('data-target');
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
      const newTitle = targetSection.getAttribute('data-title');
      updatePersistentTitle(newTitle);
      // Hide the menu and show the persistent title.
      document.getElementById('pageMenu').style.display = 'none';
      document.getElementById('persistentTitle').style.display = 'block';
    }
  });
});

// Use an IntersectionObserver that updates as soon as a section is nearly fully in view (95%).
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // If at least 95% of the section is visible, update the persistent title.
    if (entry.isIntersecting && entry.intersectionRatio >= 0.95) {
      const newTitle = entry.target.getAttribute('data-title');
      updatePersistentTitle(newTitle);
      
      // Update the active state in the menu.
      document.querySelectorAll('.page-menu li').forEach(li => {
        if (li.getAttribute('data-target') === entry.target.id) {
          li.classList.add('active');
        } else {
          li.classList.remove('active');
        }
      });
    }
  });
}, { root: null, threshold: 0.95 });

// Observe each page section.
document.querySelectorAll('.page').forEach(section => {
  observer.observe(section);
});
