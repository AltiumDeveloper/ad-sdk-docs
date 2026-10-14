import assert from 'node:assert/strict';
import { test } from 'node:test';
import { methodSignature, typeParameterList, whereClauses } from '../scripts/apidocs/lib/render.mjs';
import { buildModel } from '../scripts/apidocs/lib/model.mjs';

test('generic methods render their type parameters and constraints', () => {
  const sig = {
    name: 'RunSync',
    returnType: 'T',
    genericParameters: [{ name: 'T', constraints: ['class', 'new()'] }],
    parameters: [{ name: 'task', type: 'System.Func<System.Threading.Tasks.Task<T>>' }],
  };
  assert.equal(methodSignature(sig), 'T RunSync<T>(Func<Task<T>> task) where T : class, new();');
});

test('variance is shown only in declarations', () => {
  const params = [{ name: 'TIn', variance: 'in' }, { name: 'TOut', variance: 'out', constraints: ['SCH.ISch_Document'] }];
  assert.equal(typeParameterList(params), '<TIn, TOut>');
  assert.equal(typeParameterList(params, { variance: true }), '<in TIn, out TOut>');
  assert.equal(whereClauses(params), ' where TOut : ISch_Document');
});

test('Nullable<T> is written T?', () => {
  assert.equal(methodSignature({ name: 'Get', returnType: 'System.Nullable<int>', parameters: [] }), 'int? Get();');
});

test('generic types get their real parameter names and a clean file name', () => {
  const model = buildModel({ metadataPaths: ['metadata/Altium.SDK.json'], namespaces: ['Altium.SDK'] });
  const type = model.types.get('Altium.SDK.BaseClientService`1');
  assert.equal(type.name, 'BaseClientService<T>');
  assert.equal(type.file, 'BaseClientService-T');
  assert.deepEqual(type.genericParameters, [{ name: 'T', constraints: ['class'] }]);
});
