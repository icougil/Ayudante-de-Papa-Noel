// Counts the questions of each pool, so a batch of new questions can go where the bank is thinnest.
// A pool is a city (the question's place) or a general subject (a question with place "general").
const TARGET = 15;
const GENERAL_SUBJECTS = ['maths', 'science', 'language', 'english', 'catalan', 'citizenship'];

function countPools(questions, stopIds, target = TARGET) {
  const names = [...stopIds, ...GENERAL_SUBJECTS.map((subject) => `general:${subject}`)];
  const pools = new Map(
    names.map((pool) => [
      pool,
      { pool, count: 0, subjects: [], difficulties: { 1: 0, 2: 0, 3: 0 }, belowTarget: true },
    ])
  );

  for (const question of questions) {
    let name;
    if (question.place === 'general') {
      if (!GENERAL_SUBJECTS.includes(question.subject)) {
        throw new Error(
          `question ${question.id}: a general question cannot have the place subject "${question.subject}"`
        );
      }
      name = `general:${question.subject}`;
    } else {
      if (!stopIds.includes(question.place)) {
        throw new Error(`question ${question.id}: place "${question.place}" is not a stop of the level`);
      }
      name = question.place;
    }
    const pool = pools.get(name);
    pool.count += 1;
    pool.difficulties[question.difficulty] += 1;
    if (!pool.subjects.includes(question.subject)) pool.subjects.push(question.subject);
  }

  for (const pool of pools.values()) {
    pool.subjects.sort();
    pool.belowTarget = pool.count < target;
  }
  return [...pools.values()];
}

function main() {
  const APN = require('../js/data-level-1.js');
  require('../js/questions.js');
  const pools = countPools(APN.QUESTIONS, APN.LEVELS[0].stops.map((stop) => stop.id));
  const width = Math.max(...pools.map((p) => p.pool.length));
  for (const p of pools) {
    const d = p.difficulties;
    console.log(
      `${p.pool.padEnd(width)} ${String(p.count).padStart(2)} ${p.belowTarget ? 'below' : 'ok   '}` +
        `  subjects: ${p.subjects.join(', ') || '-'}  difficulty: 1×${d[1]} 2×${d[2]} 3×${d[3]}`
    );
  }
  const below = pools.filter((p) => p.belowTarget).map((p) => p.pool);
  console.log(`Pools below ${TARGET}: ${below.length ? below.join(', ') : 'none'}`);
}

if (require.main === module) main();

module.exports = { countPools, TARGET, GENERAL_SUBJECTS };
