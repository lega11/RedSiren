// CODE BY OisinMccarthy(LEGA11)
/* Home page: featured events, the next few dates, and category shortcuts. */
(function () {
  'use strict';

  const featured = document.getElementById('featured-grid');
  const upcoming = document.getElementById('upcoming-grid');
  const categoryRow = document.getElementById('category-row');
  const searchForm = document.getElementById('home-search');

  // Search on the home page just hands the term to the browse page.
  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const term = document.getElementById('home-search-input').value.trim();
    window.location.href = 'events.html' + (term ? '?q=' + encodeURIComponent(term) : '');
  });

  async function load() {
    try {
      const events = await Events.all();
      const onSale = events.filter(e => e.totalRemaining > 0);

      // Featured = the three soonest events that can still be bought.
      Events.renderInto(featured, onSale.slice(0, 3), 'No events on sale right now.');
      Events.renderInto(upcoming, events.slice(0, 6), 'Nothing announced yet.');

      // Category buttons are built from the data, not hardcoded.
      const categories = [...new Set(events.map(e => e.category))].sort();
      categoryRow.innerHTML = '';
      categories.forEach(cat => {
        const a = document.createElement('a');
        a.className = 'btn btn-secondary';
        a.href = 'events.html?category=' + encodeURIComponent(cat);
        a.textContent = cat;
        categoryRow.appendChild(a);
      });
    } catch (err) {
      const message = '<div class="empty-state"><h3>Couldn\'t load events</h3>' +
        '<p class="muted">Check the server is running, then refresh.</p></div>';
      featured.innerHTML = message;
      upcoming.innerHTML = '';
      Site.toast(err.message, 'error');
    }
  }

  load();
})();
// CODE BY OisinMccarthy(LEGA11)
