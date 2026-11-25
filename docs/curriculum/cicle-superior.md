# Curriculum reference: cicle superior (5è i 6è)

This is the reference for everyone who writes questions for the game. It says which official
curriculum the bank follows, which sabers of the cicle superior can become questions, and which
facts are out of scope. The batch skill (`write-question-batch`) links here, and every batch must
use it before writing.

The official documents are in Catalan. The sabers below are paraphrased in English; the linked
documents are the authority.

## The official curriculum

- **Decret 175/2022, de 27 de setembre, d'ordenació dels ensenyaments de l'educació bàsica**
  (DOGC 8762, 29/09/2022). It is the current primary curriculum in Catalonia.
- Primary has six courses in three cycles. **5è and 6è are the cicle superior.**
- The cycles are **1r-2n** (1st and 2nd of primary, ages 6-8), **3r-4t** (3rd and 4th, ages 8-10)
  and **5è-6è** (5th and 6th, ages 10-12). "1r-2n" is not ESO (12-16) and not infantil (3-6).
- The decree defines the **sabers by cycle, not by course**. There is no official list of "6è
  content" separate from 5è; the split between the two courses is a school decision. The project's
  `difficulty` labels are a project convention, not a curriculum split: **1** is a direct recall of
  a saber, **2** applies or relates two sabers, **3** is two steps, a less obvious application or a
  justification.
- The curriculum is competency-based: key competences, specific competences of each area,
  assessment criteria, sabers and learning situations. A saber is not a list of facts to memorise.
  A question is curricular when its fact is a **canonical example** or a **direct application** of
  a cicle superior saber.
- "A child could know it from daily life" is **not** a criterion. A fact that is not an application
  of a saber is out, even if it is famous.

Official links:

