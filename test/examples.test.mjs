import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseExample } from '../scripts/apidocs/lib/examples.mjs';

test('an example is its title, its using lines and the code between the markers, dedented', () => {
  const source = [
    '// Count the pads on the current board',
    'using System;',
    'using System.IO;',
    'using PCB;',
    '',
    'static partial class Examples',
    '{',
    '    static void Run()',
    '    {',
    '        // <example>',
    '        int n = 0;',
    '        if (n == 0)',
    '            return;',
    '        // </example>',
    '    }',
    '}',
  ].join('\n');
  const { title, code } = parseExample(source);
  assert.equal(title, 'Count the pads on the current board');
  assert.equal(code, 'using System.IO;\nusing PCB;\n\nint n = 0;\nif (n == 0)\n    return;');
});

test('an example without markers is rejected', () => {
  assert.throws(() => parseExample('// title\nint x;'), /markers/);
});
