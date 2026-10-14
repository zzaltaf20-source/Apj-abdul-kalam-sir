/* ==========================================================================
DR. A.P.J. ABDUL KALAM — EDITORIAL TRIBUTE ENGINE
Video crossfade · Scene tracking · Scramble decode · Reveal system
========================================================================== */

(() => {
  'use strict';

  const reduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  /* ---- Elements ---- */
  const videos = $$('.stage__video');
  const gate = $('#gate');
  const gateEnter = $('#gateEnter');
  const gateSilent = $('#gateSilent');
  const music = $('#bgMusic');
  const audioToggle = $('#audioToggle');
  const audioLabel = $('#audioLabel');
  const progressBar = $('#progressBar');
  const topNav = $('#topNav');
  const sceneLabel = $('#sceneLabel');
  const sections = $$('[data-scene]');
  const railItems = $$('[data-rail]');
  const replayBtn = $('#replayBtn');
  const portrait = $('#finalePortrait');
  const presidentPortrait = $('#presidentPortrait');

  const SCENE_NAMES = [
    '01 · THE AWAKENING',
    '02 · THE ARCHITECT',
    '03 · THE ASCENT',
    '04 · THE IMMORTAL'
  ];

  let activeScene = -1;

  /* Optional portraits — remove gracefully if file missing */
  if (portrait) {
    portrait.addEventListener('error', () => {
      portrait.remove();
    });
  }

  if (presidentPortrait) {
    presidentPortrait.addEventListener('error', () => {
      const container = presidentPortrait.closest(
        '.president-portrait-container'
      );

      if (container) {
        container.remove();
      }
    });
  }

  /* ------------------------------------------------------------------
  1. VIDEO ARMING — muted autoplay, no native controls ever visible
  ------------------------------------------------------------------ */
  videos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    const playPromise = video.play();

    if (playPromise) {
      playPromise.catch(() => {});
    }
  });

  /* ------------------------------------------------------------------
  2. SCENE CROSSFADER
  ------------------------------------------------------------------ */
  function setScene(index) {
    index = Number(index);

    if (
      !Number.isInteger(index) ||
      index === activeScene ||
      index < 0 ||
      index >= videos.length
    ) {
      return;
    }

    activeScene = index;

    videos.forEach((video, idx) => {
      video.classList.toggle('is-active', idx === index);

      if (idx === index) {
        video.play().catch(() => {});
      } else {
        // Delay pause so the outgoing video keeps moving during crossfade
        setTimeout(() => {
          if (activeScene !== idx) {
            video.pause();
          }
        }, 1700);
      }
    });

    railItems.forEach((item) => {
      item.classList.toggle('is-active', Number(item.dataset.rail) === index);
    });

    if (sceneLabel && SCENE_NAMES[index]) {
      scramble(sceneLabel, SCENE_NAMES[index]);
    }
  }

  if ('IntersectionObserver' in window && sections.length) {
    const sceneIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setScene(entry.target.dataset.scene);
          }
        });
      },
      {
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0
      }
    );

    sections.forEach((section) => {
      sceneIO.observe(section);
    });
  }

  /* ------------------------------------------------------------------
  3. SCRAMBLE-DECODE TEXT
  ------------------------------------------------------------------ */
  const GLYPHS = 'AKMISLVX0123456789·—/✦';

  function scramble(element, text) {
    if (!element) return;

    const finalText = text ?? element.dataset.final ?? element.textContent;

    element.dataset.final = finalText;

    if (reduced) {
      element.textContent = finalText;
      return;
    }

    if (element._raf) {
      cancelAnimationFrame(element._raf);
    }

    const length = finalText.length;
    const duration = Math.min(900, 140 + length * 20);
    const start = performance.now();

    const frame = (now) => {
      const time = Math.min(1, (now - start) / duration);
      const reveal = Math.floor(time * length);

      let output = '';

      for (let i = 0; i < length; i++) {
        const character = finalText[i];

        output +=
          i < reveal || character === ' '
            ? character
            : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }

      element.textContent = output;

      if (time < 1) {
        element._raf = requestAnimationFrame(frame);
      } else {
        element.textContent = finalText;
      }
    };

    element._raf = requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------
  4. SCROLL REVEALS
  ------------------------------------------------------------------ */
  const revealElements = $$('[data-reveal]');

  if ('IntersectionObserver' in window && revealElements.length) {
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('is-inview');

          entry.target.querySelectorAll('[data-scramble]').forEach((el) => {
            if (el.dataset.done) return;

            el.dataset.done = '1';
            scramble(el);
          });

          revealIO.unobserve(entry.target);
        });
      },
      {
        threshold: 0.25
      }
    );

    revealElements.forEach((el) => {
      revealIO.observe(el);
    });
  } else {
    revealElements.forEach((el) => {
      el.classList.add('is-inview');
    });
  }

  /* ------------------------------------------------------------------
  5. PROGRESS BAR + NAV STATE
  ------------------------------------------------------------------ */
  let scrollTicking = false;

  function onScroll() {
    if (scrollTicking) return;

    scrollTicking = true;

    requestAnimationFrame(() => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;

      if (progressBar) {
        progressBar.style.transform = `scaleX(${
          max > 0 ? window.scrollY / max : 0
        })`;
      }

      if (topNav) {
        topNav.classList.toggle('is-scrolled', window.scrollY > 40);
      }

      scrollTicking = false;
    });
  }

  window.addEventListener('scroll', onScroll, {
    passive: true
  });

  onScroll();

  /* ------------------------------------------------------------------
  6. AUDIO — GATE + TOGGLE
  ------------------------------------------------------------------ */
  function setAudioState(on) {
    document.body.classList.toggle('is-muted', !on);

    if (audioLabel) {
      audioLabel.textContent = on ? 'SOUND ON' : 'SOUND OFF';
    }
  }

  function openGate(withSound) {
    if (withSound && music) {
      music.volume = 0.85;

      music
        .play()
        .then(() => {
          setAudioState(true);
        })
        .catch(() => {
          setAudioState(false);
        });
    } else {
      setAudioState(false);
    }

    if (gate) {
      gate.classList.add('is-open');
    }
  }

  if (gateEnter) {
    gateEnter.addEventListener('click', () => {
      openGate(true);
    });
  }

  if (gateSilent) {
    gateSilent.addEventListener('click', () => {
      openGate(false);
    });
  }

  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      if (!music) return;

      if (music.paused) {
        music
          .play()
          .then(() => {
            setAudioState(true);
          })
          .catch(() => {});
      } else {
        music.pause();
        setAudioState(false);
      }
    });
  }

  /* ------------------------------------------------------------------
  7. REPLAY
  ------------------------------------------------------------------ */
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: reduced ? 'auto' : 'smooth'
      });
    });
  }
})();

