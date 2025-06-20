// Wallpaper SVG Animation: Tiles laid from bottom-right

document.addEventListener('DOMContentLoaded', function () {
  const wallpaperContainer = document.querySelector('.wallpaper-container');
  if (!wallpaperContainer) return;

  // Fetch the SVG as text
  fetch('images/wallpaper/SC_herringbone.svg')
    .then(response => response.text())
    .then(svgText => {
      // Inject SVG inline
      wallpaperContainer.innerHTML = svgText;
      const svg = wallpaperContainer.querySelector('svg');
      if (!svg) return;

      // Dispatch an event indicating the wallpaper (SVG) is ready
      const wallpaperReadyEvent = new CustomEvent('wallpaperReady', { bubbles: true, detail: { container: wallpaperContainer } });
      wallpaperContainer.dispatchEvent(wallpaperReadyEvent);

      // Responsive preserveAspectRatio for SVG
      function updateSvgAspect() {
        if (window.innerWidth <= 768) {
          svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        } else {
          svg.setAttribute('preserveAspectRatio', 'none');
        }
      }
      updateSvgAspect();
      window.addEventListener('resize', updateSvgAspect);

      // Find all tile elements (rect, polygon, path)
      let tiles = Array.from(svg.querySelectorAll('rect, polygon, path'));
      if (tiles.length === 0) return;

      // --- Group tiles by column, animate columns together, edges last ---
      // 1. Build an array of {tile, bbox} objects for all tiles
      let tileObjs = tiles.map(tile => ({
        tile,
        bbox: tile.getBBox(),
      }));

      // 2. Find unique columns by x position (allow a small tolerance)
      const tolerance = 1; // px
      let columns = [];
      tileObjs.forEach(obj => {
        let col = columns.find(c => Math.abs(c.x - obj.bbox.x) < tolerance);
        if (!col) {
          columns.push({ x: obj.bbox.x, tiles: [obj] });
        } else {
          col.tiles.push(obj);
        }
      });
      // Sort columns left to right
      columns.sort((a, b) => a.x - b.x);

      // 3. Optionally group columns into column groups (e.g. 2-3 columns at a time)
      const groupSize = 2 + Math.floor(Math.random() * 2); // 2 or 3 columns
      let columnGroups = [];
      for (let i = 0; i < columns.length; i += groupSize) {
        columnGroups.push(columns.slice(i, i + groupSize));
      }

      // 4. Edge detection: find tiles at the outermost columns (but don't remove from groups if group only contains edge)
      let edgeColumns = [columns[0], columns[columns.length - 1]];
      let edgeTileSet = new Set();
      edgeColumns.forEach(col => {
        if (col) col.tiles.forEach(obj => edgeTileSet.add(obj));
      });
      // Remove edge tiles from their column groups ONLY if the group has other tiles
      columnGroups.forEach(group => {
        group.forEach(col => {
          if (col.tiles.length > 1) {
            col.tiles = col.tiles.filter(obj => !edgeTileSet.has(obj));
          }
        });
      });
      // For animation, collect edge tiles as array
      let edgeTiles = Array.from(edgeTileSet);
      // Remove edge tiles from all other animation lists to avoid double-animation
      columnGroups.forEach(group => {
        group.forEach(col => {
          col.tiles = col.tiles.filter(obj => !edgeTiles.includes(obj));
        });
      });

      // Hide all tiles initially and remove any filter/shadow
      tiles.forEach(tile => {
        tile.style.opacity = 0;
        tile.style.filter = 'none';
        tile.style.boxShadow = 'none';
        tile.style.transition = 'none';
      });
      // Track animation completion
      let tilesToShow = tileObjs.length;
      function revealShadowsIfDone() {
        tilesToShow--;
        if (tilesToShow === 0) {
          // Add shadow to all tiles after build
          tiles.forEach(tile => {
            tile.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))';
          });
        }
      }

      // 5. Animate edge tiles (first and last columns) first
      let delay = 0;
      edgeTiles.forEach((obj, i) => {
        setTimeout(() => {
          obj.tile.style.transition = 'opacity 0.3s';
          obj.tile.style.opacity = 1;
          revealShadowsIfDone();
        }, delay + i * 40);
      });
      delay += edgeTiles.length * 40 + 80;
      // 6. Animate column groups in sequence
      columnGroups.forEach((group, groupIdx) => {
        group.forEach(col => {
          col.tiles.forEach((obj, i) => {
            const jitter = Math.random() * 80;
            setTimeout(() => {
              obj.tile.style.transition = 'opacity 0.3s';
              obj.tile.style.opacity = 1;
              revealShadowsIfDone();
            }, delay + i * 30 + jitter);
          });
        });
        delay += 180 + Math.random() * 80;
      });

      // --- Interactive lift effect ---
      tileObjs.forEach(({tile}) => {
        let animating = false;
        const lift = () => {
          if (animating) return;
          animating = true;
          tile.classList.add('tile-lift');
        };
        tile.addEventListener('mouseenter', lift);
        tile.addEventListener('mouseleave', () => {
          if (animating) return;
          tile.classList.remove('tile-lift');
        });
        tile.addEventListener('touchstart', (e) => {
          e.preventDefault();
          lift();
        }, {passive: false});
        tile.addEventListener('animationend', () => {
          tile.classList.remove('tile-lift');
          animating = false;
        });
      });
    });
});
