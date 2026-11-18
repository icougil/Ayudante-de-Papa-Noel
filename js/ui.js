// UI: draws the scene, moves it and wires the logic (game-logic.js) to the page.
(function () {
  const APN = globalThis.APN;
  const $ = (id) => document.getElementById(id);

  const AGE = 11;
  const DISTANCE = 1800; // pixels of scenery between take-off and the city
  const NOTICE_SECONDS = 2.5; // how long the success message stays before moving on by itself
  const BOOST_SECONDS = 1.5; // at most, how long it takes to reach the city after a correct answer
  const SANTA_X = 0.28; // Santa's position, as a fraction of the scene width
  const PROPS = ['🌲', '🌲', '🎄', '🏠', '🏡', '⛄', '🌲'];

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const level = APN.LEVELS[0];

  const el = {
    screens: ['screen-start', 'screen-trip', 'screen-result'].map($),
    scene: $('scene'),
    world: $('world'),
    santa: $('santa'),
    effects: $('effects'),
    hillsFar: $('hills-far'),
    hillsNear: $('hills-near'),
    fill: $('distance-fill'),
    gifts: $('scoreboard-gifts'),
    express: $('scoreboard-express'),
    city: $('scoreboard-city'),
    prompt: $('prompt'),
    options: $('options'),
    notice: $('notice'),
    next: $('button-next'),
  };

  // UI state.
  // phase: 'idle' | 'flying' | 'circling' (over the city, waiting for an answer) | 'boosting'
  //               | 'notice' (success message) | 'miss' (wrong answer, waiting for "Seguir")
  let phase = 'idle';
  let state = null; // game state (game-logic)
  let leg = 0; // index of the city Santa is flying to
  let question = null; // this leg's question (options already shuffled)
  let x = 0; // how much near scenery has scrolled by
  let backdrop = 0; // how much far scenery has scrolled by (never stops)
  let cityX = 0; // where this leg's city sits in the scenery
  let speed = 0;
  let boost = 0;
  let turboNext = false;
  let pending = null; // correct-answer result waiting until Santa reaches the city
  let noticeSeconds = 0;
  let nextPropX = 0;
  let sceneWidth = 0;
  let lastTime = null;
  let loopRunning = false;

  // ---------- Drawings ----------

  const SLEIGH_SVG =
    '<svg viewBox="0 0 104 58" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M6 14h10v18h58c8 0 14-6 14-14V8h10v14c0 14-10 24-24 24H22C12 46 6 40 6 30z" fill="#d62839"/>' +
    '<path d="M6 14h10v6H6zM88 8h10v6H88z" fill="#f6c445"/>' +
    '<path d="M4 54h82c8 0 14-4 16-10" fill="none" stroke="#f6c445" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M24 46v8M70 46v8" stroke="#f6c445" stroke-width="4"/></svg>';

  function santaHTML() {
    return (
      '<div class="santa-body">' +
      '<span class="santa-trail">✨✨✨</span>' +
      '<span class="santa-sack">🎁</span>' +
      '<span class="santa-person">🎅</span>' +
      '<span class="santa-sleigh">' + SLEIGH_SVG + '</span>' +
      '<span class="santa-reins"></span>' +
      '<span class="santa-reindeer">🦌</span>' +
      '<span class="santa-bubble">¡Achús!</span>' +
      '</div>'
    );
  }

  const HOUSE_SVG =
    '<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="48" y="10" width="16" height="30" fill="#7a3b28"/>' +
    '<rect x="45" y="6" width="22" height="7" rx="3" fill="#f4f8ff"/>' +
    '<rect x="10" y="42" width="60" height="38" fill="#b5613f"/>' +
    '<path d="M2 46 40 16l38 30z" fill="#8f2d2d"/>' +
    '<path d="M2 46 40 16l38 30-6 0L40 24 8 46z" fill="#f4f8ff"/>' +
    '<rect x="18" y="52" width="14" height="14" fill="#ffe08a"/>' +
    '<rect x="44" y="56" width="14" height="24" fill="#5a3d1e"/></svg>';

  const WINDOW_COLOR = '#ffe08a';
  const LANDMARKS = {
    barcelona:
      '<path d="M8 120V62l6-40 6 40v58zM27 120V46l7-44 7 44v74zM59 120V46l7-44 7 44v74zM80 120V62l6-40 6 40v58z" fill="#c9a66b"/>' +
      '<rect x="38" y="72" width="24" height="48" fill="#b08a52"/>' +
      '<path d="M44 120V98a6 6 0 0 1 12 0v22z" fill="#5a3d1e"/>' +
      '<circle cx="34" cy="60" r="2.5" fill="' + WINDOW_COLOR + '"/><circle cx="66" cy="60" r="2.5" fill="' + WINDOW_COLOR + '"/>' +
      '<circle cx="50" cy="84" r="4" fill="' + WINDOW_COLOR + '"/>',
    zaragoza:
      '<path d="M4 120V40l5-12 5 12v80zM26 120V34l5-12 5 12v86zM64 120V34l5-12 5 12v86zM86 120V40l5-12 5 12v80z" fill="#c98f5f"/>' +
      '<rect x="6" y="80" width="88" height="40" fill="#d9a777"/>' +
      '<path d="M34 80a16 16 0 0 1 32 0z" fill="#4f8f8a"/><rect x="48" y="56" width="4" height="10" fill="#4f8f8a"/>' +
      '<path d="M14 80a6 6 0 0 1 12 0zM74 80a6 6 0 0 1 12 0z" fill="#4f8f8a"/>' +
      '<rect x="18" y="94" width="8" height="12" fill="' + WINDOW_COLOR + '"/><rect x="46" y="94" width="8" height="26" fill="#5a3d1e"/>' +
      '<rect x="74" y="94" width="8" height="12" fill="' + WINDOW_COLOR + '"/>',
    madrid:
      '<rect x="4" y="62" width="92" height="58" fill="#d8cdbb"/>' +
      '<rect x="32" y="48" width="36" height="16" fill="#c7bba6"/>' +
      '<path d="M32 48 50 38l18 10z" fill="#b8ab94"/>' +
      '<rect x="2" y="58" width="96" height="6" fill="#b8ab94"/>' +
      '<path d="M38 120V90a12 12 0 0 1 24 0v30zM12 120V98a8 8 0 0 1 16 0v22zM72 120V98a8 8 0 0 1 16 0v22z" fill="#27365a"/>',
    sevilla:
      '<rect x="36" y="40" width="28" height="80" fill="#d9a066"/>' +
      '<rect x="41" y="24" width="18" height="16" fill="#e3b27c"/>' +
      '<rect x="45" y="12" width="10" height="12" fill="#e3b27c"/>' +
      '<path d="M44 12 50 2l6 10z" fill="#8a6a3a"/>' +
      '<rect x="34" y="38" width="32" height="4" fill="#b98250"/>' +
      '<rect x="46" y="50" width="8" height="10" fill="' + WINDOW_COLOR + '"/><rect x="46" y="70" width="8" height="10" fill="' + WINDOW_COLOR + '"/>' +
      '<rect x="46" y="90" width="8" height="10" fill="' + WINDOW_COLOR + '"/><rect x="46" y="28" width="8" height="8" fill="#27365a"/>',
    santiago:
      '<path d="M10 120V34h22v86zM68 120V34h22v86z" fill="#b9b3a0"/>' +
      '<path d="M10 34 21 6l11 28zM68 34 79 6l11 28z" fill="#9c957f"/>' +
      '<path d="M32 120V56h36v64z" fill="#c9c3b0"/><path d="M32 56 50 28l18 28z" fill="#aaa38d"/>' +
      '<path d="M43 120V96a7 7 0 0 1 14 0v24z" fill="#5a3d1e"/>' +
      '<circle cx="50" cy="70" r="6" fill="' + WINDOW_COLOR + '"/>' +
      '<rect x="17" y="50" width="8" height="12" fill="' + WINDOW_COLOR + '"/><rect x="75" y="50" width="8" height="12" fill="' + WINDOW_COLOR + '"/>',
    bilbao:
      '<path d="M2 120V92q12-34 30-14 6-40 26-22 8-24 22-6 12 6 18 30v40z" fill="#c8d0d8"/>' +
      '<path d="M32 78q8 14 4 42H20zM58 56q12 26 6 64H48zM80 50q8 30 2 70H70z" fill="#a9b4c0"/>' +
      '<path d="M2 120V100h96v20z" fill="#8d99a8"/>' +
      '<rect x="10" y="106" width="16" height="6" fill="' + WINDOW_COLOR + '"/><rect x="40" y="106" width="16" height="6" fill="' + WINDOW_COLOR + '"/>',
  };

  function cityHTML(stop) {
    return (
      '<div class="city-house">' + HOUSE_SVG + '</div>' +
      '<div class="city-landmark"><svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">' +
      LANDMARKS[stop.id] + '</svg></div>' +
      '<div class="city-sign"><span></span></div>'
    );
  }

  // ---------- Screens ----------

  function showScreen(id) {
    for (const screen of el.screens) {
      screen.hidden = screen.id !== id;
    }
    window.scrollTo(0, 0);
  }

  // The text under the stars; the star rule itself lives in APN.result, this only picks a text.
  function resultLineText(r) {
    if (!r.passed) {
      return r.missing === 1
        ? '¡Casi! Te ha faltado ' + r.missing + ' regalo.'
        : 'Te han faltado ' + r.missing + ' regalos.';
    }
    if (r.stars === r.maxStars) return '¡Puntuación perfecta!';
    if (r.stars === r.maxStars - 1) {
      return 'Última estrella: ¡las ' + APN.EXPRESS_FOR_FIFTH_STAR + ' entregas exprés ⚡!';
    }
    return 'Siguiente estrella: entrega un regalo más.';
  }

  function showResult() {
    phase = 'idle';
    const r = APN.result(state);
    APN.sound.stopMusic();
    APN.sound.play(r.passed ? 'pass' : 'notPassed');
    $('result-title').textContent = r.passed
      ? '¡Nivel superado!'
      : 'A Papá Noel le han faltado regalos. ¡Inténtalo otra vez!';
    const stars = $('result-stars');
    stars.textContent = '⭐'.repeat(r.stars) + '☆'.repeat(r.maxStars - r.stars);
    stars.setAttribute('aria-label', r.stars + ' de ' + r.maxStars + ' estrellas');
    $('result-next-star').textContent = resultLineText(r);
    $('result-gifts').textContent = 'Has entregado ' + r.delivered + ' de ' + r.total + ' regalos.';
    $('result-express').textContent = 'Entregas exprés: ' + r.express + ' ⚡';
    const button = $('button-again');
    button.textContent = r.passed ? 'Jugar otra vez' : 'Reintentar';
    showScreen('screen-result');
    button.focus({ preventScroll: true });
  }

  // ---------- Game ----------

  function startGame() {
    // Options are shuffled when the game is created, so the logic and the screen share one order.
    const picked = APN.pickQuestions(level, APN.QUESTIONS, AGE, Math.random);
    state = APN.createGame(picked.map((q) => APN.shuffleOptions(q, Math.random)));
    leg = 0;
    turboNext = false;
    pending = null;
    x = 0;
    backdrop = 0;
    nextPropX = 0;
    el.world.textContent = '';
    el.effects.textContent = '';
    showScreen('screen-trip');
    measure();
    APN.sound.play('takeOff');
    APN.sound.startMusic(APN.TAKE_OFF_SECONDS);
    startLeg();
    if (!loopRunning) {
      loopRunning = true;
      lastTime = null;
      requestAnimationFrame(loop);
    }
  }

  function startLeg() {
    const stop = level.stops[leg];
    const seconds = turboNext ? APN.TURBO_FLIGHT_SECONDS : APN.FLIGHT_SECONDS;
    speed = DISTANCE / seconds;
    cityX = x + sceneWidth * SANTA_X + DISTANCE;

    const city = document.createElement('div');
    city.className = 'city';
    city.dataset.x = String(cityX);
    city.style.left = cityX + 'px';
    city.innerHTML = cityHTML(stop);
    city.querySelector('.city-sign span').textContent = stop.name;
    el.world.appendChild(city);

    APN.sound.setTurbo(turboNext);
    el.santa.classList.toggle('turbo', turboNext);
    el.santa.classList.remove('circling', 'sneezing');
    el.effects.textContent = '';

    question = state.questions[leg];
    renderQuestion();
    renderScoreboard();
    phase = 'flying';
  }

  function renderScoreboard() {
    el.gifts.textContent = 'Regalos entregados: ' + state.delivered + ' ' + '🎁'.repeat(state.delivered);
    el.express.textContent = '⚡ ' + state.express;
    el.city.textContent = 'Ciudad ' + (leg + 1) + '/' + level.stops.length + ': ' + level.stops[leg].name;
  }

  function renderQuestion() {
    el.prompt.textContent = question.prompt;
    el.options.textContent = '';
    question.options.forEach((text, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option';
      button.textContent = text;
      button.addEventListener('click', () => onAnswer(i));
      el.options.appendChild(button);
    });
    el.notice.textContent = '';
    el.next.hidden = true;
    window.scrollTo(0, 0); // a wrong answer may have scrolled down to "Seguir"
    el.options.firstChild.focus({ preventScroll: true });
  }

  function notify(lines) {
    el.notice.textContent = '';
    for (const [cls, text] of lines) {
      const p = document.createElement('p');
      p.className = cls;
      p.textContent = text;
      el.notice.appendChild(p);
    }
  }

  function onAnswer(i) {
    if (phase !== 'flying' && phase !== 'circling') {
      return; // already answered: a double click must not count twice
    }
    APN.sound.play('tap');
    const beforeArrival = phase === 'flying';
    const r = APN.answer(state, i, beforeArrival);
    state = r.state;
    turboNext = r.turbo;

    const buttons = el.options.children;
    for (let j = 0; j < buttons.length; j++) {
      buttons[j].disabled = true;
      if (j === question.correct) {
        buttons[j].classList.add('correct');
      } else if (j === i) {
        buttons[j].classList.add('wrong');
      }
    }
    el.santa.classList.remove('circling');

    if (r.correct) {
      if (beforeArrival && !reducedMotion.matches) {
        const remaining = cityX - sceneWidth * SANTA_X - x;
        boost = Math.max(speed, remaining / BOOST_SECONDS);
        pending = r;
        el.notice.textContent = '';
        phase = 'boosting';
      } else {
        x = cityX - sceneWidth * SANTA_X;
        deliver(r);
      }
    } else {
      fail();
    }
  }

  function deliver(r) {
    pending = null;
    // The gift falls inside the scenery, onto the chimney, and scrolls along with it.
    for (const [cls, text] of [['gift-delivered', '🎁'], ['spark', '✨']]) {
      const span = document.createElement('span');
      span.className = cls;
      span.textContent = text;
      span.dataset.x = String(cityX);
      span.style.left = cityX + 'px';
      span.style.setProperty('--fall-from', Math.round(el.scene.clientHeight * 0.55) + 'px');
      el.world.appendChild(span);
    }
    APN.sound.play(r.express ? 'express' : 'deliver');
    if (r.turbo) {
      APN.sound.play('turbo', APN.TURBO_SOUND_DELAY_SECONDS);
    }
    renderScoreboard();
    const lines = [['notice-good', r.express ? '¡Correcto! Entrega exprés ⚡🎁' : '¡Correcto! Regalo entregado 🎁']];
    if (r.turbo) {
      lines.push(['notice-turbo', '¡Turbo! 3 aciertos seguidos ✨']);
    }
    notify(lines);
    noticeSeconds = NOTICE_SECONDS;
    phase = 'notice';
  }

  function fail() {
    const mishap = APN.pickMishap(Math.random);
    APN.sound.play(mishap.id);
    if (mishap.id === 'storm') {
      for (let n = 0; n < 16; n++) {
        const flake = effect('flake', '❄️');
        flake.style.left = Math.round(Math.random() * 110) + '%';
        flake.style.animationDelay = (-Math.random() * 2.2).toFixed(2) + 's';
      }
    } else if (mishap.id === 'reindeer') {
      el.santa.classList.add('sneezing');
    } else {
      effect('gift-lost', '🎁');
    }
    notify([
      ['notice-bad', mishap.emoji + ' ' + mishap.text],
      ['notice-normal', 'La respuesta correcta era: ' + question.options[question.correct] + '.'],
      ['notice-normal', question.explanation],
    ]);
    el.next.hidden = false;
    el.next.focus({ preventScroll: true });
    // On a short screen the explanation pushes "Seguir" below the fold: bring it into view.
    el.next.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    phase = 'miss';
  }

  function effect(cls, text) {
    const span = document.createElement('span');
    span.className = cls;
    span.textContent = text;
    el.effects.appendChild(span);
    return span;
  }

  function nextStep() {
    if (state.finished) {
      showResult();
    } else {
      leg += 1;
      startLeg();
    }
  }

  function onNext() {
    if (phase !== 'miss') {
      return; // a double click on "Seguir" must not skip two cities
    }
    APN.sound.play('tap');
    phase = 'idle';
    nextStep();
  }

  // ---------- Movement ----------

  function measure() {
    sceneWidth = el.scene.clientWidth || 600;
  }

  function advance(dt) {
    backdrop += speed * dt;
    const arrival = cityX - sceneWidth * SANTA_X;

    if (phase === 'flying') {
      x += speed * dt;
      if (x >= arrival) {
        x = arrival;
        phase = 'circling';
        APN.sound.play('arrive');
        el.santa.classList.add('circling');
        notify([[
          'notice-waiting',
          'Papá Noel da vueltas sobre ' + level.stops[leg].name + '... ¡piénsalo con calma!',
        ]]);
      }
    } else if (phase === 'boosting') {
      x += boost * dt;
      if (x >= arrival) {
        x = arrival;
        deliver(pending);
      }
    } else if (phase === 'notice') {
      x += speed * dt;
      noticeSeconds -= dt;
      if (noticeSeconds <= 0) {
        phase = 'idle';
        nextStep();
      }
    } else if (phase === 'miss') {
      x += speed * dt;
    }
  }

  function populateProps(visibleX) {
    nextPropX = Math.max(nextPropX, visibleX - 100);
    while (nextPropX < visibleX + sceneWidth + 200) {
      const farFromCity = nextPropX < cityX - 130 || nextPropX > cityX + 230;
      if (farFromCity) {
        const d = document.createElement('span');
        const emoji = PROPS[Math.floor(Math.random() * PROPS.length)];
        d.className = 'prop' + (emoji === '🏠' || emoji === '🏡' ? ' big' : '');
        d.textContent = emoji;
        d.dataset.x = String(nextPropX);
        d.style.left = nextPropX + 'px';
        el.world.appendChild(d);
      }
      nextPropX += 110 + Math.random() * 170;
    }
    // Anything left far behind is removed.
    for (const child of Array.from(el.world.children)) {
      if (Number(child.dataset.x) < visibleX - 400) {
        child.remove();
      }
    }
  }

  function render() {
    const arrival = cityX - sceneWidth * SANTA_X;
    // With reduced motion the scenery does not scroll: the city is shown under the sleigh right away.
    const visibleX = reducedMotion.matches ? arrival : x;
    populateProps(visibleX);
    el.world.style.transform = 'translate3d(' + -visibleX.toFixed(1) + 'px,0,0)';
    if (!reducedMotion.matches) {
      el.hillsFar.style.backgroundPositionX = (-backdrop * 0.12).toFixed(1) + 'px';
      el.hillsNear.style.backgroundPositionX = (-backdrop * 0.3).toFixed(1) + 'px';
    }
    const progress = Math.max(0, Math.min(1, 1 - (arrival - x) / DISTANCE));
    el.fill.style.width = (progress * 100).toFixed(1) + '%';
  }

  function loop(time) {
    if ($('screen-trip').hidden) {
      loopRunning = false;
      return;
    }
    // Time between frames is capped: if the tab was in the background, the leg resumes
    // where it was instead of jumping ahead.
    const dt = lastTime === null ? 0 : Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;
    advance(dt);
    if (!$('screen-trip').hidden) {
      render();
    }
    requestAnimationFrame(loop);
  }

  // ---------- Sound switch ----------

  const soundToggles = Array.from(document.querySelectorAll('.sound-toggle'));

  function renderSoundToggles() {
    const on = APN.sound.isOn();
    for (const button of soundToggles) {
      button.textContent = on ? '🔊' : '🔇';
      button.setAttribute('aria-pressed', String(on));
    }
  }

  function onSoundToggle() {
    const on = APN.sound.toggle();
    renderSoundToggles();
    if (on && !$('screen-trip').hidden) {
      APN.sound.startMusic(0);
    }
  }

  // ---------- Start-up ----------

  // The deploy job writes "YYYY-MM-DD HH:MM · commit" into the version meta tag; opened from the
  // repository it is empty and nothing is shown.
  function showVersion() {
    const meta = document.querySelector('meta[name="version"]');
    const version = meta ? meta.content.trim() : '';
    if (!version) return;
    console.info('Ayudante de Papá Noel · versión ' + version);
    $('version').textContent = version.replace(/ \d{2}:\d{2}/, '');
    $('version').hidden = false;
  }

  $('cover-sleigh').innerHTML = santaHTML();
  el.santa.innerHTML = santaHTML();
  $('button-start').addEventListener('click', startGame);
  $('button-again').addEventListener('click', startGame);
  el.next.addEventListener('click', onNext);
  for (const button of soundToggles) {
    button.addEventListener('click', onSoundToggle);
  }
  renderSoundToggles();
  showVersion();
  window.addEventListener('resize', measure);
  showScreen('screen-start');
})();
