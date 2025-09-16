document.addEventListener('DOMContentLoaded', () => {
  /* ===== CONFIG ===== */
  const MAX_CHARS = 380;           // colapsos fuera del Marco y Bibliografía
  const PREVIEW_H = '4.8em';       // ≈ 3 líneas
  const SPEED     = 350;

  /* ===== Helpers ===== */
  const setAnim   = el => { el.style.transition = `max-height ${SPEED}ms ease`; };
  const forceReflow = el => void el.offsetHeight;
  const openToAuto = el => { el.style.maxHeight = el.scrollHeight + 'px'; };
  const closeTo   = (el, h) => {
    if (el.style.maxHeight === 'none') {
      el.style.maxHeight = el.scrollHeight + 'px';
      forceReflow(el);
    }
    el.style.maxHeight = h;
  };
  const onEnd = (el, cond) => {
    el.addEventListener('transitionend', e => {
      if (e.target !== el) return;
      if (cond()) el.style.maxHeight = 'none';
    });
  };

  /* ------------------------------------------------------------------
     A) MARCO TEÓRICO — Un solo botón que revela secciones (stepper)
  ------------------------------------------------------------------ */
  (function initMarcoStepper(){
    const marco = document.querySelector('#marco');
    if (!marco) return;

    const extra   = marco.querySelector('.extra-content');
    const mainBtn = marco.querySelector('.marco-toggle');

    if (!extra || !mainBtn) return;

    // El contenedor no debe estar colapsado para poder envolver secciones
    extra.classList.remove('collapsed');
    extra.style.maxHeight = 'none';

    // Envolver cada H3 + contenido hasta el siguiente H3 en .marco-section
    const sections = [];
    let n = extra.firstChild;

    while (n) {
      if (n.nodeType === 1 && n.tagName === 'H3') {
        const wrap = document.createElement('div');
        wrap.className = 'collapsible marco-section';
        wrap.style.maxHeight = '0';
        setAnim(wrap);

        const start = n;
        let node = start;
        while (node && !(node.nodeType === 1 && node !== start && node.tagName === 'H3')) {
          const next = node.nextSibling;
          wrap.appendChild(node);       // mueve H3 y su bloque
          node = next;
        }
        extra.insertBefore(wrap, node);
        sections.push(wrap);
        n = node;
      } else {
        n = n.nextSibling;
      }
    }

    // Botón único: abre una sección por click; al final, "Ocultar todo"
    let opened = 0;
    sections.forEach(s => onEnd(s, () => s.dataset.state === 'open'));

    const openOne = i => {
      const s = sections[i]; if (!s) return;
      openToAuto(s); s.dataset.state = 'open';
    };

    const closeAll = () => {
      sections.forEach(s => { closeTo(s, '0'); s.dataset.state = 'closed'; });
      opened = 0;
      mainBtn.textContent = 'Leer más';
      mainBtn.setAttribute('aria-expanded', 'false');
    };

    mainBtn.textContent = 'Leer más';
    mainBtn.setAttribute('aria-expanded', 'false');

    mainBtn.addEventListener('click', () => {
      if (opened < sections.length) {
        openOne(opened);
        opened += 1;
        mainBtn.setAttribute('aria-expanded', 'true');
        if (opened === sections.length) {
          mainBtn.textContent = 'Ocultar todo';
        }
      } else {
        closeAll();
      }
    });
  })();

  /* ------------------------------------------------------------------
     B) Colapsos de párrafos/listas LARGOS fuera del Marco y Bibliografía
  ------------------------------------------------------------------ */
  (function initGenericCollapsibles(){
    document.querySelectorAll('main p, main ul, main ol').forEach(el => {
      // No tocar el acordeón del Marco ni la sección Bibliografía
      if (el.closest('#marco .extra-content')) return;
      if (el.closest('.bibliography')) return;

      if (el.textContent.trim().length <= MAX_CHARS) return;

      el.classList.add('collapsible');
      el.style.maxHeight = PREVIEW_H;
      setAnim(el);

      const t = document.createElement('span');
      t.className = 'read-toggle';
      t.setAttribute('role', 'button');
      t.setAttribute('aria-expanded', 'false');
      t.setAttribute('aria-label', 'Mostrar más');
      el.after(t);

      const toggle = () => {
        const isOpen = t.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          closeTo(el, PREVIEW_H);
          t.setAttribute('aria-expanded', 'false');
        } else {
          openToAuto(el);
          t.setAttribute('aria-expanded', 'true');
        }
      };
      t.addEventListener('click', toggle);
      onEnd(el, () => t.getAttribute('aria-expanded') === 'true');
    });
  })();


    /* ------------------------------------------------------------------
     LIGHTBOX para .gallery (abre en la misma página)
  ------------------------------------------------------------------ */
  (function initLightbox(){


  const links = document.querySelectorAll('.gallery .media a, .gallery-rail .media a');
  if (!links.length) return;

    // Crear DOM del modal
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox__close" aria-label="Cerrar">✕</button>
      <div>
        <img class="lightbox__img" alt="">
        <div class="lightbox__caption"></div>
      </div>
    `;
    document.body.appendChild(lb);

    const imgEl = lb.querySelector('.lightbox__img');
    const capEl = lb.querySelector('.lightbox__caption');
    const closeBtn = lb.querySelector('.lightbox__close');

    const open = (src, caption, alt) => {
      imgEl.src = src;
      imgEl.alt = alt || caption || '';
      capEl.textContent = caption || alt || '';
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      lb.classList.remove('open');
      imgEl.src = '';
      document.body.style.overflow = '';
    };

    links.forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const fig = a.closest('figure');
        const caption = fig?.querySelector('figcaption')?.textContent.trim() || '';
        const alt = fig?.querySelector('img')?.alt || '';
        open(a.getAttribute('href'), caption, alt);
      });
    });

    // Cerrar: clic fuera, botón, ó tecla Esc
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  })
  
  

  
  
  ();


  /* ------------------------------------------------------------------
     GALERÍA: rail horizontal + flecha inferior (una sola)
  ------------------------------------------------------------------ */
  (function initGalleryRail(){
    const gallery = document.querySelector('#anexos .gallery, .gallery'); // por si cambias id
    if (!gallery) return;

    // Envoltorio para posicionar la flecha
    const wrap = document.createElement('div');
    wrap.className = 'gallery-wrap';
    gallery.parentNode.insertBefore(wrap, gallery);
    wrap.appendChild(gallery);

    // Botón único debajo
    const nav = document.createElement('div');
    nav.className = 'gallery-nav';
    nav.innerHTML = `
      <button class="gallery-next" aria-label="Ver más imágenes">
        <span class="arrow-body"></span>
        <span class="arrow-head"></span>
      </button>
    `;
    wrap.appendChild(nav);

    // Ajustes de scroll
    const step = () => Math.max(gallery.clientWidth * 0.9, 320);

    const goNext = () => {
      const max = gallery.scrollWidth - gallery.clientWidth;
      const next = gallery.scrollLeft + step();
      if (next >= max - 4) {
        gallery.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        gallery.scrollBy({ left: step(), behavior: 'smooth' });
      }
    };

    nav.querySelector('.gallery-next').addEventListener('click', goNext);

    // “fade” en bordes cuando hay overflow
    const setMask = () => {
      wrap.classList.toggle('gallery-overflow', gallery.scrollWidth > gallery.clientWidth + 2);
    };
    setMask();
    window.addEventListener('resize', setMask);
  })();

  /* =========================================================
   Carrusel anexos: flechas + barra inferior arrastrable
========================================================= */
(function initAnexosCarousel(){
  const wrap  = document.querySelector('#anexos .gallery-wrap');
  if (!wrap) return;

  const rail  = wrap.querySelector('.gallery-rail');
  const prev  = wrap.querySelector('.gbtn.prev');
  const next  = wrap.querySelector('.gbtn.next');
  const track = wrap.querySelector('.gtrack');
  const thumb = wrap.querySelector('.gthumb');

  // Tamaño del pulgar proporcional al contenido visible
  function updateThumb(){
    const ratio = rail.clientWidth / rail.scrollWidth;
    const w = Math.max(0.12, Math.min(1, ratio)); // mínimo 12%
    thumb.style.width = (w*100) + '%';
    updateThumbPos();
    updateButtons();
  }
  function updateThumbPos(){
    const maxLeft = track.clientWidth - thumb.clientWidth;
    const p = rail.scrollLeft / (rail.scrollWidth - rail.clientWidth || 1);
    thumb.style.left = (maxLeft * p) + 'px';
    thumb.setAttribute('aria-valuenow', Math.round(p*100));
  }
  function updateButtons(){
    prev.disabled = rail.scrollLeft <= 0;
    next.disabled = Math.ceil(rail.scrollLeft + rail.clientWidth) >= rail.scrollWidth;
  }

  // Scroll con flechas (como la barra derecha de páginas)
  const step = () => Math.max(rail.clientWidth * 0.9, 200);
  prev.addEventListener('click', () => { rail.scrollBy({left: -step(), behavior:'smooth'}); });
  next.addEventListener('click', () => { rail.scrollBy({left:  step(), behavior:'smooth'}); });

  // Arrastrar el pulgar
  let dragging = false, startX = 0, startLeft = 0;
  const onMove = e => {
    if (!dragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = x - startX;
    const maxLeft = track.clientWidth - thumb.clientWidth;
    const newLeft = Math.max(0, Math.min(maxLeft, startLeft + dx));
    thumb.style.left = newLeft + 'px';
    const p = newLeft / (maxLeft || 1);
    rail.scrollLeft = p * (rail.scrollWidth - rail.clientWidth);
  };
  const stopDrag = () => { dragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('touchmove', onMove); };

  thumb.addEventListener('mousedown', e => {
    dragging = true; startX = e.clientX; startLeft = parseFloat(getComputedStyle(thumb).left) || 0;
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', stopDrag);
  });
  thumb.addEventListener('touchstart', e => {
    dragging = true; startX = e.touches[0].clientX; startLeft = parseFloat(getComputedStyle(thumb).left) || 0;
    document.addEventListener('touchmove', onMove, {passive:false}); document.addEventListener('touchend', stopDrag);
  });

  // Click en la pista para saltar
  track.addEventListener('mousedown', e => {
    if (e.target === thumb) return;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const centerOffset = thumb.clientWidth / 2;
    const maxLeft = track.clientWidth - thumb.clientWidth;
    const newLeft = Math.max(0, Math.min(maxLeft, clickX - centerOffset));
    const p = newLeft / (maxLeft || 1);
    rail.scrollTo({ left: p * (rail.scrollWidth - rail.clientWidth), behavior: 'smooth' });
  });

  // Sincronización por scroll/resize
  rail.addEventListener('scroll', () => { updateThumbPos(); updateButtons(); });
  window.addEventListener('resize', updateThumb);

  updateThumb();
})


();
/* ===== Inicializa player simple para #anexoAudio ===== */
(function initAnexoAudio(){
  const audio = document.getElementById('anexoAudio');
  if (!audio) return;

  const btn = document.querySelector('.audio-btn');
  const icon = btn.querySelector('.icon');
  const progress = document.querySelector('.audio-progress');
  const bar = document.querySelector('.audio-progress__bar');
  const vol = document.querySelector('.audio-vol');

  // evitar errores si algún elemento falta
  if (!btn || !progress || !bar || !vol) return;

  // Play / Pause toggle (user interaction required por autoplay policy)
  btn.addEventListener('click', async () => {
    try {
      if (audio.paused) {
        await audio.play();
        btn.setAttribute('aria-pressed','true');
        icon.textContent = '▮▮'; // icono pausa
      } else {
        audio.pause();
        btn.setAttribute('aria-pressed','false');
        icon.textContent = '▶';
      }
    } catch (err) {
      console.error('No se pudo reproducir el audio:', err);
    }
  });

  // actualizar barra conforme avanza el audio
  audio.addEventListener('timeupdate', () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    bar.style.width = pct + '%';
    progress.setAttribute('aria-valuenow', Math.round(pct));
  });

  // permitir click para saltar a posición
  progress.addEventListener('click', (e) => {
    const rect = progress.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    if (audio.duration) audio.currentTime = pct * audio.duration;
  });

  // soporte keyboard slider (izq/der)
  progress.addEventListener('keydown', (e) => {
    if (!audio.duration) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + Math.max(1, audio.duration * 0.02));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      audio.currentTime = Math.max(0, audio.currentTime - Math.max(1, audio.duration * 0.02));
    }
  });

  // volumen
  vol.addEventListener('input', () => { audio.volume = parseFloat(vol.value); });

  // cuando termina: volver a icono play
  audio.addEventListener('ended', () => {
    btn.setAttribute('aria-pressed','false');
    icon.textContent = '▶';
    bar.style.width = '0%';
  });

  // inicializar controles con valores por defecto
  audio.volume = parseFloat(vol.value || 0.8);
  icon.textContent = '▶';
})();

/* ==== Toggle simple para la transcripción (botón desliza) ==== */
(function initSimpleTranscript(){
  const btn = document.getElementById('toggleTranscript');
  const box = document.getElementById('transcriptBox');
  if (!btn || !box) return;

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      // cerrar
      box.classList.remove('open');
      box.classList.add('collapsed');
      btn.setAttribute('aria-expanded', 'false');
      box.setAttribute('aria-hidden', 'true');
      btn.textContent = 'Mostrar transcripción';
    } else {
      // abrir
      box.classList.remove('collapsed');
      box.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      box.setAttribute('aria-hidden', 'false');
      btn.textContent = 'Ocultar transcripción';
      // opcional: hacer scroll suave para que se vea el inicio del texto
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})


();

});
