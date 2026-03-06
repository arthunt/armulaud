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
        window.SLIDES = data.slides || [];
        resolve(window.SLIDES);
      })
      .catch(function (err) {
        console.error(err);
        reject(err);
      });
  });
})();
