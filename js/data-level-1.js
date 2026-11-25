// Level 1 data (Spain): the subjects and the cities on the route.
// The questions live in questions/*.json and are generated into js/questions.js (see README).
(function () {
  const APN = (globalThis.APN = globalThis.APN || {});

  APN.SUBJECTS = [
    'geography', 'history', 'sports', 'culture', 'maths', 'science', 'language', 'english',
    'catalan', 'citizenship'
  ];

  APN.LEVELS = [
    {
      id: 1,
      name: 'España',
      stops: [
        { id: 'barcelona', name: 'Barcelona', landmark: 'Sagrada Família' },
        { id: 'zaragoza', name: 'Zaragoza', landmark: 'Basílica del Pilar' },
        { id: 'madrid', name: 'Madrid', landmark: 'Puerta de Alcalá' },
        { id: 'sevilla', name: 'Sevilla', landmark: 'La Giralda' },
        { id: 'santiago', name: 'Santiago de Compostela', landmark: 'Catedral de Santiago' },
        { id: 'bilbao', name: 'Bilbao', landmark: 'Museo Guggenheim' },
      ],
    },
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APN;
  }
})();
