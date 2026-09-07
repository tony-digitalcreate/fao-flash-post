import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync('app/renderPost.ts','utf8').replaceAll('import.meta.env.BASE_URL',JSON.stringify('/fao-flash-post/'));
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const requests=[];
class Image {
  width=1600; height=900; naturalWidth=1600; naturalHeight=900;
  set src(value){this.url=value;requests.push(value);queueMicrotask(()=>this.onload());}
}
const exports={};
vm.runInNewContext(compiled,{exports,Image,URL,Promise,Map,Math,Error,document:{fonts:{load:async()=>[],ready:Promise.resolve()}}});
const {TEMPLATES,renderPost}=exports;
assert.equal(TEMPLATES.length,5);
assert.deepEqual(Array.from(TEMPLATES,t=>t.id),['single','right','left','clean','today']);
for(const t of TEMPLATES){
  for(const withPhotos of [false,true]){
    const calls=[];
    const ctx=new Proxy({measureText:text=>({width:text.length*30})},{get:(target,key)=>key in target?target[key]:(...args)=>calls.push([key,...args])});
    const canvas={getContext:()=>ctx};
    const photos=Array.from({length:4},(_,i)=>withPhotos&&i<t.photos?{src:'blob:photo-'+i,name:'test',x:.4,y:-.3,zoom:1.5}:null);
    await renderPost(canvas,{templateId:t.id,headline:t.headline,background:t.colors.background,wave:t.colors.wave,headlineColor:t.colors.headline,logoColor:t.colors.logo,photos});
    const draws=calls.filter(c=>c[0]==='drawImage');
    assert.equal(draws.length,2+(withPhotos?t.photos:0),t.id+' photo and logo count');
    assert.deepEqual(draws.at(-2).slice(2),t.colors.logo==='#ffffff'?[50,955,335,93]:[50,945,335,110],t.id+' left logo bounds');
    assert.deepEqual(draws.at(-1).slice(2),[847,960,190,86],t.id+' right logo bounds');
    for(const draw of draws){assert.ok(draw.slice(2).every(Number.isFinite),'finite image bounds');}
    console.log('PASS',t.id,withPhotos?'photo crops + logos':'empty frames + logos');
  }
}
assert.ok(requests.filter(x=>!x.startsWith('blob:')).every(x=>x.startsWith('/fao-flash-post/assets/')));
const manifest=JSON.parse(fs.readFileSync('dist/manifest.webmanifest','utf8'));
assert.equal(manifest.display,'standalone');
assert.equal(manifest.start_url,'./');
for(const icon of manifest.icons)assert.ok(fs.existsSync('dist/'+icon.src));
const html=fs.readFileSync('dist/index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="(\/fao-flash-post\/[^"]+)"/g)){
  assert.ok(fs.existsSync('dist/'+match[1].replace('/fao-flash-post/','')),match[1]);
}
const assets=fs.readdirSync('dist/assets');
assert.ok(!assets.some(f=>/sample-|template-.*\.jpg/.test(f)));
const css=fs.readFileSync('dist/assets/'+assets.find(f=>f.endsWith('.css')),'utf8');
assert.ok(css.includes('/fao-flash-post/assets/Montserrat-SemiBold.ttf'));
console.log('PASS subpath URLs, install manifest, bundled assets, photo-free public files');
