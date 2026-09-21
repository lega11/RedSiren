// CODE BY OisinMccarthy(LEGA11)
/* Events page: search, filter and sort over the full list. */
(function () {
  'use strict';

  const grid = document.getElementById('events-grid');
  const countEl = document.getElementById('result-count');
  const searchInput = document.getElementById('filter-search');
  const categorySelect = document.getElementById('filter-category');
  const locationSelect = document.getElementById('filter-location');
  const dateInput = document.getElementById('filter-date');
  const priceSelect = document.getElementById('filter-price');
  const sortSelect = document.getElementById('filter-sort');
  const resetButton = document.getElementById('filter-reset');

  let events = [];

  // Fill the dropdowns from the data so they can't list a stale option.
  function buildOptions() {
    const categories = [...new Set(events.map(e => e.category))].sort();
    categories.forEach(cat => categorySelect.add(new Option(cat, cat)));

    const locations = [...new Set(events.map(e => e.location))].sort();
    locations.forEach(loc => locationSelect.add(new Option(loc, loc)));
  }

  // Read ?q= and ?category= so links from the home page arrive pre-filtered.
  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) searchInput.value = params.get('q');
    if (params.get('category')) categorySelect.value = params.get('category');
  }

  function matches(event) {
    const term = searchInput.value.trim().toLowerCase();
    if (term) {
      const haystack = [event.name, event.description, event.venue, event.location, event.category]
        .join(' ').toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    if (categorySelect.value && event.category !== categorySelect.value) return false;
    if (locationSelect.value && event.location !== locationSelect.value) return false;

    // Date filter shows events on or after the chosen day.
    if (dateInput.value) {
      const chosen = new Date(dateInput.value);
      chosen.setHours(0, 0, 0, 0);
      if (new Date(event.dateISO) < chosen) return false;
    }

    if (priceSelect.value) {
      const ceiling = parseInt(priceSelect.value, 10);
      if (event.fromPriceCents > ceiling) return false;
    }

    return true;
  }

  function sorted(list) {
    const copy = list.slice();
    switch (sortSelect.value) {
      case 'price-asc': return copy.sort((a, b) => a.fromPriceCents - b.fromPriceCents);
      case 'price-desc': return copy.sort((a, b) => b.fromPriceCents - a.fromPriceCents);
      case 'name': return copy.sort((a, b) => a.name.localeCompare(b.name));
      default: return copy.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
    }
  }

  function render() {
    const results = sorted(events.filter(matches));
    countEl.textContent = results.length === 1
      ? '1 event found'
      : results.length + ' events found';
    Events.renderInto(grid, results, 'Nothing matches those filters. Try clearing one.');
  }

  function resetFilters() {
    searchInput.value = '';
    categorySelect.value = '';
    locationSelect.value = '';
    dateInput.value = '';
    priceSelect.value = '';
    sortSelect.value = 'date';
    render();
  }

  [searchInput, categorySelect, locationSelect, dateInput, priceSelect, sortSelect]
    .forEach(control => control.addEventListener('input', render));
  resetButton.addEventListener('click', resetFilters);

  // The form exists so Enter submits; filtering is already live.
  document.getElementById('filter-form').addEventListener('submit', e => {
    e.preventDefault();
    render();
  });

  async function load() {
    try {
      events = await Events.all();
      buildOptions();
      applyUrlParams();
      render();
    } catch (err) {
      grid.innerHTML = '<div class="empty-state"><h3>Couldn\'t load events</h3>' +
        '<p class="muted">Check the server is running, then refresh.</p></div>';
      countEl.textContent = '';
      Site.toast(err.message, 'error');
    }
  }

  load();
})();
// CODE BY OisinMccarthy(LEGA11)
