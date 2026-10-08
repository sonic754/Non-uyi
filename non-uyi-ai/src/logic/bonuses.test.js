import { expect, it } from 'vitest';
import { createOrdersCSV, splitBatch } from './messages.js';

it('splits a pasted batch, ignoring empty lines and Windows newlines', () => {
  expect(splitBatch('  first\r\n\r\n second \n')).toEqual(['first','second']);
});

it('CSV contains only orders, quotes multiline text, preserves null quantities and blocks formulas', () => {
  const csv=createOrdersCSV([
    {category:'question',text:'Do not export'},
    {category:'order',text:'=FORMULA("x")\nsecond line',language:'ru',items:[{name:'+cmd',quantity:null}],address:'@test',time:'-1+2',reply:null},
  ]);
  expect(csv.startsWith('\uFEFF')).toBe(true);
  expect(csv).not.toContain('Do not export');
  expect(csv).toContain('"\'=FORMULA(""x"")\nsecond line"');
  expect(csv).toContain('"\'+cmd × —"');
  expect(csv).toContain('"\'@test"');
  expect(csv).toContain('"\'-1+2"');
  expect(csv).not.toContain('null');
});
