import { readFile, writeFile } from 'node:fs/promises';
import { classifyWithGemini } from './gemini-client.js';

const examples = JSON.parse(await readFile(new URL('./prompt-evaluation.json', import.meta.url), 'utf8'));
const limit = process.argv.includes('--smoke') ? 1 : examples.length;
const results = [];
for (let i = 0; i < limit; i++) {
  const example = examples[i];
  try {
    const actual = await classifyWithGemini(example.message);
    const passed = actual.category === example.category && actual.language === example.language;
    results.push({ index: i + 1, expected: { category: example.category, language: example.language }, actual, passed });
    console.log(`${i + 1}/${limit}: ${passed ? 'PASS' : 'FAIL'} — ${actual.category}, ${actual.language}`);
  } catch (error) {
    console.error(`Пример ${i + 1}: ${error.message}`);
    process.exitCode = 1;
    break;
  }
}
await writeFile(new URL('./evaluation-results.json', import.meta.url), JSON.stringify({
  model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  completed: results.length,
  total: limit,
  passed: results.filter(result => result.passed).length,
  results,
}, null, 2));
console.log(`Совпадений: ${results.filter(result => result.passed).length}/${limit}; выполнено: ${results.length}`);
if (results.some(result => !result.passed)) process.exitCode = 1;
