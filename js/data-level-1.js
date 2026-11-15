// Level 1 data (Spain): the cities on the route and the question bank.
// To add a question, copy an existing one and change its fields (see README).
(function () {
  const APN = (globalThis.APN = globalThis.APN || {});

  APN.SUBJECTS = ['geography', 'history', 'sports', 'culture', 'maths', 'science', 'language', 'english'];

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

  const q = (id, subject, place, prompt, options, correct, explanation) => ({
    id, minAge: 10, maxAge: 12, subject, place, prompt, options, correct, explanation,
  });

  APN.QUESTIONS = [
    // --- Barcelona ---
    q('barcelona-1', 'geography', 'barcelona', '¿Qué mar baña la costa de Barcelona?',
      ['Mar Cantábrico', 'Mar Mediterráneo', 'Océano Atlántico', 'Mar Negro'], 1,
      'Barcelona está a orillas del mar Mediterráneo.'),
    q('barcelona-2', 'culture', 'barcelona', '¿Qué arquitecto diseñó la Sagrada Família?',
      ['Pablo Picasso', 'Salvador Dalí', 'Antoni Gaudí', 'Joan Miró'], 2,
      'Antoni Gaudí dedicó más de 40 años de su vida a la Sagrada Família.'),
    q('barcelona-3', 'sports', 'barcelona', '¿En qué año se celebraron los Juegos Olímpicos de Barcelona?',
      ['1992', '1982', '1996', '2000'], 0,
      'Barcelona fue la sede de los Juegos Olímpicos de verano de 1992.'),

    // --- Zaragoza ---
    q('zaragoza-1', 'geography', 'zaragoza', '¿Qué río pasa por la ciudad de Zaragoza?',
      ['Tajo', 'Duero', 'Guadalquivir', 'Ebro'], 3,
      'El Ebro cruza Zaragoza y pasa junto a la Basílica del Pilar.'),
    q('zaragoza-2', 'geography', 'zaragoza', '¿De qué comunidad autónoma es capital Zaragoza?',
      ['Aragón', 'Navarra', 'La Rioja', 'Castilla y León'], 0,
      'Zaragoza es la capital de Aragón.'),
    q('zaragoza-3', 'history', 'zaragoza', 'Zaragoza se llamó Caesaraugusta. ¿Qué pueblo le puso ese nombre?',
      ['Los griegos', 'Los romanos', 'Los visigodos', 'Los fenicios'], 1,
      'Los romanos la llamaron así en honor al emperador César Augusto.'),

    // --- Madrid ---
    q('madrid-1', 'geography', 'madrid', '¿Qué río pasa por Madrid?',
      ['Ebro', 'Júcar', 'Manzanares', 'Miño'], 2,
      'El Manzanares es el río que atraviesa la ciudad de Madrid.'),
    q('madrid-2', 'culture', 'madrid', '¿Cuál de estos museos está en Madrid?',
      ['Museo del Louvre', 'Museo Británico', 'Museo Guggenheim', 'Museo del Prado'], 3,
      'El Museo del Prado guarda cuadros de Velázquez, Goya y muchos otros pintores.'),
    q('madrid-3', 'culture', 'madrid', '¿Qué animal aparece junto a un madroño en el escudo de Madrid?',
      ['Un oso', 'Un león', 'Un águila', 'Un toro'], 0,
      'El oso y el madroño son el símbolo de Madrid y tienen una estatua en la Puerta del Sol.'),

    // --- Sevilla ---
    q('sevilla-1', 'geography', 'sevilla', '¿Qué río pasa por Sevilla?',
      ['Guadiana', 'Guadalquivir', 'Tajo', 'Segura'], 1,
      'El Guadalquivir pasa por Sevilla, junto a la Torre del Oro.'),
    q('sevilla-2', 'geography', 'sevilla', '¿De qué comunidad autónoma es capital Sevilla?',
      ['Extremadura', 'Región de Murcia', 'Andalucía', 'Castilla-La Mancha'], 2,
      'Sevilla es la capital de Andalucía.'),
    q('sevilla-3', 'history', 'sevilla', 'La Giralda se construyó como torre de una mezquita. ¿Quiénes la levantaron?',
      ['Los romanos', 'Los vikingos', 'Los griegos', 'Los musulmanes'], 3,
      'La levantaron los musulmanes en el siglo XII; después se convirtió en el campanario de la catedral.'),

    // --- Santiago de Compostela ---
    q('santiago-1', 'culture', 'santiago', '¿Cómo se llama la ruta que siguen los peregrinos hasta Santiago de Compostela?',
      ['El Camino de Santiago', 'La Ruta de la Seda', 'La Senda del Oso', 'El Camino del Inca'], 0,
      'El Camino de Santiago lo recorren cada año miles de peregrinos a pie o en bicicleta.'),
    q('santiago-2', 'geography', 'santiago', '¿En qué comunidad autónoma está Santiago de Compostela?',
      ['Asturias', 'Cantabria', 'Galicia', 'País Vasco'], 2,
      'Santiago de Compostela es la capital de Galicia.'),
    q('santiago-3', 'culture', 'santiago', 'Además del castellano, ¿qué lengua es oficial en Galicia?',
      ['Euskera', 'Gallego', 'Catalán', 'Aranés'], 1,
      'En Galicia son oficiales el gallego y el castellano.'),

    // --- Bilbao ---
    q('bilbao-1', 'geography', 'bilbao', '¿Qué mar baña la costa del País Vasco?',
      ['Mar Mediterráneo', 'Mar del Norte', 'Mar Báltico', 'Mar Cantábrico'], 3,
      'El mar Cantábrico baña toda la costa norte de España.'),
    q('bilbao-2', 'culture', 'bilbao', 'En el País Vasco, ¿qué personaje trae los regalos en Navidad?',
      ['El Olentzero', 'El Apalpador', 'El Tió de Nadal', 'La Befana'], 0,
      'El Olentzero es un carbonero que baja del monte en Nochebuena para repartir regalos.'),
    q('bilbao-3', 'sports', 'bilbao', '¿Qué deporte tradicional vasco se juega lanzando una pelota contra un frontón?',
      ['Petanca', 'Bádminton', 'Pelota vasca', 'Críquet'], 2,
      'En la pelota vasca se golpea la pelota contra la pared del frontón.'),

    // --- General: maths ---
    q('general-1', 'maths', 'general', 'Papá Noel reparte 240 regalos a partes iguales entre 6 trineos. ¿Cuántos lleva cada uno?',
      ['30', '40', '46', '60'], 1,
      '240 entre 6 son 40, porque 6 × 40 = 240.'),
    q('general-2', 'maths', 'general', '¿Cuánto son tres cuartos (3/4) de 100?',
      ['25', '34', '70', '75'], 3,
      'Un cuarto de 100 es 25, así que tres cuartos son 3 × 25 = 75.'),
    q('general-3', 'maths', 'general', 'Un rectángulo mide 8 cm de largo y 5 cm de ancho. ¿Cuál es su área?',
      ['40 cm²', '26 cm²', '13 cm²', '45 cm²'], 0,
      'El área de un rectángulo es largo por ancho: 8 × 5 = 40 cm².'),
    q('general-4', 'maths', 'general', '¿Cuál de estos números es primo?',
      ['15', '21', '17', '27'], 2,
      '17 solo se puede dividir entre 1 y entre 17; los otros tres se pueden dividir entre 3.'),

    // --- General: science ---
    q('general-5', 'science', 'general', '¿Qué planeta se conoce como el planeta rojo?',
      ['Venus', 'Marte', 'Júpiter', 'Saturno'], 1,
      'Marte se ve rojizo porque su suelo tiene mucho óxido de hierro.'),
    q('general-6', 'science', 'general', '¿Qué gas del aire necesitamos respirar para vivir?',
      ['Helio', 'Dióxido de carbono', 'Hidrógeno', 'Oxígeno'], 3,
      'Al respirar tomamos oxígeno del aire y expulsamos dióxido de carbono.'),
    q('general-7', 'science', 'general', '¿Qué órgano bombea la sangre por todo el cuerpo?',
      ['El corazón', 'Los pulmones', 'El hígado', 'El estómago'], 0,
      'El corazón es un músculo que impulsa la sangre por todo el cuerpo.'),

    // --- General: Spanish language ---
    q('general-8', 'language', 'general', '¿Qué tipo de palabra es «rápidamente»?',
      ['Adjetivo', 'Sustantivo', 'Adverbio', 'Verbo'], 2,
      'Es un adverbio de modo: dice cómo se hace la acción.'),
    q('general-9', 'language', 'general', '¿Cuál de estas palabras es esdrújula?',
      ['Camión', 'Música', 'Árbol', 'Reloj'], 1,
      '«Música» lleva la sílaba tónica en la antepenúltima sílaba: MÚ-si-ca.'),

    // --- General: English ---
    q('general-10', 'english', 'general', 'What is the opposite of «cold»?',
      ['Big', 'Slow', 'Wet', 'Hot'], 3,
      '«Cold» significa frío y su contrario es «hot», caliente.'),
    q('general-11', 'english', 'general', 'Which month comes after November?',
      ['December', 'October', 'January', 'September'], 0,
      'Después de «November» (noviembre) viene «December» (diciembre).'),
    q('general-12', 'english', 'general', 'What is the past simple of the verb «go»?',
      ['Goed', 'Gone', 'Went', 'Going'], 2,
      '«Go» es un verbo irregular: su pasado simple es «went».'),
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APN;
  }
})();
