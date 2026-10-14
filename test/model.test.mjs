import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assignSlugs, effectiveMethods, groupProperties, namedTypes } from '../scripts/apidocs/lib/model.mjs';

const m = (name, returnType = 'void', parameters = []) => ({ name, returnType, parameters });
const p = (type, name = 'arg', direction) => ({ name, type, ...(direction ? { direction } : {}) });
const ext = (name, returnType, parameters = []) => ({
  method: { name, returnType, parameters: [p('SCH.ISch_Component', 'self'), ...parameters], isExtension: true },
  helper: 'SCH.ISch_ComponentHelper',
});

test('typed helper methods replace Internal_ raw methods', () => {
  const methods = effectiveMethods([m('Internal_GetState_SchDesignator', 'object')], [ext('GetState_SchDesignator', 'SCH.ISch_Designator')]);
  assert.deepEqual(methods.map((x) => [x.name, x.returnType, x.extension]), [['GetState_SchDesignator', 'SCH.ISch_Designator', 'SCH.ISch_ComponentHelper']]);
});

test('a typed overload keeps the untyped interface method as an alternate', () => {
  const [method] = effectiveMethods([m('SetState_Orientation', 'void', [p('int')])], [ext('SetState_Orientation', 'void', [p('SCH.TRotationBy90')])]);
  assert.equal(method.parameters[0].type, 'SCH.TRotationBy90');
  assert.equal(method.alternate.parameters[0].type, 'int');
});

test('a helper with the same signature does not duplicate the interface method', () => {
  const [method] = effectiveMethods([m('GetState_PinColor', 'int')], [ext('GetState_PinColor', 'int')]);
  assert.equal(method.extension, undefined);
  assert.equal(method.alternate, undefined);
});

test('GetState_/SetState_ pairs become one property; a lone GetState_ is read-only', () => {
  const { properties, methods } = groupProperties([
    m('GetState_Orientation', 'SCH.TRotationBy90'), m('SetState_Orientation', 'void', [p('SCH.TRotationBy90')]),
    m('GetState_AliasCount', 'int'), m('AddPart'),
  ]);
  assert.deepEqual(properties.map((x) => [x.name, x.type, Boolean(x.getter), Boolean(x.setter)]),
    [['Orientation', 'SCH.TRotationBy90', true, true], ['AliasCount', 'int', true, false]]);
  assert.deepEqual(methods.map((x) => x.name), ['AddPart']);
});

test('indexed accessors keep their index parameters', () => {
  const { properties } = groupProperties([m('GetState_AliasAt', 'string', [p('int', 'index')]), m('SetState_AliasAt', 'void', [p('int', 'index'), p('string', 'value')])]);
  assert.equal(properties[0].indexParameters[0].name, 'index');
});

test('plain Get/Set only pair when the types match, and never alone', () => {
  const { properties, methods } = groupProperties([
    m('GetModified', 'bool'), m('SetModified', 'void', [p('bool')]),
    m('GetCurrentSchDocument', 'SCH.ISch_Document'),
    m('GetName', 'string'), m('SetName', 'void', [p('int')]),
  ]);
  assert.deepEqual(properties.map((x) => x.name), ['Modified']);
  assert.deepEqual(methods.map((x) => x.name).sort(), ['GetCurrentSchDocument', 'GetName', 'SetName']);
});

test('accessors with ref/out parameters or no value are methods', () => {
  const { properties } = groupProperties([m('GetState_Bounds', 'bool', [p('int', 'x', 'out')]), m('SetState_FilterAll')]);
  assert.equal(properties.length, 0);
});

test('slugs are unique case-insensitively and never start with an underscore', () => {
  const members = assignSlugs([
    { kind: 'property', name: 'Location' }, { kind: 'method', name: 'Location' },
    { kind: 'method', name: '_Finalize' }, { kind: 'method', name: 'location' },
  ]);
  assert.deepEqual(members.map((x) => x.slug), ['Location', 'Location-method', 'Finalize-method', 'location-method-2']);
});

test('namedTypes extracts the type names of a signature type', () => {
  assert.deepEqual(namedTypes('SCH.ISch_Pin[]'), ['SCH.ISch_Pin']);
  assert.deepEqual(namedTypes('System.Collections.Generic.HashSet<SCH.TObjectId>'), ['System.Collections.Generic.HashSet', 'SCH.TObjectId']);
  assert.deepEqual(namedTypes('int'), []);
});
