// The curriculum anchor: the official areas and saber blocks of the cicle superior (5è i 6è).
// The reference for question writers is docs/curriculum/cicle-superior.md; keep the two in sync.
const LANGUAGE_BLOCKS = [
  'les-llengues-i-els-seus-parlants',
  'comunicacio-oral',
  'comprensio-lectora',
  'expressio-escrita',
  'alfabetitzacio-informacional',
  'educacio-literaria',
  'reflexio-sobre-la-llengua'
];

const AREAS = {
  medi: [
    'cultura-cientifica',
    'tecnologia-i-digitalitzacio',
    'societats-i-territoris',
    'consciencia-ecosocial'
  ],
  matematiques: [
    'sentit-numeric',
    'sentit-de-la-mesura',
    'sentit-espacial',
    'sentit-algebraic',
    'sentit-estocastic'
  ],
  'llengua-catalana': LANGUAGE_BLOCKS,
  'llengua-castellana': LANGUAGE_BLOCKS,
  'llengua-estrangera': LANGUAGE_BLOCKS,
  'educacio-artistica': ['musica', 'plastica-i-visual', 'audiovisual', 'arts-esceniques'],
  'educacio-fisica': [
    'resolucio-de-problemes-motrius',
    'vida-activa-i-saludable',
    'activitats-ludiques-culturals-i-expressives',
    'interaccio-amb-l-entorn',
    'autoregulacio-emocional'
  ],
  'valors-civics': [
    'autoconeixement-i-autonomia-moral',
    'societat-justicia-i-democracia',
    'sostenibilitat-i-etica-ambiental',
    'educacio-emocional'
  ]
};

// The areas a game subject may use. `culture` and `sports` can be art/heritage or PE/current
// society, so they accept two areas; the rest have one.
const SUBJECT_AREAS = {
  geography: ['medi'],
  history: ['medi'],
  sports: ['educacio-fisica', 'medi'],
  culture: ['educacio-artistica', 'medi'],
  maths: ['matematiques'],
  science: ['medi'],
  language: ['llengua-castellana'],
  english: ['llengua-estrangera'],
  catalan: ['llengua-catalana'],
  citizenship: ['valors-civics']
};

module.exports = { AREAS, SUBJECT_AREAS, LANGUAGE_BLOCKS };
