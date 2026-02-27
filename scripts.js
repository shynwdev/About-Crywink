document.addEventListener('DOMContentLoaded', function () {
  const avatarWrap = document.querySelector('.avatar-wrap');
  const audio = document.getElementById('audio-player');
  const playPauseBtn = document.getElementById('play-pause');
  const playIcon = document.getElementById('play-icon');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const volumeSlider = document.getElementById('volume');
  const muteBtn = document.getElementById('mute');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const currentTimeEl = document.getElementById('current-time');
  const durationEl = document.getElementById('duration');
  const musicPlayer = document.querySelector('.music-player');
  const playerToggle = document.getElementById('player-toggle');
  (function startAvatarFloat() {
    if (!avatarWrap) return;
    let avatarAngle = 0;
    function floatAvatar() {
      avatarAngle += 0.018;
      const y = Math.sin(avatarAngle) * 6;
      const r = Math.sin(avatarAngle / 2) * 3;
      avatarWrap.style.transform = `translateY(${y}px) rotate(${r}deg)`;
      requestAnimationFrame(floatAvatar);
    }
    requestAnimationFrame(floatAvatar);
  })();
  const tracks = [
    { title: "Đổi Tư Thế", artist: "Artist: Bình Gold", src: "Đổi Tư Thế.mp3" },
    { title: "Anh Tên Là", artist: "Artist: Anh Băng", src: "ANH TÊN LÀ.mp3" },
    { title: "Mời Em", artist: "Artist: Wxrdie", src: "MỜI EM.mp3" }
  ];

  let currentIndex = 0;
  let isPlaying = false;
  let isSeeking = false;

  function formatTime(seconds = 0) {
    const mins = Math.floor(seconds / 60) || 0;
    const secs = Math.floor(seconds % 60) || 0;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function safeSetText(el, text) {
    if (el) el.textContent = text;
  }

  function loadTrack(index, autoplay = false) {
    const t = tracks[index];
    if (!t || !audio) return;
    audio.src = t.src;
    safeSetText(trackTitle, t.title);
    safeSetText(trackArtist, t.artist);
    if (progressFill) progressFill.style.width = '0%';
    safeSetText(currentTimeEl, '0:00');
    safeSetText(durationEl, '0:00');
    audio.load();
    if (autoplay) audio.play().catch(() => {});
  }

  function updatePlayIcon(isPlayingNow) {
    if (!playIcon) return;
    playIcon.className = isPlayingNow ? 'fas fa-pause' : 'fas fa-play';
  }

  function playPauseToggle() {
    if (!audio) return;
    if (!audio.src) loadTrack(currentIndex);
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function nextTrack() {
    currentIndex = (currentIndex + 1) % tracks.length;
    const shouldPlay = isPlaying || (audio && !audio.paused);
    loadTrack(currentIndex, shouldPlay);
  }

  function prevTrack() {
    currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const shouldPlay = isPlaying || (audio && !audio.paused);
    loadTrack(currentIndex, shouldPlay);
  }

  if (audio) {
    audio.addEventListener('loadedmetadata', function () {
      safeSetText(durationEl, isFinite(audio.duration) ? formatTime(audio.duration) : '0:00');
    });

    audio.addEventListener('timeupdate', function () {
      if (!isSeeking && audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressBar) progressBar.setAttribute('aria-valuenow', String(Math.floor(pct)));
        safeSetText(currentTimeEl, formatTime(audio.currentTime));
      }
    });

    audio.addEventListener('play', function () { isPlaying = true; updatePlayIcon(true); });
    audio.addEventListener('pause', function () { isPlaying = false; updatePlayIcon(false); });
    audio.addEventListener('ended', nextTrack);
  }

  function getClientX(e) {
    if (typeof e.clientX === 'number') return e.clientX;
    if (e.touches && e.touches[0]) return e.touches[0].clientX;
    return 0;
  }

  function seekFromEvent(e) {
    if (!progressBar || !audio) return;
    const rect = progressBar.getBoundingClientRect();
    const x = getClientX(e) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    if (audio.duration) audio.currentTime = pct * audio.duration;
    if (progressFill) progressFill.style.width = (pct * 100) + '%';
    safeSetText(currentTimeEl, formatTime(audio.currentTime));
  }

  if (progressBar) {
    progressBar.addEventListener('click', seekFromEvent);
    let pointerDown = false;
    progressBar.addEventListener('pointerdown', function (e) {
      pointerDown = true;
      isSeeking = true;
      try { progressBar.setPointerCapture(e.pointerId); } catch (err) { /* not critical */ }
      seekFromEvent(e);
    });
    document.addEventListener('pointermove', function (e) { if (pointerDown) seekFromEvent(e); });
    document.addEventListener('pointerup', function () { if (pointerDown) { pointerDown = false; isSeeking = false; } });
  }
  if (playPauseBtn) playPauseBtn.addEventListener('click', playPauseToggle);
  if (prevBtn) prevBtn.addEventListener('click', prevTrack);
  if (nextBtn) nextBtn.addEventListener('click', nextTrack);
  function setVolumeFromSlider() {
    if (!volumeSlider || !audio) return;
    const v = Number(volumeSlider.value) / 100;
    audio.volume = v;
    if (muteBtn) {
      const icon = muteBtn.querySelector('i');
      if (icon) {
        if (v === 0) icon.className = 'fas fa-volume-mute volume-icon';
        else if (v < 0.5) icon.className = 'fas fa-volume-down volume-icon';
        else icon.className = 'fas fa-volume-up volume-icon';
      }
    }
  }
  if (volumeSlider) {
    volumeSlider.addEventListener('input', setVolumeFromSlider);
    volumeSlider.value = 50;
  }
  if (muteBtn) {
    muteBtn.addEventListener('click', function () {
      if (!audio) return;
      audio.muted = !audio.muted;
      const i = muteBtn.querySelector('i');
      if (i) i.className = audio.muted ? 'fas fa-volume-mute volume-icon' : (audio.volume < 0.5 ? 'fas fa-volume-down volume-icon' : 'fas fa-volume-up volume-icon');
    });
  }
  window.addEventListener('keydown', function (e) {
    const targetTag = e.target && e.target.tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); playPauseToggle(); }
    if (e.code === 'ArrowRight') nextTrack();
    if (e.code === 'ArrowLeft') prevTrack();
    if (e.key && e.key.toLowerCase() === 'm') { if (muteBtn) muteBtn.click(); }
  });
  (function setupScrollBehavior() {
    if (!musicPlayer) return;
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let scrollTimer = null;
    window.addEventListener('scroll', function () {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const delta = scrollTop - lastScrollTop;
      if (Math.abs(delta) > 40) {
        if (scrollTop > 200 && delta > 40) musicPlayer.classList.add('hidden'), musicPlayer.classList.remove('visible');
        else musicPlayer.classList.remove('hidden'), musicPlayer.classList.add('visible');
      }
      lastScrollTop = scrollTop;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () { musicPlayer.classList.remove('hidden'); musicPlayer.classList.add('visible'); }, 700);
    }, { passive: true });
  })();

  if (playerToggle && musicPlayer) {
    playerToggle.addEventListener('click', function () {
      musicPlayer.classList.toggle('compact');
      const pressed = playerToggle.getAttribute('aria-pressed') === 'true';
      playerToggle.setAttribute('aria-pressed', String(!pressed));
      const i = playerToggle.querySelector('i');
      if (i) { i.classList.toggle('fa-chevron-down'); i.classList.toggle('fa-chevron-up'); }
    });
  }
  (function setupSkills() {
    const skillBars = document.querySelectorAll('.skill-bar-fill');
    if (skillBars.length) {
      setTimeout(function () {
        skillBars.forEach(function (bar) {
          const width = bar.getAttribute('data-width') || '0';
          bar.style.width = width + '%';
        });
      }, 450);
    }
    const skillCards = document.querySelectorAll('.skill-card');
    skillCards.forEach(function (card) {
      try {
        const fillEl = card.querySelector('.skill-bar-fill');
        let pct = '0';
        if (fillEl && fillEl.hasAttribute('data-width')) pct = fillEl.getAttribute('data-width').trim();
        if (!card.style.position) card.style.position = 'relative';
        let badge = card.querySelector('.skill-badge');
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'skill-badge';
          card.appendChild(badge);
        }
        badge.textContent = pct + '%';
      } catch (err) {
        console.warn('skill card setup error', err);
      }
    });
  })();
  (function setupObservers() {
    const observerOptions = { threshold: 0.12, rootMargin: '0px 0px -80px 0px' };
    const observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.payment-card, .social-card, .skill-card').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity .6s ease, transform .6s ease';
      observer.observe(el);
    });
  })();
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { target.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
      }
    });
  });
  (function setupCardInteraction() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(function (card) {
      let frame = null;
      let rectCache = null;
      function cacheRect() {
        const r = card.getBoundingClientRect();
        rectCache = { left: r.left, top: r.top, width: r.width, height: r.height };
      }
      function onPointerMove(e) {
        if (!card.isConnected) return;
        if (!rectCache) cacheRect();
        const clientX = (typeof e.clientX === 'number') ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = (typeof e.clientY === 'number') ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        const cx = rectCache.left + rectCache.width / 2;
        const cy = rectCache.top + rectCache.height / 2;
        const dx = (clientX - cx) / rectCache.width;
        const dy = (clientY - cy) / rectCache.height;
        const rx = dy * 8;
        const ry = dx * -8;
        const scale = 1 + Math.min(0.12, Math.hypot(dx, dy) * 0.12);
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(function () {
          card.style.transform = `perspective(900px) translateZ(0) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
          card.style.boxShadow = `0 ${14 * scale}px ${40 * scale}px rgba(0,0,0,0.55), 0 ${6 * scale}px ${28 * scale}px rgba(255,215,0,0.04)`;
        });
      }
      function onLeave() {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(function () {
          card.style.transform = 'none';
          card.style.boxShadow = '';
        });
        rectCache = null;
      }
      card.addEventListener('pointermove', onPointerMove, { passive: true });
      card.addEventListener('pointerleave', onLeave);
      card.addEventListener('pointerdown', function () { card.style.transition = 'transform .08s'; });
      card.addEventListener('pointerup', function () { card.style.transition = 'transform .16s'; });
    });
  })();

  if (musicPlayer) musicPlayer.classList.add('flow');
  loadTrack(currentIndex, false);
});