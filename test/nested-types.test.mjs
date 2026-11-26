import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildModel } from '../scripts/apidocs/lib/model.mjs';
import { declaringTypeId, nestedTypes } from '../scripts/apidocs/lib/render.mjs';

const model = buildModel({ metadataPaths: ['metadata/Altium.SDK.json'], namespaces: ['DXP'] });

test('a nested type knows its declaring type', () => {
  assert.equal(declaringTypeId(model.types.get('DXP.NotificationCode.DocumentNotificationCode')), 'DXP.NotificationCode');
  assert.equal(declaringTypeId(model.types.get('DXP.NotificationCode')), null);
});

test('a container lists its nested types, sorted by name', () => {
  const inner = nestedTypes(model, model.types.get('DXP.NotificationCode')).map((t) => t.id);
  assert.ok(inner.includes('DXP.NotificationCode.DocumentNotificationCode'));
  assert.ok(inner.includes('DXP.NotificationCode.ViewNotificationCode'));
  assert.deepEqual(inner, [...inner].sort((a, b) => a.localeCompare(b)));
  assert.deepEqual(nestedTypes(model, model.types.get('DXP.NotificationCode.DocumentNotificationCode')), []);
});
