// Counts the questions of each curriculum block, so a batch can fill the thinnest blocks.
// A block is below the floor when it has fewer than FLOOR questions; a block above HIGH is
// over-represented and a batch should avoid it while another block fits.
const { AREAS } = require('./curriculum.js');

const FLOOR = 3;
const HIGH = 9;

function countCurriculum(questions, areas = AREAS, floor = FLOOR, high = HIGH) {
  const rows = [];
  for (const [area, blocks] of Object.entries(areas)) {
    for (const block of blocks) {
      rows.push({ area, block, count: 0, floor, missing: floor, status: 'below' });
    }
  }
  const byKey = new Map(rows.map((row) => [`${row.area}/${row.block}`, row]));

  for (const question of questions) {
    if (!question.curriculum || !question.curriculum.area || !question.curriculum.block) {
      throw new Error(`question ${question.id}: missing curriculum area or block`);
    }
    const key = `${question.curriculum.area}/${question.curriculum.block}`;
    const row = byKey.get(key);
    if (!row) {
      throw new Error(`question ${question.id}: curriculum "${key}" is not in the list`);
    }
    row.count += 1;
  }

  for (const row of rows) {
    row.missing = Math.max(0, row.floor - row.count);
    row.status = row.count < row.floor ? 'below' : row.count > high ? 'high' : 'ok';
  }
  return rows;
}

function main() {
  const APN = require('../js/data-level-1.js');
  require('../js/questions.js');
  const rows = countCurriculum(APN.QUESTIONS);
  const width = Math.max(...rows.map((row) => `${row.area}/${row.block}`.length), 'block'.length);
  console.log(
    `${'block'.padEnd(width)}  have  floor  missing  status`
  );
  for (const row of rows) {
    console.log(
      `${`${row.area}/${row.block}`.padEnd(width)}  ${String(row.count).padStart(4)}` +
        `  ${String(row.floor).padStart(5)}  ${String(row.missing).padStart(7)}  ${row.status}`
    );
  }

  const areaTotals = new Map();
  for (const row of rows) {
    areaTotals.set(row.area, (areaTotals.get(row.area) || 0) + row.count);
  }
  const below = rows.filter((row) => row.status === 'below');
  const high = rows.filter((row) => row.status === 'high');
  const missing = rows.reduce((sum, row) => sum + row.missing, 0);
  const thinnest = [...rows]
    .sort((a, b) => a.count - b.count || a.area.localeCompare(b.area) || a.block.localeCompare(b.block))
    .slice(0, 5)
    .map((row) => `${row.area}/${row.block} (${row.count})`);

  console.log(`Questions: ${APN.QUESTIONS.length}`);
  console.log(`Areas: ${[...areaTotals].map(([area, count]) => `${area} ${count}`).join(', ')}`);
  console.log(`Blocks below the floor (${FLOOR}): ${below.length}`);
  console.log(`Missing to the floor: ${missing}`);
  console.log(`Thinnest: ${thinnest.join(', ')}`);
  console.log(`High (above ${HIGH}): ${high.length ? high.map((row) => `${row.area}/${row.block} (${row.count})`).join(', ') : 'none'}`);
}

if (require.main === module) main();

module.exports = { countCurriculum, FLOOR, HIGH };