- [Decret 175/2022 (DOGC)](https://portaldogc.gencat.cat/utilsEADOP/PDF/8762/2116761.pdf)
- [XTEC — Currículum 175/2022, primària](https://xtec.gencat.cat/ca/curriculum/primaria/curriculum-175-2022)
- [Coneixement del Medi Natural, Social i Cultural](https://xtec.gencat.cat/web/.content/curriculum/primaria/curriculum-175-2022/Coneixement-del-Medi-Natural-Social-i-Cultural.pdf)
- [Matemàtiques](https://xtec.gencat.cat/web/.content/curriculum/primaria/curriculum-175-2022/Matematiques.pdf)
- [Llengua Catalana i Literatura, Llengua Castellana i Literatura](https://xtec.gencat.cat/web/.content/curriculum/primaria/curriculum-175-2022/Aranes-Castella-Catala.pdf)
- [Llengua Estrangera](https://xtec.gencat.cat/web/.content/curriculum/primaria/curriculum-175-2022/Llengua-Estrangera.pdf)
- [Educació Artística](https://xtec.gencat.cat/web/.content/curriculum/primaria/curriculum-175-2022/Educacio-Artistica.pdf)
- [Educació Física](https://xtec.gencat.cat/web/.content/curriculum/primaria/curriculum-175-2022/Educacio-Fisica.pdf)
- [Educació en Valors Cívics i Ètics](https://xtec.gencat.cat/web/.content/curriculum/primaria/curriculum-175-2022/Educacio-en-Valors-Civics-i-Etics.pdf)

## The rule

Before writing a question, answer these four questions:

1. Which `area` and `block` below does this fact belong to?
2. Is that block in the cicle superior list?
3. Is the fact a canonical example or a direct application of the saber, or is it trivia?
4. Is it on the amber list at the end of this document?

If 1-3 have no good answer, choose another fact. If 4 is yes, the fact can only be the batch's one
review/general-culture question, marked in the PR. The area and block are the required `curriculum`
field of the question and the anchor shown in the batch review table. Do not use a competence code:
a multiple-choice question checks a saber, it does not demonstrate a whole competence.

## Areas and blocks

These are the ids to use. The area is the official area; the block is the official saber block.

| Area id | Official area |
|---|---|
| `medi` | Coneixement del Medi Natural, Social i Cultural |
| `matematiques` | Matemàtiques |
| `llengua-catalana` | Llengua Catalana i Literatura |
| `llengua-castellana` | Llengua Castellana i Literatura |
| `llengua-estrangera` | Llengua Estrangera |
| `educacio-artistica` | Educació Artística |
| `educacio-fisica` | Educació Física |
| `valors-civics` | Educació en Valors Cívics i Ètics |

| Area id | Block ids |
|---|---|
| `medi` | `cultura-cientifica`, `tecnologia-i-digitalitzacio`, `societats-i-territoris`, `consciencia-ecosocial` |
| `matematiques` | `sentit-numeric`, `sentit-de-la-mesura`, `sentit-espacial`, `sentit-algebraic`, `sentit-estocastic` |
| `llengua-catalana` | `les-llengues-i-els-seus-parlants`, `comunicacio-oral`, `comprensio-lectora`, `expressio-escrita`, `alfabetitzacio-informacional`, `educacio-literaria`, `reflexio-sobre-la-llengua` |
| `llengua-castellana` | same as `llengua-catalana` |
| `llengua-estrangera` | same as `llengua-catalana` |
| `educacio-artistica` | `musica`, `plastica-i-visual`, `audiovisual`, `arts-esceniques` |
| `educacio-fisica` | `resolucio-de-problemes-motrius`, `vida-activa-i-saludable`, `activitats-ludiques-culturals-i-expressives`, `interaccio-amb-l-entorn`, `autoregulacio-emocional` |
| `valors-civics` | `autoconeixement-i-autonomia-moral`, `societat-justicia-i-democracia`, `sostenibilitat-i-etica-ambiental`, `educacio-emocional` |

`matematiques` also has a `sentit-socioemocional` block (attitudes and teamwork). It is not used as
a question anchor.

In a question, the anchor is the required `curriculum` field:

```json
"curriculum": { "area": "medi", "block": "societats-i-territoris" }
```

The build rejects a missing field, an unknown area or block, a block from another area, an area
that does not match the subject, and unknown fields inside it.

## Area by area

### `medi` — Coneixement del Medi Natural, Social i Cultural

**Sabers in the cicle superior**

- `cultura-cientifica`: scientific inquiry and vocabulary; science, technology, engineering and
  maths as human activities; life on the planet (matter and energy flow in ecosystems, food webs,
  human vital functions, puberty and adolescence, health and rest habits); matter, forces and
  energy (density and floating, reversible and irreversible changes, electrical circuits, energy
  sources, aerodynamics).
- `tecnologia-i-digitalitzacio`: devices and digital resources; searching, selecting and checking
  information; security, privacy and digital identity; computational thinking; design projects
  (empathise, define, ideate, prototype, evaluate).
- `societats-i-territoris`: Earth as a system; atmosphere and climate; geography of Catalonia,
  Spain and Europe; maps, plans and scales; population and migrations; territorial organisation of
  Spain and the European Union; medieval, modern and contemporary history; historical sources;
  heritage; democracy and the Constitution of 1978; civic literacy; inequalities and gender.
- `consciencia-ecosocial`: climate change; human impact on ecosystems; sustainable consumption;
  limited resources; ecological footprint; the Sustainable Development Goals.

**Can be asked**

- Food webs, producers/consumers/decomposers, photosynthesis as part of the ecosystem.
- Human vital functions: nutrition, respiration, circulation, relation with the environment,
  reproduction; puberty and health habits.
- Density and floating, changes of state, electrical circuits, energy sources, aerodynamics.
- Climate, landscapes, population, migrations, map scales, Catalonia/Spain/Europe geography.
- Medieval, modern and contemporary history; the Constitution of 1978; heritage; the role of
  women, children and poor people in history.
- Sustainable consumption, climate change, human impact, the SDGs; the social value of taxes and
  the responsibility of companies.
- Diversity of languages and identities in Spain; the main institutions and the EU.

**Not the target**

- Prehistory and Ancient History as a period: they are in 3r-4t, not in the cicle superior.
- The solar system, planets, seasons, Earth's rotation and revolution: they are in 1r-2n. Space
  exploration, space debris and light pollution are in 5è-6è, but the planets are not.
- Long lists of bones, species or dates. The saber is the relation, not the list.
- Specific articles of laws or current party politics (see `valors-civics`).

### `matematiques` — Matemàtiques

**Sabers in the cicle superior**

- `sentit-numeric`: counting strategies; quantity; mental calculation; operations with natural
  numbers and decimals to thousandths; powers, squares and cubes; fractions, percentages and
  decimals; divisibility, divisors and multiples; financial education (prices, discounts, taxes,
  interest); proportional reasoning.
- `sentit-de-la-mesura`: units of length, mass, capacity, surface, volume, time and angles; measuring
  instruments; estimates and equivalences in the metric system.
- `sentit-espacial`: 2D and 3D shapes and their properties; location and representation on plans and
  maps, scales; movements and transformations (turns, translations, symmetries); area and perimeter.
- `sentit-algebraic`: patterns; mathematical models; equality and inequality with `<`, `>`, `=`,
  `≠`; an unknown represented by a letter or symbol; computational thinking.
- `sentit-estocastic`: collecting and organising data; graphs; absolute frequency, mode, mean and
  median; probability of simple events.
- `sentit-socioemocional`: attitudes and teamwork. Not suitable for a quiz; do not use it as an
  anchor for a question.

**Can be asked**

- Fractions, percentages and decimals; powers and squares/cubes; divisibility, divisors and
  multiples; proportionality and scales; area and perimeter; statistics; probability; money and
  discounts; patterns; a simple unknown with a letter.
- A two-step problem that combines two of these sabers.

**Not the target**

- Formal equations, negative numbers, roots or trigonometry: they are not in the cicle superior.

### `llengua-catalana`, `llengua-castellana`, `llengua-estrangera`

**Sabers in the cicle superior**

- `les-llengues-i-els-seus-parlants`: linguistic diversity; the languages of the environment and of
  Spain; prejudice and stereotypes about languages.
- `comunicacio-oral`: understanding and producing oral texts in different contexts; communicative
  situation; register; non-verbal communication.
- `comprensio-lectora`: reading strategies before, during and after reading; types of text;
  inference.
- `expressio-escrita`: planning, writing, revising and editing texts; spelling; punctuation;
  presentation.
- `alfabetitzacio-informacional`: searching, selecting and checking information; facts vs opinions;
  authorship and reliability.
- `educacio-literaria`: reading works and fragments; genres; elements of a literary work (theme,
  protagonist, characters, plot, setting); links with other arts.
- `reflexio-sobre-la-llengua`: basic metalanguage; oral vs written language; punctuation; formal,
  semantic and syntactic relations between words; sentence types; cohesion; basic spelling and
  grammar rules.

For `llengua-estrangera`, the same blocks apply with basic vocabulary of personal identification,
close relationships, places and immediate environments, leisure and daily life, and basic
sociocultural aspects of the countries where the language is spoken.

**Can be asked**

- Spelling, accentuation, punctuation, word classes, sentence types, cohesion, vocabulary.
- Reading comprehension of a short text; literary genres and elements of a work.
- English basic vocabulary, months and calendar, simple sentences, sociocultural facts.

**Not the target**

- Author biographies, birthplaces or exact dates of works as trivia.
- Lists of irregular verbs as an end in themselves. Grammar is a means; the target is basic
  vocabulary and simple sentences in context.

### `educacio-artistica` — Educació Artística

**Sabers in the cicle superior**

- `musica`: listening to and describing music from different periods and cultures; sound qualities;
  families of instruments and groups; character and tempo; silence; creating and performing.
- `plastica-i-visual`: observing and describing works from different periods, places and cultures;
  visual language (point, line, colour, texture, plane); materials and techniques; cultural spaces.
- `audiovisual`: audiovisual language, genres and formats; creating simple audiovisual stories.
- `arts-esceniques`: body expression; genres (theatre, circus, dance, shadow theatre, musical
  theatre, mime); staging elements.

**Can be asked**

- Museums and cultural spaces; observing and describing a work; visual language; instrument
  families; tempo and character; audiovisual genres; performing arts genres.

**Not the target**

- Artist birthplaces, biographies or exact dates of works as trivia.
- Film or celebrity trivia.

### `educacio-fisica` — Educació Física

**Sabers in the cicle superior**

- `resolucio-de-problemes-motrius`: motor challenges; body schema (main muscles, bones and joints);
  balance, laterality, coordination; warm-up and stretching.
- `vida-activa-i-saludable`: health benefits of physical activity; hygiene; equipment; posture;
  balanced diet; hydration; rest; safety and basic first aid.
- `activitats-ludiques-culturals-i-expressives`: traditional and popular games; pre-sports, reduced
  and adapted sports; alternative sports; women athletes as references; body expression and dance.
- `interaccio-amb-l-entorn`: physical activity in leisure time, in the neighbourhood or in nature.
- `autoregulacio-emocional`: emotions, teamwork, conflict resolution, body image and stereotypes.

**Can be asked**

- Traditional and popular games; adapted or alternative sports; main bones, muscles and joints;
  warm-up, stretching, hydration, rest, healthy diet; basic first aid; women athletes; body
  expression.

**Not the target**

- Club results, stadiums, trophies, transfers or derbies: they are current affairs, not PE.
- The history of the Olympic Games as PE. A 1992 Barcelona Olympics fact can be contemporary
  history (`medi`, `societats-i-territoris`), not a PE question.

### `valors-civics` — Educació en Valors Cívics i Ètics

This area is taught in 5è or 6è. Its game pool is `citizenship`.

**Sabers in the cicle superior**

- `autoconeixement-i-autonomia-moral`: critical and ethical thinking; identity; autonomy and
  responsibility; ethics and norms; risks of social networks and screen overuse.
- `societat-justicia-i-democracia`: dialogue and argumentation; law, state, democracy, justice,
  citizenship and human rights; the Universal Declaration of Human Rights and the Convention on the
  Rights of the Child; poverty and child exploitation; NGOs; peace and non-violence.
- `sostenibilitat-i-etica-ambiental`: care for living beings and nature; human impact; sustainability
  of lifestyles; climate change; circular economy; responsible consumption; water, energy, mobility
  and waste; the SDGs.
- `educacio-emocional`: recognising and regulating emotions; self-esteem; healthy relationships;
  empathy; abuse and bullying.

**Can be asked**

- Human rights and children's rights; democracy and justice; poverty and child exploitation; NGOs;
  peace; climate change and sustainable consumption; emotions and healthy relationships; digital
  risks.

**Not the target**

- Current party politics, specific politicians or the articles of a law. The area works with
  principles, not with current affairs.
- Sexual education. It is part of the area, but it is not a question topic for this game.

## Mapping the game's subjects

The pool (`geography`, `history`, …) chooses which questions compete for a turn; the **area** is
where the fact belongs. A place question still names the area of the fact, not the pool.

| Game subject | Area | Usual blocks |
|---|---|---|
| `geography` | `medi` | `societats-i-territoris`, `consciencia-ecosocial` |
| `history` | `medi` | `societats-i-territoris` |
| `science` | `medi` | `cultura-cientifica`, `consciencia-ecosocial` |
| `maths` | `matematiques` | any of the five blocks except the socio-emotional one |
| `language` | `llengua-castellana` | any language block |
| `catalan` | `llengua-catalana` | any language block |
| `english` | `llengua-estrangera` | any language block |
| `citizenship` | `valors-civics` | any of the four blocks |
| `culture` | `educacio-artistica` or `medi` | arts, or heritage, traditions and languages |
| `sports` | `educacio-fisica` or `medi` | PE, or traditional games and heritage |

`tecnologia-i-digitalitzacio` is a block of `medi`, not a separate area. A digital question goes
there.

## Amber list: review and general culture

These facts are not cicle superior targets, or only review. The game is not an exam, so a batch may
include **at most one** question from this list (one in ten), as its review/general-culture
question, and the pull request must say so. The rest of the batch stays anchored to the sabers
above. Do not use this list to fill a thin pool. The first bank already contains a few of these;
they stay as review questions.

| Fact type | Why it is not a target | Where it belongs |
|---|---|---|
| Prehistory and Ancient History (Rome, Egypt, Greece) as a period | The cicle superior covers medieval, modern and contemporary history | 3r-4t |
| Solar system, planets, seasons, Earth's rotation and revolution | Astronomy is introduced in the first cycle | 1r-2n |
| Club football/basketball: stadiums, trophies, derbies, transfers | Not a saber of Educació Física | Current affairs |
| Shields, flags, coats of arms and heraldry | Not in the sabers | Local trivia |
| Artist birthplaces, biographies and exact dates of works | Art is observation and description, not biography | Trivia |
| Lists of irregular verbs as an end | Grammar is a means; basic vocabulary and simple sentences are the target | Textbook content |
| World records, "the largest/tallest/oldest" facts | Not a saber | Trivia |
| Specific articles of laws, current politicians, party politics | The area works with principles, not current affairs | Too detailed |

A fact on this list can be the batch's one review question, or the **context** of a valid question,
but never the main content of a batch. For example, a Roman monument can be the object of a heritage
question ("what is it used for today?"), not a date question about the Roman period. If a fact is
also wrong, too specialised or impossible to check, drop it.

## Checklist for a batch

For every question:

- [ ] I can name its `area` and `block` from this document.
- [ ] The JSON has a valid `curriculum` field with that area and block.
- [ ] The block is in the cicle superior list.
- [ ] The fact is a canonical example or a direct application of the saber, not trivia.
- [ ] If the fact is on the amber list, it is the batch's one review question and the PR says so.
- [ ] The fact has a real, checkable `https` reference.
- [ ] The question does not repeat an existing fact or prompt.

If a row of the review table has no valid `curriculum` area and block, the batch is not ready.

## Coverage

`npm run curriculum` counts the questions of every area/block. Each block has a floor of 3 and is
marked `below` under it, `ok` from 3 to 9, and `high` above 9. The batch skill chooses **blocks
before pools**: every block at 0 first, then 1, then 2. It never adds to a `high` block while any
block is below 3, so the block that already has the most does not grow. For each block it picks a
pool that can host it, at most 1 question per block while any block is below 3 and at most 3 per
pool; it aims for at least 6 different blocks. The block floor wins over the 15-per-pool minimum
when a thin block has no other fitting pool. The 3-per-block floor and the 15-per-pool target are
**minimums**, not a stop: the job keeps adding to the least-covered blocks and pools. When several
pools or blocks tie at the lowest count, the skill picks one at random, so the choice does not
always fall on the first name.

## Maintenance

- If the decree or an area document changes, update this file and its links first.
- A new area or block is added here before it is used in a batch.
- The code lists are in `scripts/curriculum.js`; a test checks that every id appears in this file.
- The build checks the `curriculum` field; `npm run build:questions` regenerates `js/questions.js`.
- The official documents are the authority; this file is the project's map of what can be asked.
