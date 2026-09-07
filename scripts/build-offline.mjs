import fs from 'node:fs';
import path from 'node:path';

const project=process.cwd();
const dist=path.join(project,'dist');
const output=path.resolve(project,'../../outputs/FAO-Flash-Post-Offline');
if(fs.existsSync(output))throw new Error('Offline output already exists: '+output);

const mime={'.png':'image/png','.ttf':'font/ttf','.svg':'image/svg+xml'};
const dataUrl=file=>{
  const ext=path.extname(file).toLowerCase();
  return `data:${mime[ext]||'application/octet-stream'};base64,${fs.readFileSync(file).toString('base64')}`;
};

let html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const cssPath=html.match(/href="([^"]+\.css)"/)?.[1];
const jsPath=html.match(/src="([^"]+\.js)"/)?.[1];
if(!cssPath||!jsPath)throw new Error('Built CSS or JavaScript was not found.');
const fromDist=url=>path.join(dist,url.replace(/^\/fao-flash-post\//,''));

let css=fs.readFileSync(fromDist(cssPath),'utf8');
let js=fs.readFileSync(fromDist(jsPath),'utf8');
const embedded=[
  'assets/Montserrat-SemiBold.ttf',
  'assets/Montserrat-Bold.ttf',
  'assets/fao-un-blue-trim.png',
  'assets/fao-un-white-trim.png',
  'assets/fao-right-blue-trim.png',
  'assets/fao-right-white-trim.png',
];
const runtimeAssets={};
for(const relative of embedded){
  const url='/fao-flash-post/'+relative;
  const encoded=dataUrl(path.join(dist,relative));
  if(relative.endsWith('.ttf'))css=css.split(url).join(encoded);
  else runtimeAssets['/'+relative]=encoded;
}
if(css.includes('/fao-flash-post/')){
  throw new Error('The offline stylesheet still contains external assets.');
}
css+='\n.install-panel{display:none!important}\n';
html=html
  .replace(/\s*<link rel="manifest"[^>]+>/,()=>'')
  .replace(/\s*<link rel="icon"[^>]+>/,()=>'')
  .replace(/\s*<script type="module"[^>]+><\/script>/,()=>'')
  .replace(/\s*<link rel="stylesheet"[^>]+>/,()=>'')
  .replace('</head>',()=>`<style>${css.replaceAll('</style>','<\\/style>')}</style></head>`)
  .replace('</body>',()=>`<script>globalThis.__FAO_OFFLINE_ASSETS__=${JSON.stringify(runtimeAssets)}</script><script type="module">${js.replaceAll('</script>','<\\/script>')}</script></body>`);

fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'FAO-Flash-Post-Offline.html'),html);
fs.writeFileSync(path.join(output,'HOW-TO-USE.txt'),`FAO FLASH POST — OFFLINE VERSION

WINDOWS
1. Double-click FAO-Flash-Post-Offline.html.
2. If Windows asks, choose Chrome or Edge.

ANDROID
1. Copy FAO-Flash-Post-Offline.html to your phone.
2. Open the file from Downloads or Files with Chrome.

USE
1. Choose one of the five templates.
2. Insert your photos.
3. Drag a photo or use Zoom, Horizontal, and Vertical.
4. Edit the heading and colors.
5. Press Export PNG before closing.

No internet or local server is required. Photos remain on the device.
The saved style remembers text and colors in that browser, but not photos.
`);
const result=path.join(output,'FAO-Flash-Post-Offline.html');
console.log(result);
console.log(fs.statSync(result).size+' bytes');
