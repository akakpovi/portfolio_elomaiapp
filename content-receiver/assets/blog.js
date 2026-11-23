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

  /* ------------------------------------------------------------- comments */
  /*
   * Only approved comments exist in the DOM. A submission is never inserted
   * into the list: it appears after WordPress moderation and the next render,
   * which is exactly the lifecycle the API enforces.
   */
  var commentSection = document.getElementById('comments');

  function commentStrings() {
    var holder = document.querySelector('#comments script.comments-labels');
    if (!holder) return {};
    try {
      return JSON.parse(holder.textContent || '{}') || {};
    } catch (err) {
      return {};
    }
  }

  function commentDate(iso, lang) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    try {
      return new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
      }).format(date);
    } catch (err) {
      return iso.slice(0, 10);
    }
  }

  function buildComment(item, lang, labels) {
    var li = document.createElement('li');
    li.className = 'comment';
    li.id = 'comment-' + item.id;
    li.setAttribute('data-comment-id', item.id);

    var head = document.createElement('div');
    head.className = 'comment-head';
    var author = document.createElement('span');
    author.className = 'comment-author';
    author.textContent = item.author;
    head.appendChild(author);
    var time = document.createElement('time');
    time.dateTime = item.createdAt || '';
    time.textContent = commentDate(item.createdAt, lang);
    head.appendChild(time);
    li.appendChild(head);

    var body = document.createElement('div');
    body.className = 'comment-body';
    String(item.content || '').split('\n').forEach(function (line, index) {
      if (index) body.appendChild(document.createElement('br'));
      body.appendChild(document.createTextNode(line));
    });
    li.appendChild(body);

    var reply = document.createElement('button');
    reply.type = 'button';
    reply.className = 'comment-reply';
    reply.setAttribute('data-reply', item.id);
    reply.setAttribute('data-reply-name', item.author);
    reply.textContent = labels.reply || 'Reply';
    li.appendChild(reply);

    if (item.replies && item.replies.length) {
      var list = document.createElement('ul');
      list.className = 'comment-replies';
      item.replies.forEach(function (child) {
        list.appendChild(buildComment(Object.assign({}, child, { replies: [] }), lang, labels));
      });
      li.appendChild(list);
    }
    return li;
  }

  if (commentSection && commentSection.getAttribute('data-comments') === 'open') {
    (function initComments() {
      var root = commentSection;
      var form = root.querySelector('[data-comment-form]');
      if (!form) return;

      var lang = document.documentElement.lang || 'en';
      var labels = commentStrings();
      var notice = root.querySelector('[data-comment-notice]');
      var submit = root.querySelector('[data-comment-submit]');
      var replyNote = root.querySelector('[data-reply-note]');
      var cancelReply = root.querySelector('[data-comment-cancel]');
      var parentField = form.querySelector('input[name="parent"]');
      var textarea = form.querySelector('textarea[name="content"]');
      var more = root.querySelector('[data-comments-more]');
      var list = root.querySelector('.comment-list');
      var listParent = list || root.querySelector('.comments-empty');
      var article = root.getAttribute('data-article') || '';
      var endpoint = '/content-api/comments/v1';
      var opened = false;
      var startedAt = Date.now();

      function setNotice(text, kind) {
        if (!notice) return;
        notice.textContent = text || '';
        notice.className = 'comment-notice' + (kind ? ' is-' + kind : '');
      }

      function trackOpen() {
        if (opened) return;
        opened = true;
        track('comments', 'comment_form_opened', lang);
      }

      form.addEventListener('focusin', trackOpen);

      function clearReply() {
        if (parentField) parentField.value = '';
        if (replyNote) {
          replyNote.hidden = true;
          replyNote.textContent = '';
        }
        if (cancelReply) cancelReply.hidden = true;
      }

      if (cancelReply) cancelReply.addEventListener('click', clearReply);

      root.addEventListener('click', function (event) {
        var button = event.target.closest('[data-reply]');
        if (!button) return;
        var id = button.getAttribute('data-reply') || '';
        var name = button.getAttribute('data-reply-name') || '';
        if (parentField) parentField.value = id;
        if (replyNote) {
          replyNote.hidden = false;
          replyNote.textContent = (labels.replyingTo || 'Replying to {name}').replace('{name}', name);
        }
        if (cancelReply) cancelReply.hidden = false;
        trackOpen();
        track('comments', 'comment_reply_clicked', button.closest('.comment-replies') ? 'reply' : 'root');
        if (textarea) {
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
          textarea.focus();
        }
      });

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        trackOpen();

        var author = form.querySelector('input[name="author"]');
        var email = form.querySelector('input[name="email"]');
        var consent = form.querySelector('input[name="consent"]');
        var honeypot = form.querySelector('input[name="website"]');
        var content = form.querySelector('textarea[name="content"]');

        var invalid = [];
        if (!author.value.trim() || author.value.trim().length < 2) invalid.push(author);
        if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email.value.trim())) invalid.push(email);
        if (content.value.trim().length < 2) invalid.push(content);
        if (!consent.checked) invalid.push(consent);

        invalid.forEach(function (field) {
          field.setAttribute('aria-invalid', 'true');
        });
        if (invalid.length) {
          setNotice(labels.required || 'Please check the required fields.', 'error');
          invalid[0].focus();
          return;
        }

        var key = (window.crypto && window.crypto.randomUUID)
          ? window.crypto.randomUUID()
          : String(Date.now()) + '-' + Math.random().toString(16).slice(2);

        var payload = {
          article: article,
          author: author.value.trim(),
          email: email.value.trim(),
          content: content.value.trim(),
          consent: consent.checked,
          website: honeypot ? honeypot.value : '',
          elapsed: Math.round((Date.now() - startedAt) / 1000),
          parent: parentField && parentField.value ? parentField.value : undefined,
          idempotencyKey: key,
        };

        var previous = submit.textContent;
        submit.disabled = true;
        submit.textContent = labels.sending || 'Sending…';
        setNotice('', 'pending');

        fetch(endpoint + '/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'omit',
          body: JSON.stringify(payload),
        })
          .then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (json) {
              return { status: response.status, json: json };
            });
          })
          .then(function (result) {
            if (result.status === 429) {
              setNotice(labels.rateLimited || 'Too many comments recently.', 'error');
              track('comments', 'comment_submission_error', 'rate_limited');
              return;
            }
            if (result.status >= 200 && result.status < 300 && result.json && result.json.ok) {
              form.reset();
              clearReply();
              setNotice(labels.received || 'Thank you.', 'success');
              track('comments', 'comment_submission_success', lang);
              return;
            }
            setNotice(labels.error || 'Your comment could not be sent.', 'error');
            track('comments', 'comment_submission_error', result.json && result.json.error ? String(result.json.error).slice(0, 40) : 'http_' + result.status);
          })
          .catch(function () {
            setNotice(labels.error || 'Your comment could not be sent.', 'error');
            track('comments', 'comment_submission_error', 'network');
          })
          .then(function () {
            submit.disabled = false;
            submit.textContent = previous;
          });
      });

      if (more) {
        more.addEventListener('click', function () {
          var cursor = root.getAttribute('data-next') || '';
          if (!cursor) {
            more.hidden = true;
            return;
          }
          more.disabled = true;
          fetch(endpoint + '/list?article=' + encodeURIComponent(article) + '&cursor=' + encodeURIComponent(cursor) + '&limit=10')
            .then(function (response) { return response.json(); })
            .then(function (data) {
              if (!data || !data.ok || !Array.isArray(data.comments)) return;
              if (!list) {
                list = document.createElement('ul');
                list.className = 'comment-list';
                if (listParent && listParent.parentNode) listParent.parentNode.replaceChild(list, listParent);
                else root.insertBefore(list, root.querySelector('.comment-form'));
              }
              data.comments.forEach(function (item) {
                list.appendChild(buildComment(item, lang, labels));
              });
              if (data.nextCursor) root.setAttribute('data-next', data.nextCursor);
              else more.hidden = true;
              track('comments', 'comment_load_more', lang);
            })
            .catch(function () {})
            .then(function () { more.disabled = false; });
        });
      }
    })();
  }
})();
