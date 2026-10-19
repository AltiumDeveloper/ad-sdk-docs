import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parameterNames, parameterProblems } from '../scripts/apidocs/lib/model.mjs';

const method = {
  kind: 'method',
  signature: {
    parameters: [{ name: 'argHitX' }, { name: 'argction' }],
    alternate: { parameters: [{ name: 'argHitX' }, { name: 'argExtra' }] },
  },
};

test('parameter names cover every overload, and the index parameters of a property', () => {
  assert.deepEqual(parameterNames(method), ['argHitX', 'argction', 'argExtra']);
  assert.deepEqual(parameterNames({ kind: 'property', indexParameters: [{ name: 'argL' }] }), ['argL']);
});

test('parameter keys must be real parameter names', () => {
  assert.deepEqual(parameterProblems('x', { parameters: { argHitX: 'ok' } }, ['argHitX']), []);
  assert.match(parameterProblems('x', { parameters: { HitX: 'no' } }, ['argHitX'])[0], /no parameter HitX/);
});

test('parameters described in prose are reported, also by a truncated .NET name', () => {
  const names = parameterNames(method);
  assert.match(parameterProblems('x', { remarks: 'The HitX parameter specifies the X coordinate.' }, names)[0], /HitX/);
  assert.match(parameterProblems('x', { remarks: 'The Action parameter specifies the action.' }, names)[0], /Action/);
  assert.match(parameterProblems('x', { remarks: 'Returns an object.\n\nParameters:\n\nnone' }, names)[0], /Parameters:/);
  // Words that are not parameters of the member are prose about something else.
  assert.deepEqual(parameterProblems('x', { remarks: 'The external parameter is read from the file.' }, names), []);
});
