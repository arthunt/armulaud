/**
 * Slides Loader – loads slides from Firebase Realtime DB
 * Fallback: data/slides.json if Firebase is unavailable
 * Exposes: window.SLIDES, window.SLIDES_META, window.SLIDES_READY,
 *          window.ACTIVE_PRESENTATION_ID, window.SLIDES_ONCHANGE
 *
 * Must be loaded as <script type="module" src="js/slides-loader.js">
 */

import { db } from './firebase-config.js';
import { ref, get, onValue } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

window.SLIDES = [];
window.SLIDES_ALL = [];
window.SLIDES_META = {};
window.ACTIVE_PRESENTATION_ID = null;

// Callbacks for real-time updates (views can register)
var changeListeners = [];
window.SLIDES_ONCHANGE = function(fn) { changeListeners.push(fn); };

function processSlides(allSlides) {
  // Filter hidden
  var visible = allSlides.filter(function(s) { return !s.hidden; });

  // Resolve projectorSpan (old JSON format: count-based)
  var activeSpan = null;
  for (var i = 0; i < visible.length; i++) {
    var slide = visible[i];
    var hasOwn = slide.projector && slide.projector !== 'none' && slide.projector !== 'inherit';
    if (hasOwn) {
      var span = slide.projectorSpan;
      // Support both boolean (new) and number (old) formats
      if (span === true || (typeof span === 'number' && span > 1)) {
        activeSpan = {
          projector: slide.projector,
          projectorContent: slide.projectorContent
        };
        if (typeof span === 'number') {
          activeSpan.remaining = span - 1;
        }
      } else {
        activeSpan = null;
      }
    } else if (slide.projector === 'none' && activeSpan && activeSpan.remaining > 0) {
      // Count-based inheritance for "none" slides
      var ownContent = slide.projectorContent || {};
      var isImageSource = activeSpan.projector === 'image' || activeSpan.projector === 'image-keytext';
      var hasOwnText = ownContent.textEst || ownContent.textRus;

      if (isImageSource && hasOwnText) {
        // Merge: image from source + keytext from current slide → image-keytext
        var srcContent = activeSpan.projectorContent || {};
        slide.projector = 'image-keytext';
        slide.projectorContent = {
          imageUrl: srcContent.imageUrl,
          imageFallback: srcContent.imageFallback,
          overlay: srcContent.overlay,
          textEst: ownContent.textEst,
          textRus: ownContent.textRus
        };
      } else {
        slide.projector = activeSpan.projector;
        slide.projectorContent = activeSpan.projectorContent;
      }
      activeSpan.remaining--;
      if (activeSpan.remaining === 0) activeSpan = null;
    } else if (slide.projector === 'inherit' && activeSpan) {
      // "inherit" with own text + image source → image-keytext overlay
      var ownContent = slide.projectorContent || {};
      var isImageSource = activeSpan.projector === 'image' || activeSpan.projector === 'image-keytext';
      var hasOwnText = ownContent.textEst || ownContent.textRus;

      if (isImageSource && hasOwnText) {
        var srcContent = activeSpan.projectorContent || {};
        slide.projector = 'image-keytext';
        slide.projectorContent = {
          imageUrl: srcContent.imageUrl,
          imageFallback: srcContent.imageFallback,
          overlay: srcContent.overlay,
          textEst: ownContent.textEst,
          textRus: ownContent.textRus
        };
      }
      // Otherwise left as "inherit" — projector.html keeps the screen
    }
  }

  return visible;
}

function showOfflineBanner() {
  if (document.getElementById('offline-banner')) return;
  var banner = document.createElement('div');
  banner.id = 'offline-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:rgba(180,140,20,0.92);color:#000;text-align:center;padding:6px 12px;font-size:0.78rem;font-family:sans-serif;';
  banner.textContent = '\u26A0 Offline re\u017Eiim \u2014 Firebase pole k\u00E4ttesaadav';
  document.body.appendChild(banner);
}

function hideOfflineBanner() {
  var banner = document.getElementById('offline-banner');
  if (banner) banner.remove();
}

function applyData(meta, slides) {
  window.SLIDES_META = meta;
  window.SLIDES_ALL = slides;
  window.SLIDES = processSlides(slides);
  changeListeners.forEach(function(fn) { fn(window.SLIDES, window.SLIDES_META); });
}

// Main loading logic
var resolveReady, rejectReady;
window.SLIDES_READY = new Promise(function(resolve, reject) {
  resolveReady = resolve;
  rejectReady = reject;
});

var initialResolved = false;

function loadFromFirebase() {
  return get(ref(db, 'activePresentation')).then(function(snap) {
    var activeId = snap.val();
    if (!activeId) throw new Error('No active presentation set');
    window.ACTIVE_PRESENTATION_ID = activeId;

    var presRef = ref(db, 'presentations/' + activeId);

    // Initial load
    return get(presRef).then(function(presSnap) {
      var data = presSnap.val();
      if (!data) throw new Error('Presentation not found: ' + activeId);

      var meta = data.meta || {};
      var slides = data.slides || [];
      // Firebase stores arrays with numeric keys — ensure it's an array
      if (!Array.isArray(slides)) {
        slides = Object.keys(slides).map(function(k) { return slides[k]; });
      }

      applyData(meta, slides);
      hideOfflineBanner();

      if (!initialResolved) {
        initialResolved = true;
        resolveReady(window.SLIDES);
      }

      // Real-time listener for updates
      onValue(presRef, function(snapshot) {
        var d = snapshot.val();
        if (!d) return;
        var m = d.meta || {};
        var s = d.slides || [];
        if (!Array.isArray(s)) {
          s = Object.keys(s).map(function(k) { return s[k]; });
        }
        applyData(m, s);
      });
    });
  });
}

function loadFromJSON() {
  return fetch('data/slides.json')
    .then(function(r) {
      if (!r.ok) throw new Error('Failed to load slides.json: ' + r.status);
      return r.json();
    })
    .then(function(data) {
      var meta = data.meta || {};
      var slides = data.slides || [];
      applyData(meta, slides);
      showOfflineBanner();

      if (!initialResolved) {
        initialResolved = true;
        resolveReady(window.SLIDES);
      }
    });
}

// Try Firebase first, fall back to JSON
loadFromFirebase().catch(function(err) {
  console.warn('Firebase load failed, falling back to JSON:', err.message);
  loadFromJSON().catch(function(jsonErr) {
    console.error('Both Firebase and JSON load failed:', jsonErr);
    if (!initialResolved) {
      initialResolved = true;
      rejectReady(jsonErr);
    }
  });
});
