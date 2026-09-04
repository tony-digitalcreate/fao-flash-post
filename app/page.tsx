'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Download, ImagePlus, LockKeyhole, Move, Palette, RotateCcw, Sparkles, Type, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import { TEMPLATES, renderPost, loadImage, releaseImage, type TemplateId, type Photo, type Template } from './renderPost';
import { InstallApp } from './InstallApp';
import { TemplateThumbnail } from './TemplateThumbnail';

export default function Home(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const dragRef=useRef<{index:number;startX:number;startY:number;baseX:number;baseY:number}|null>(null);
  const [templateId,setTemplateId]=useState<TemplateId>('today');
  const [headline,setHeadline]=useState('Happening today');
  const [background,setBackground]=useState('#cdb795');
  const [wave,setWave]=useState('#b1995e');
  const [headlineColor,setHeadlineColor]=useState('#b1995e');
  const [logoColor,setLogoColor]=useState('#ffffff');
  const [photos,setPhotos]=useState<Photo[]>([null,null,null,null]);
  const [ready,setReady]=useState(false);
  const [saved,setSaved]=useState(false);
  const [activePhoto,setActivePhoto]=useState(0);
  const template=TEMPLATES.find(t=>t.id===templateId)!;

  useEffect(()=>{
    try{const raw=localStorage.getItem('fao-flash-settings');if(!raw)return;const d=JSON.parse(raw);if(d.templateId==='recap'||d.templateId==='before')return;if(TEMPLATES.some(t=>t.id===d.templateId))setTemplateId(d.templateId);if(typeof d.headline==='string')setHeadline(d.headline);if(typeof d.background==='string')setBackground(d.background);if(typeof d.wave==='string')setWave(d.wave);if(typeof d.headlineColor==='string')setHeadlineColor(d.headlineColor);if(typeof d.logoColor==='string')setLogoColor(d.logoColor);}catch{/* Storage may be unavailable in private mode. */}
  },[]);

  const renderVersion=useRef(0);
  const [error,setError]=useState('');
  const [photoBusy,setPhotoBusy]=useState(false);
  const ownedUrls=useRef(new Set<string>());
  const uploadVersion=useRef([0,0,0,0]);
  useEffect(()=>()=>{ownedUrls.current.forEach(releaseImage);},[]);
  const render=useCallback(async()=>{
    const version=++renderVersion.current;
    setReady(false);setError('');
    const buffer=document.createElement('canvas');buffer.width=1080;buffer.height=1080;
    try {
      await renderPost(buffer,{templateId,headline,background,wave,headlineColor,logoColor,photos});
      if(version!==renderVersion.current)return;
      canvasRef.current?.getContext('2d')?.drawImage(buffer,0,0);
      setReady(true);
    }catch{
      if(version===renderVersion.current)setError('Could not prepare the preview. Check your connection and try again.');
    }
  },[background,headline,headlineColor,logoColor,photos,templateId,wave]);
  useEffect(()=>{void render();return()=>{renderVersion.current++;};},[render]);

  function choose(t:Template){uploadVersion.current=uploadVersion.current.map(v=>v+1);ownedUrls.current.forEach(releaseImage);ownedUrls.current.clear();setPhotoBusy(false);setTemplateId(t.id);setHeadline(t.headline);setBackground(t.colors.background);setWave(t.colors.wave);setHeadlineColor(t.colors.headline);setLogoColor(t.colors.logo);setPhotos([null,null,null,null]);setActivePhoto(0);}
  async function setPhoto(index:number,file?:File){
    if(!file)return;
    const version=++uploadVersion.current[index];
    setPhotoBusy(true);setError('');
    const original=URL.createObjectURL(file);
    try {
      const img=await loadImage(original);
      // Bound decoded photo size for mobile memory and quick drag updates.
      const ratio=Math.min(1,2560/Math.max(img.naturalWidth,img.naturalHeight));
      const imageCanvas=document.createElement('canvas');
      imageCanvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));
      imageCanvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
      imageCanvas.getContext('2d')!.drawImage(img,0,0,imageCanvas.width,imageCanvas.height);
      const blob=await new Promise<Blob>((resolve,reject)=>imageCanvas.toBlob(b=>b?resolve(b):reject(new Error('Image processing failed')),'image/jpeg',.94));
      if(version!==uploadVersion.current[index])return;
      const src=URL.createObjectURL(blob);ownedUrls.current.add(src);
      setPhotos(old=>old.map((p,i)=>i===index?{src,name:file.name,x:0,y:0,zoom:1}:p));
      setActivePhoto(index);
    }catch{if(version===uploadVersion.current[index])setError('This photo could not be opened. Try a JPG, PNG, or WebP image.');}
    finally{releaseImage(original);if(version===uploadVersion.current[index])setPhotoBusy(false);}
  }
  function updatePhoto(index:number,key:'x'|'y'|'zoom',value:number){setPhotos(old=>old.map((p,i)=>i===index&&p?{...p,[key]:value}:p));}
  function pointerDown(e:React.PointerEvent<HTMLButtonElement>,index:number){const p=photos[index];setActivePhoto(index);if(!p){document.getElementById(`photo-${index}`)?.click();return;}e.currentTarget.setPointerCapture(e.pointerId);dragRef.current={index,startX:e.clientX,startY:e.clientY,baseX:p.x,baseY:p.y};}
  function pointerMove(e:React.PointerEvent<HTMLButtonElement>){const d=dragRef.current;if(!d)return;const box=canvasRef.current?.getBoundingClientRect();if(!box)return;updatePhoto(d.index,'x',Math.max(-1,Math.min(1,d.baseX+(e.clientX-d.startX)/box.width*3)));updatePhoto(d.index,'y',Math.max(-1,Math.min(1,d.baseY+(e.clientY-d.startY)/box.height*3)));}
  function pointerUp(){dragRef.current=null;}
  function download(){const c=canvasRef.current;if(!c||!ready||photoBusy)return;c.toBlob(blob=>{if(!blob){setError('Could not export. Please try again.');return;}const a=document.createElement('a');a.download=`fao-${headline.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'post'}.png`;const url=URL.createObjectURL(blob);a.href=url;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);},'image/png');}
  function reset(){choose(template);}
  function save(){try{localStorage.setItem('fao-flash-settings',JSON.stringify({templateId,headline,background,wave,headlineColor,logoColor}));setSaved(true);setTimeout(()=>setSaved(false),1400);}catch{setError('Your browser blocked saving settings. You can still export your post.');}}
  const slotZones=templateId==='single'?[{left:'0%',top:'0%',width:'100%',height:'85.2%',rotate:'0deg'}]:templateId==='right'?[{left:'6%',top:'11%',width:'68%',height:'36%',rotate:'-1.4deg'},{left:'23.5%',top:'43%',width:'69.5%',height:'38%',rotate:'2deg'}]:templateId==='left'?[{left:'26%',top:'11%',width:'68.5%',height:'37%',rotate:'1.2deg'},{left:'7%',top:'45%',width:'70%',height:'37%',rotate:'0deg'}]:templateId==='clean'?[{left:'6.6%',top:'9.5%',width:'68.2%',height:'36.8%',rotate:'0deg'},{left:'24.5%',top:'42%',width:'69.5%',height:'37.5%',rotate:'0deg'}]:[{left:'5.05%',top:'15%',width:'43.9%',height:'24.1%',rotate:'1.3deg'},{left:'50%',top:'9.8%',width:'45.2%',height:'24.1%',rotate:'-.4deg'},{left:'17.22%',top:'45.46%',width:'66.57%',height:'35.56%',rotate:'.2deg'}];
  const selected=photos[activePhoto];

  return <main className="app-shell">
    <header className="topbar"><div className="brand-mark"><span className="brand-icon"><Sparkles/></span><span>FAO Flash Post</span></div><div className="topbar-center"><LockKeyhole/> Reference format locked</div><div className="topbar-actions"><Button variant="ghost" onClick={reset}><RotateCcw/><span className="desktop-label">Reset</span></Button><Button variant="outline" onClick={save}>{saved&&<Check/>}{saved?'Saved':'Save style'}</Button><Button disabled={!ready||photoBusy} onClick={download} className="download-button"><Download/>Export PNG</Button></div></header>
    <section className="workspace">
      <aside className="panel template-panel"><div className="panel-heading"><span className="step">1</span><div><h2>Choose the exact format</h2><p>Layouts match your references</p></div></div><div className="template-list exact-list">{TEMPLATES.map(t=><button key={t.id} className={`template-card exact ${templateId===t.id?'active':''}`} onClick={()=>choose(t)}><TemplateThumbnail template={t}/><span><strong>{t.name}</strong><small>{t.note}</small></span>{templateId===t.id&&<Check className="check"/>}</button>)}</div><InstallApp/><div className="brand-note"><LockKeyhole/><p>Photo positions, white frames, tape, curves, spacing, and FAO logo placement stay fixed.</p></div></aside>
      <section className="stage"><div className="stage-top"><div><span className="eyebrow">EXACT TEMPLATE PREVIEW</span><h1>Replace only what you need.</h1></div><span className="size-pill">1080 × 1080 px</span></div><div className="canvas-wrap">{!ready&&!error&&<div className="canvas-loader" role="status">Preparing template</div>}<canvas ref={canvasRef} width={1080} height={1080}/>{slotZones.map((zone,i)=><button key={i} className={`canvas-photo-zone ${photos[i]?'filled':''}`} style={{left:zone.left,top:zone.top,width:zone.width,height:zone.height,transform:`rotate(${zone.rotate})`}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setActivePhoto(i);document.getElementById(`photo-${i}`)?.click();}}} onPointerDown={e=>pointerDown(e,i)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}><span>{photos[i]?<Move/>:<ImagePlus/>}{photos[i]?`Drag photo ${i+1}`:`Insert photo ${i+1}`}</span></button>)}</div>{error&&<div className="editor-error" role="alert">{error}<Button variant="outline" onClick={()=>void render()}>Retry preview</Button></div>}{photoBusy&&<p role="status">Opening photo…</p>}<p className="hint">Insert a photo, then drag it directly inside its frame to reposition it.</p></section>
      <aside className="panel controls-panel"><div className="panel-heading"><span className="step">2</span><div><h2>Customize content</h2><p>The format itself will not move</p></div></div><div className="control-stack">
        <div className="section-label"><Type/>TEXT</div><div className="field"><div className="field-row"><Label htmlFor="headline">Heading text</Label><small>{headline.length}/34</small></div><Input id="headline" value={headline} maxLength={34} onChange={e=>setHeadline(e.target.value)}/></div>
        <div className="section-label"><ImagePlus/>IMAGES</div><div className="photo-rows">{photos.slice(0,template.photos).map((p,i)=><label className={`photo-row ${activePhoto===i?'active':''}`} htmlFor={`photo-${i}`} key={i} onClick={()=>setActivePhoto(i)}><span className="photo-number">{i+1}</span>{p?<img src={p.src} alt=""/>:<span className="photo-empty"><ImagePlus/></span>}<span className="photo-copy"><b>Photo {i+1}</b><small>{templateId==='single'?'Main full-frame photo':templateId==='today'?['Top-left photo frame','Top-right photo frame','Large lower photo frame'][i]:(i===0?'Top photo frame':'Lower photo frame')}</small></span><span className="replace">{p?'Replace':'Insert'}</span><input id={`photo-${i}`} type="file" accept="image/*" disabled={photoBusy} onChange={e=>{void setPhoto(i,e.target.files?.[0]);e.target.value="";}}/></label>)}</div>
        {selected&&<><div className="section-label"><Move/>ADJUST PHOTO {activePhoto+1}</div><div className="adjust-card"><div className="adjust-row"><span><ZoomIn/>Zoom</span><small>{selected.zoom.toFixed(2)}×</small></div><Slider aria-label="Photo zoom" min={1} max={2.5} step={.01} value={[selected.zoom]} onValueChange={v=>updatePhoto(activePhoto,'zoom',Array.isArray(v)?v[0]:v)}/><div className="adjust-row"><span>Horizontal</span><small>{Math.round(selected.x*100)}</small></div><Slider aria-label="Horizontal photo position" min={-1} max={1} step={.01} value={[selected.x]} onValueChange={v=>updatePhoto(activePhoto,'x',Array.isArray(v)?v[0]:v)}/><div className="adjust-row"><span>Vertical</span><small>{Math.round(selected.y*100)}</small></div><Slider aria-label="Vertical photo position" min={-1} max={1} step={.01} value={[selected.y]} onValueChange={v=>updatePhoto(activePhoto,'y',Array.isArray(v)?v[0]:v)}/></div></>}
        <div className="section-label"><Palette/>COLORS</div><div className="color-list">{templateId!=='single'&&<><label><input type="color" value={background} onChange={e=>setBackground(e.target.value)}/><span><b>Background</b><small>{background.toUpperCase()}</small></span></label><label><input type="color" value={wave} onChange={e=>setWave(e.target.value)}/><span><b>Wave panel</b><small>{wave.toUpperCase()}</small></span></label></>}<label><input type="color" value={headlineColor} onChange={e=>setHeadlineColor(e.target.value)}/><span><b>Heading block</b><small>{headlineColor.toUpperCase()}</small></span></label></div>
        <Button disabled={!ready||photoBusy} onClick={download} className="export-main"><Download/>Download 1080 × 1080 PNG</Button><p className="privacy">Photos stay on this device and are never uploaded. Save style remembers text and colors, not photos. Export before closing.</p>
      </div></aside>
    </section>
  </main>;
}
