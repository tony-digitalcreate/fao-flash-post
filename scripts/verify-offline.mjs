import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const file=path.resolve(process.cwd(),'../../outputs/FAO-Flash-Post-Offline/FAO-Flash-Post-Offline.html');
const html=fs.readFileSync(file,'utf8');
assert.equal((html.match(/<!doctype html>/gi)||[]).length,1);
assert.equal((html.match(/<style>/gi)||[]).length,1);
assert.equal((html.match(/type="module"/gi)||[]).length,1);
assert.doesNotMatch(html,/<(?:script|link)[^>]+(?:src|href)=/i);
assert.match(html,/\.install-panel\{display:none!important\}/);

const bootstrap=html.match(/<script>(globalThis\.__FAO_OFFLINE_ASSETS__=.*?)<\/script>/s)?.[1];
const moduleCode=html.match(/<script type="module">(.*?)<\/script>/s)?.[1];
assert.ok(bootstrap&&moduleCode);
const context={globalThis:{}};
vm.runInNewContext(bootstrap,context);
const assets=context.globalThis.__FAO_OFFLINE_ASSETS__;
assert.deepEqual(Object.keys(assets).sort(),[
  '/assets/fao-right-blue-trim.png','/assets/fao-right-white-trim.png',
  '/assets/fao-un-blue-logo.svg',
  '/assets/fao-un-blue-trim.png','/assets/fao-un-white-trim.png',
]);
for(const encoded of Object.values(assets)){
  assert.match(encoded,/^data:image\/(png|svg\+xml);base64,/);
  const data=Buffer.from(encoded.split(',')[1],'base64');
  if(encoded.startsWith('data:image/png'))assert.deepEqual(Array.from(data.subarray(0,8)),[137,80,78,71,13,10,26,10]);
  else assert.match(data.toString('utf8',0,200),/<svg/);
}
for(const font of html.matchAll(/data:font\/ttf;base64,([A-Za-z0-9+/=]+)/g)){
  const data=Buffer.from(font[1],'base64');
  assert.ok(['00010000','4f54544f'].includes(data.subarray(0,4).toString('hex')));
}
assert.equal((html.match(/data:font\/ttf;base64/g)||[]).length,2);
new vm.Script(moduleCode);
assert.ok(fs.statSync(file).size<2_000_000);
console.log('PASS one HTML file, no network references, supplied blue SVG, embedded logos and fonts, valid JavaScript');
