/* Progressive enhancements for the static blog pages. No framework, no build step. */
(function () {
  'use strict';

  function track(category, action, label) {
    if (typeof window.elomaiTrack === 'function') window.elomaiTrack(category, action, label);
  }

  /* ------------------------------------------------ search + pagination */
  var grid = document.getElementById('post-grid');
  var search = document.getElementById('blog-search');
  var pagination = document.getElementById('pagination');
  var status = document.getElementById('page-status');
  var empty = document.getElementById('search-empty');
  var PAGE_SIZE = 6;
  var page = 1;
  var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll('.post-card')) : [];
  var visible = cards.slice();

  function render() {
    cards.forEach(function (card) { card.hidden = true; });
    var start = (page - 1) * PAGE_SIZE;
    visible.slice(start, start + PAGE_SIZE).forEach(function (card) { card.hidden = false; });

    if (pagination && status) {
      var pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
      pagination.hidden = pages <= 1;
      status.textContent = pages > 1 ? page + ' / ' + pages : '';
      var prev = pagination.querySelector('[data-page="prev"]');
      var next = pagination.querySelector('[data-page="next"]');
      if (prev) prev.disabled = page <= 1;
      if (next) next.disabled = page >= pages;
    }
  }

  if (search && grid) {
    search.addEventListener('input', function () {
      var term = search.value.trim().toLowerCase();
      visible = cards.filter(function (card) {
        return !term || (card.getAttribute('data-search') || '').indexOf(term) !== -1;
      });
      page = 1;
      render();
      if (empty) empty.hidden = visible.length > 0;
      if (visible.length === 0 && term) track('search', 'blog_search_empty', term.slice(0, 60));
    });
  }

  if (pagination) {
    pagination.addEventListener('click', function (event) {
      var button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      page = Math.max(1, page + (button.getAttribute('data-page') === 'next' ? 1 : -1));
      render();
      track('navigation', 'blog_pagination', String(page));
    });
  }

  render();

  /* --------------------------------------------------------- share links */
  document.addEventListener('click', function (event) {
    var share = event.target.closest('[data-share]');
    if (share) {
      var platform = share.getAttribute('data-share');
      track('engagement', platform === 'copy' ? 'article_share_copy' : 'social_share_click', platform);
      track('conversion', 'article_share', platform);
      if (platform === 'copy') {
        event.preventDefault();
        var url = share.getAttribute('data-url') || window.location.href;
        var done = function () {
          var previous = share.textContent;
          share.textContent = '✓';
          share.classList.add('is-done');
          setTimeout(function () {
            share.textContent = previous;
            share.classList.remove('is-done');
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, done);
        } else {
          var field = document.createElement('textarea');
          field.value = url;
          document.body.appendChild(field);
          field.select();
          try { document.execCommand('copy'); } catch (err) {}
          document.body.removeChild(field);
          done();
        }
      }
      return;
    }

    var tracked = event.target.closest('[data-event]');
    if (tracked) {
      var name = tracked.getAttribute('data-event');
      var location = tracked.getAttribute('data-location') || 'unknown';
      track('conversion', name, location);
      if (name === 'project_open') track('content', 'article_related_click', location);
    }
  });

  /* ------------------------------------------------------ video facades */
  document.addEventListener('click', function (event) {
    var button = event.target.closest('.video-play');
    if (!button) return;
    var facade = button.closest('.video-facade');
    if (!facade) return;
    var src = facade.getAttribute('data-src');
    if (!src) return;
    var url = src.indexOf('?') === -1 ? src + '?autoplay=1' : src + '&autoplay=1';
    var frame = document.createElement('iframe');
    frame.src = url;
    frame.title = 'Embedded video';
    frame.loading = 'lazy';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    facade.innerHTML = '';
    facade.appendChild(frame);
    track('content', 'video_play', facade.getAttribute('data-provider') || 'video');
  });
})();
