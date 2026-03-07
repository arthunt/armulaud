/**
 * Slides Loader – fetches data/slides.json and exposes window.SLIDES + window.SLIDES_META
 * All view pages include this instead of the old slides.js
 */
(function () {
  window.SLIDES = [];
  window.SLIDES_META = {};
  window.SLIDES_READY = new Promise(function (resolve, reject) {
    fetch('data/slides.json')
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load slides.json: ' + r.status);
        return r.json();
      })
      .then(function (data) {
        window.SLIDES_META = data.meta || {};
        window.SLIDES_ALL = data.slides || [];
        window.SLIDES = window.SLIDES_ALL.filter(function (s) { return !s.hidden; });

        // Resolve projectorSpan
        var activeSpan = null;
        for (var i = 0; i < window.SLIDES.length; i++) {
          var slide = window.SLIDES[i];
          var hasOwn = slide.projector && slide.projector !== 'none';
          if (hasOwn) {
            var span = slide.projectorSpan || 1;
            activeSpan = (span > 1) ? {
              projector: slide.projector,
              projectorContent: slide.projectorContent,
              remaining: span - 1
            } : null;
          } else if (activeSpan && activeSpan.remaining > 0) {
            slide.projector = activeSpan.projector;
            slide.projectorContent = activeSpan.projectorContent;
            activeSpan.remaining--;
            if (activeSpan.remaining === 0) activeSpan = null;
          }
        }

        resolve(window.SLIDES);
      })
      .catch(function (err) {
        console.error(err);
        reject(err);
      });
  });
})();
