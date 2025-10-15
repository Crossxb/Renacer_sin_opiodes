document.addEventListener('DOMContentLoaded', function() {

// --- REPRODUCTOR DE AUDIO (VERSIÓN CON HIGHLIGHT DE TRANSCRIPCIÓN) ---
const audio = document.getElementById('anexoAudio');
if (audio) {
  const playBtn = document.querySelector('.audio-btn');
  const playIcon = playBtn.querySelector('.icon');
  const progress = document.querySelector('.audio-progress');
  const progressBar = document.querySelector('.audio-progress__bar');
  const volumeCtrl = document.querySelector('.audio-vol');
  const timeDisplay = document.querySelector('.audio-time');
  const transcriptPs = document.querySelectorAll('#transcriptBox p');
  let lastHighlightedP = null;

  // --- 1. SETUP INICIAL: LEER TIMESTAMPS ---
  // Convertimos los [MM:SS] de cada párrafo a segundos y los guardamos.
  transcriptPs.forEach(p => {
    const timestampSpan = p.querySelector('.timestamp');
    if (timestampSpan) {
      const timeText = timestampSpan.textContent.match(/\[(\d+):(\d+)\]/);
      if (timeText) {
        const minutes = parseInt(timeText[1], 10);
        const seconds = parseInt(timeText[2], 10);
        p.dataset.time = (minutes * 60) + seconds;
      }
    }
  });

  // --- 2. FUNCIONES DEL REPRODUCTOR ---
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${minutes}:${formattedSeconds}`;
  }

  audio.addEventListener('loadedmetadata', () => {
    timeDisplay.textContent = `${formatTime(0)} / ${formatTime(audio.duration)}`;
  });

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playIcon.textContent = '❚❚';
      playBtn.setAttribute('aria-pressed', 'true');
    } else {
      audio.pause();
      playIcon.textContent = '▶';
      playBtn.setAttribute('aria-pressed', 'false');
    }
  });

  // --- 3. LÓGICA DE ACTUALIZACIÓN EN TIEMPO REAL ---
  audio.addEventListener('timeupdate', () => {
    const currentTime = audio.currentTime;
    
    // Actualizar barra y tiempo
    const percent = (currentTime / audio.duration) * 100;
    progressBar.style.width = `${percent}%`;
    progress.setAttribute('aria-valuenow', percent);
    timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(audio.duration)}`;

    // Lógica para resaltar el párrafo correcto
    let activeP = null;
    transcriptPs.forEach(p => {
      if (currentTime >= p.dataset.time) {
        activeP = p;
      }
    });

    if (activeP && activeP !== lastHighlightedP) {
      // Quitar el resaltado de todos los párrafos
      transcriptPs.forEach(p => p.classList.remove('highlight-transcript'));
      // Añadir el resaltado al párrafo activo
      activeP.classList.add('highlight-transcript');
      
      // Hacer que la caja de transcripción se desplace automáticamente
      const transcriptBox = document.getElementById('transcriptBox');
      if (!transcriptBox.classList.contains('collapsed')) {
        activeP.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      lastHighlightedP = activeP;
    }
  });

  // Ir a un punto del audio al hacer clic en la barra
  progress.addEventListener('click', (e) => {
    const rect = progress.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = x / width;
    audio.currentTime = percent * audio.duration;
  });

  // Control de volumen
  volumeCtrl.addEventListener('input', () => {
    audio.volume = volumeCtrl.value;
  });
}

  // --- BOTÓN DE TRANSCRIPCIÓN (LÓGICA ACTUALIZADA) ---
  const toggleBtn = document.getElementById('toggleTranscript');
  const transcriptBox = document.getElementById('transcriptBox');

  if (toggleBtn && transcriptBox) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      transcriptBox.setAttribute('aria-hidden', isExpanded);
      transcriptBox.classList.toggle('collapsed');

      if (transcriptBox.classList.contains('collapsed')) {
        toggleBtn.textContent = 'Mostrar transcripción';
      } else {
        toggleBtn.textContent = 'Ocultar transcripción';
      }
    });
  }

  // --- GALERÍA DE ANEXOS (CARRUSEL) ---
  const rail = document.querySelector('.gallery-rail');
  if (rail) {
    const prevBtn = document.querySelector('.gbtn.prev');
    const nextBtn = document.querySelector('.gbtn.next');
    const thumb = document.querySelector('.gthumb');
    const track = document.querySelector('.gtrack');

    const scrollHandler = () => {
      const scrollLeft = rail.scrollLeft;
      const scrollWidth = rail.scrollWidth - rail.clientWidth;
      const thumbPos = (scrollLeft / scrollWidth) * (track.clientWidth - thumb.clientWidth);
      thumb.style.left = `${thumbPos}px`;
    };

    rail.addEventListener('scroll', scrollHandler);

    nextBtn.addEventListener('click', () => {
      rail.scrollBy({ left: rail.clientWidth * 0.8, behavior: 'smooth' });
    });
    prevBtn.addEventListener('click', () => {
      rail.scrollBy({ left: -rail.clientWidth * 0.8, behavior: 'smooth' });
    });
    
    // Arrastrar la barra de scroll
    let isDragging = false;
    thumb.addEventListener('mousedown', (e) => { isDragging = true; thumb.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', () => { isDragging = false; thumb.style.cursor = 'grab'; });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const rect = track.getBoundingClientRect();
      let x = e.clientX - rect.left - (thumb.clientWidth / 2);
      x = Math.max(0, Math.min(x, track.clientWidth - thumb.clientWidth));
      const percent = x / (track.clientWidth - thumb.clientWidth);
      rail.scrollLeft = percent * (rail.scrollWidth - rail.clientWidth);
    });
  }
  
  // --- LIGHTBOX PARA GALERÍA (NUEVA LÓGICA) ---
  const lightbox = document.getElementById('lightbox-overlay');
  if (lightbox) {
    const galleryLinks = document.querySelectorAll('.gallery-rail .media a');
    const lightboxImage = lightbox.querySelector('.lightbox-image');
    const lightboxInfo = lightbox.querySelector('.lightbox-info');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    galleryLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const imgSrc = link.href;
        lightboxImage.setAttribute('src', imgSrc);
        
        // Aquí puedes agregar la lógica para el panel de información
        lightboxInfo.innerHTML = `<h3>Información de la imagen</h3><p>Descripción para la imagen: <strong>${imgSrc.split('/').pop()}</strong>.</p><p>Este es un texto de ejemplo que puedes reemplazar luego.</p>`;
        
        lightbox.classList.add('visible');
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('visible');
      // Opcional: limpiar la imagen para que no "salte" la próxima vez
      setTimeout(() => {
        lightboxImage.setAttribute('src', '');
      }, 300);
    };

    closeBtn.addEventListener('click', closeLightbox);
    
    // Cerrar al hacer clic en el fondo oscuro
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }



