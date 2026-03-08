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
  var visible = allSlides.filter(function(s) { return !s.hidden; });

  // Pass 1: build layers map
  var layers = [];
  for (var i = 0; i < visible.length; i++) layers.push([]);

  for (var i = 0; i < visible.length; i++) {
    var slide = visible[i];
    var hasOwn = slide.projector && slide.projector !== 'none' && slide.projector !== 'inherit';
    if (!hasOwn) continue;

    var spanCount = (slide.projectorSpan === true) ? 2
      : (typeof slide.projectorSpan === 'number' && slide.projectorSpan > 1) ? slide.projectorSpan : 1;
    var offset = slide.projectorOffset === true;
    var startIdx = offset ? (i + 1) : i;

    var isImageSource = (slide.projector === 'image' || slide.projector === 'image-keytext');

    for (var j = 0; j < spanCount && (startIdx + j) < visible.length; j++) {
      var targetIdx = startIdx + j;
      // Source slide's own position: skip, slide already has its own content
      if (targetIdx === i) continue;
      var targetProj = visible[targetIdx].projector || 'none';
      // Allow image to compose with keytext; otherwise stop at own content
      if (targetProj !== 'none' && targetProj !== 'inherit') {
        if (!(isImageSource && targetProj === 'keytext')) break;
      }
      layers[targetIdx].push({
        projector: slide.projector,
        projectorContent: slide.projectorContent || {},
        sourceIndex: i
      });
    }
  }

  // Pass 2: compose layers for each target slide
  for (var i = 0; i < visible.length; i++) {
    if (layers[i].length === 0) continue;
    composeLayers(layers[i], visible[i]);
  }

  // Pass 3: clear projector on offset sources (content moved to next slides)
  for (var i = 0; i < visible.length; i++) {
    if (visible[i].projectorOffset === true) {
      visible[i].projector = 'none';
    }
  }

  // Pass 4: auto-compose adjacent image + keytext
  // When an image slide is immediately followed by a keytext slide (no span needed),
  // composite them into image-keytext automatically.
  for (var i = 1; i < visible.length; i++) {
    var cur = visible[i];
    var prev = visible[i - 1];
    if (cur.projector === 'keytext' && layers[i].length === 0 &&
        (prev.projector === 'image' || prev.projector === 'image-keytext')) {
      var imgC = prev.projectorContent || {};
      var txtC = cur.projectorContent || {};
      cur.projector = 'image-keytext';
      cur.projectorContent = {
        imageUrl: imgC.imageUrl,
        imageFallback: imgC.imageFallback,
        overlay: imgC.overlay,
        textEst: txtC.textEst || '',
        textRus: txtC.textRus || ''
      };
    }
  }

  return visible;
}

function composeLayers(layersList, targetSlide) {
  var imageLayer = null;
  var textLayer = null;
  var otherLayer = null;

  for (var k = 0; k < layersList.length; k++) {
    var l = layersList[k];
    if (l.projector === 'image' || l.projector === 'image-keytext') imageLayer = l;
    else if (l.projector === 'keytext') textLayer = l;
    else otherLayer = l;
  }

  var ownContent = targetSlide.projectorContent || {};
  var hasOwnText = ownContent.textEst || ownContent.textRus;
  // If target is a keytext slide, treat its own content as text source
  if (targetSlide.projector === 'keytext') hasOwnText = true;

  if (imageLayer && (textLayer || hasOwnText)) {
    var textSrc = textLayer ? textLayer.projectorContent : ownContent;
    targetSlide.projector = 'image-keytext';
    targetSlide.projectorContent = {
      imageUrl: imageLayer.projectorContent.imageUrl,
      imageFallback: imageLayer.projectorContent.imageFallback,
      overlay: imageLayer.projectorContent.overlay,
      textEst: textSrc.textEst || '',
      textRus: textSrc.textRus || ''
    };
  } else if (imageLayer) {
    targetSlide.projector = imageLayer.projector;
    targetSlide.projectorContent = imageLayer.projectorContent;
  } else if (textLayer) {
    targetSlide.projector = textLayer.projector;
    targetSlide.projectorContent = textLayer.projectorContent;
  } else if (otherLayer) {
    targetSlide.projector = otherLayer.projector;
    targetSlide.projectorContent = otherLayer.projectorContent;
  }
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