/* ==========================================================================
FINALE PORTRAIT — SUBTLE SCROLL PARALLAX
========================================================================== */

(() => {
  const portrait = document.getElementById('finalePortrait');

  if (!portrait) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  let parallaxTicking = false;

  function parallax() {
    const rect = portrait.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // How far the portrait has entered the viewport (0 → 1)
    const progress = Math.min(
      1,
      Math.max(
        0,
        (viewportHeight - rect.top) /
          (viewportHeight + rect.height)
      )
    );

    // Gentle drift, max ±30px
    const shift = (progress - 0.5) * -60;

    portrait.style.transform = `translateY(${shift}px)`;

    parallaxTicking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!parallaxTicking) {
        parallaxTicking = true;
        requestAnimationFrame(parallax);
      }
    },
    {
      passive: true
    }
  );

  parallax();
})();

/* ==========================================================================
PEOPLE'S PRESIDENT PORTRAIT — SCENE VISIBILITY CONTROL
========================================================================== */

(() => {
  'use strict';

  const presidentPortrait = document.getElementById('presidentPortrait');

  if (!presidentPortrait) return;

  const panels = document.querySelectorAll('.story-panel');

  if (!panels.length) return;

  function updatePresidentPortrait() {
    const viewportHeight = window.innerHeight;

    let currentScene = 0;

    panels.forEach((panel) => {
      const rect = panel.getBoundingClientRect();

      if (rect.top <= viewportHeight * 0.55) {
        currentScene = parseInt(panel.dataset.scene, 10) || 0;
      }
    });

    /*
      Scene 2 is "The People's President" section in this HTML.
      If you want it to appear in the final scene instead,
      change currentScene === 2 to currentScene === 3.
    */
    presidentPortrait.classList.toggle(
      'visible',
      currentScene === 2
    );
  }

  window.addEventListener('scroll', updatePresidentPortrait, {
    passive: true
  });

  window.addEventListener('resize', updatePresidentPortrait);
  window.addEventListener('load', updatePresidentPortrait);

  updatePresidentPortrait();
})();