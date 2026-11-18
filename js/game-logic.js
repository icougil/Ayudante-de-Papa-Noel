// Game logic: pure functions that never touch the page.
// `rng` is always a function returning a number in [0, 1), like Math.random.
(function () {
  const APN = (globalThis.APN = globalThis.APN || {});

  APN.STOPS_PER_LEVEL = 6;
  APN.MIN_TO_PASS = 3;
  APN.TURBO_STREAK = 3;
  APN.FLIGHT_SECONDS = 20;
  APN.TURBO_FLIGHT_SECONDS = 14;
  APN.MAX_STARS = 5;
  APN.EXPRESS_FOR_FIFTH_STAR = 6;

  APN.MISHAPS = [
    { id: 'storm', emoji: '🌨️', text: '¡Tormenta de nieve! El regalo se ha perdido.' },
    { id: 'reindeer', emoji: '🤧', text: '¡Un reno se ha resfriado! El regalo no llega a tiempo.' },
    { id: 'drop', emoji: '📦', text: '¡El regalo se ha caído del trineo!' },
  ];

  const NOT_ENOUGH_MESSAGE = 'Not enough questions for this level and age';

  function randomIndex(length, rng) {
    return Math.min(length - 1, Math.floor(rng() * length));
  }

  const MAX_CATALAN_PER_GAME = 2;

  // One question per city, alternating "about the place" and "general". Among each turn's
  // candidates it prefers (1) at most two Catalan questions in the game, (2) a subject not
  // yet used, (3) no topic shared with a picked question. When no candidate meets every
  // rule it drops rule 3 first, then rule 2, then rule 1.
  APN.pickQuestions = function (level, bank, age, rng) {
    const valid = bank.filter((q) => q.minAge <= age && age <= q.maxAge);
    const general = valid.filter((q) => q.place === 'general');
    const placeOnEven = rng() < 0.5;
    const picks = [];

    function narrow(candidates) {
      const catalan = picks.filter((q) => q.lang === 'ca').length;
      const subjects = new Set(picks.map((q) => q.subject));
      const topics = new Set(picks.flatMap((q) => q.topics || []));
      const rules = [
        (q) => q.lang !== 'ca' || catalan < MAX_CATALAN_PER_GAME,
        (q) => !subjects.has(q.subject),
        (q) => !(q.topics || []).some((t) => topics.has(t)),
      ];
      for (let used = rules.length; used >= 0; used--) {
        const active = rules.slice(0, used);
        const fitting = candidates.filter((q) => active.every((rule) => rule(q)));
        if (fitting.length > 0) {
          return fitting;
        }
      }
      return candidates;
    }

    return level.stops.map((stop, i) => {
      const placeTurn = (i % 2 === 0) === placeOnEven;
      const candidates = placeTurn ? valid.filter((q) => q.place === stop.id) : general;
      if (candidates.length === 0) {
        throw new Error(NOT_ENOUGH_MESSAGE);
      }
      const fitting = narrow(candidates);
      const picked = fitting[randomIndex(fitting.length, rng)];
      if (!placeTurn) {
        general.splice(general.indexOf(picked), 1);
      }
      picks.push(picked);
      return picked;
    });
  };

  // A copy of the question with its options in a different order.
  APN.shuffleOptions = function (question, rng) {
    const order = question.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1, rng);
      [order[i], order[j]] = [order[j], order[i]];
    }
    return {
      ...question,
      options: order.map((i) => question.options[i]),
      correct: order.indexOf(question.correct),
    };
  };

  APN.createGame = function (questions) {
    return { questions, index: 0, delivered: 0, express: 0, streak: 0, finished: false };
  };

  APN.answer = function (state, option, beforeArrival) {
    if (state.finished) {
      throw new Error('The game is already over');
    }
    const correct = option === state.questions[state.index].correct;
    const express = correct && beforeArrival === true;
    const streak = correct ? state.streak + 1 : 0;
    const index = state.index + 1;
    return {
      state: {
        ...state,
        index,
        delivered: state.delivered + (correct ? 1 : 0),
        express: state.express + (express ? 1 : 0),
        streak,
        finished: index >= state.questions.length,
      },
      correct,
      express,
      turbo: correct && streak >= APN.TURBO_STREAK,
    };
  };

  // Stars: one for passing, one more per extra gift. The last one needs every gift delivered
  // and every delivery express.
  function starsFor(state, passed) {
    if (!passed) {
      return 0;
    }
    const fullRun = state.delivered === state.questions.length;
    if (fullRun && state.express >= APN.EXPRESS_FOR_FIFTH_STAR) {
      return APN.MAX_STARS;
    }
    return state.delivered - APN.MIN_TO_PASS + 1;
  }

  APN.result = function (state) {
    const passed = state.delivered >= APN.MIN_TO_PASS;
    return {
      delivered: state.delivered,
      express: state.express,
      total: state.questions.length,
      passed,
      stars: starsFor(state, passed),
      maxStars: APN.MAX_STARS,
      missing: passed ? 0 : APN.MIN_TO_PASS - state.delivered,
    };
  };

  APN.pickMishap = function (rng) {
    return APN.MISHAPS[randomIndex(APN.MISHAPS.length, rng)];
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APN;
  }
})();