// --- Lógica para el carrusel de la galería con barra de scroll personalizada ---
(function initAnexosCarousel() {
  const wrap = document.querySelector('#anexos .gallery-wrap');
  if (!wrap) return;

  const rail = wrap.querySelector('.gallery-rail');
  const prev = wrap.querySelector('.gbtn.prev');
  const next = wrap.querySelector('.gbtn.next');
  const track = wrap.querySelector('.gtrack');
  const thumb = wrap.querySelector('.gthumb');

  if (!rail || !prev || !next || !track || !thumb) return;

  function updateControls() {
    // Actualizar posición del thumb
    const scrollLeft = rail.scrollLeft;
    const scrollWidth = rail.scrollWidth - rail.clientWidth;
    const thumbWidth = track.clientWidth * (rail.clientWidth / rail.scrollWidth);
    thumb.style.width = `${thumbWidth}px`;
    
    const thumbPos = (scrollLeft / scrollWidth) * (track.clientWidth - thumbWidth);
    thumb.style.left = `${thumbPos}px`;
    
    // Deshabilitar botones en los extremos
    prev.disabled = scrollLeft <= 0;
    next.disabled = scrollLeft >= scrollWidth - 1;
  }

  rail.addEventListener('scroll', updateControls);
  window.addEventListener('resize', updateControls);

  next.addEventListener('click', () => {
    rail.scrollBy({ left: rail.clientWidth * 0.8, behavior: 'smooth' });
  });

  prev.addEventListener('click', () => {
    rail.scrollBy({ left: -rail.clientWidth * 0.8, behavior: 'smooth' });
  });

  // Lógica para arrastrar el thumb
  let isDragging = false;
  thumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    thumb.style.cursor = 'grabbing';
    const startX = e.pageX - thumb.offsetLeft;
    const scrollLeft = rail.scrollLeft;
    
    const onMouseMove = (moveEvent) => {
      if (!isDragging) return;
      moveEvent.preventDefault();
      const x = moveEvent.pageX - startX;
      const walk = (x / track.clientWidth) * (rail.scrollWidth - rail.clientWidth);
      rail.scrollLeft = walk;
    };
    
    const onMouseUp = () => {
      isDragging = false;
      thumb.style.cursor = 'grab';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // Llamada inicial para setear todo correctamente
  setTimeout(updateControls, 100);
})();

});