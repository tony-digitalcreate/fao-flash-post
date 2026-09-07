export type TemplateId = 'single' | 'right' | 'left' | 'clean' | 'today';
export type Photo = { src: string; name: string; x: number; y: number; zoom: number } | null;
export type Template = {
  id: TemplateId; name: string; note: string; thumb?: string; photos: number;
  headline: string; colors: { background: string; wave: string; headline: string; logo: string };
};

export const TEMPLATES: Template[] = [
  { id:'single', name:'Single photo', note:'Full-frame event photo', photos:1, headline:'Working together', colors:{background:'#ffffff',wave:'#ffffff',headline:'#5797cb',logo:'#5797cb'} },
  { id:'right', name:'Right headline', note:'Two fixed photo frames', photos:2, headline:'Strong Partnership', colors:{background:'#a9c68e',wave:'#55ad70',headline:'#5797cb',logo:'#ffffff'} },
  { id:'left', name:'Left headline', note:'Two fixed photo frames', photos:2, headline:'Joining Forces', colors:{background:'#6c89ed',wave:'#ffffff',headline:'#ffbd00',logo:'#5797cb'} },
  { id:'clean', name:'Clean stack', note:'Two fixed photo frames', photos:2, headline:'Working Together', colors:{background:'#5797cb',wave:'#ffffff',headline:'#55ad70',logo:'#ffffff'} },
  { id:'today', name:'Happening today', note:'Three-photo reference layout', photos:3, headline:'Happening today', colors:{background:'#cdb795',wave:'#b1995e',headline:'#b1995e',logo:'#ffffff'} },
];

const imageCache = new Map<string, Promise<HTMLImageElement>>();
type OfflineAssetMap = typeof globalThis & { __FAO_OFFLINE_ASSETS__?: Record<string,string> };
export function loadImage(src: string) {
  let pending = imageCache.get(src);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve,reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { imageCache.delete(src); reject(new Error('Unable to load image')); };
      const embedded=(globalThis as OfflineAssetMap).__FAO_OFFLINE_ASSETS__?.[src];
      img.src = embedded ?? (src.startsWith('/assets/') ? import.meta.env.BASE_URL + src.slice(1) : src);
    });
    imageCache.set(src,pending);
  }
  return pending;
}
export function releaseImage(src: string) { imageCache.delete(src); URL.revokeObjectURL(src); }
function cover(ctx:CanvasRenderingContext2D,img:HTMLImageElement,photo:NonNullable<Photo>,x:number,y:number,w:number,h:number){const r=Math.max(w/img.width,h/img.height)*photo.zoom,sw=w/r,sh=h/r,maxX=Math.max(0,(img.width-sw)/2),maxY=Math.max(0,(img.height-sh)/2),sx=Math.max(0,Math.min(img.width-sw,maxX-photo.x*maxX)),sy=Math.max(0,Math.min(img.height-sh,maxY-photo.y*maxY));ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);}
function placeholder(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,index:number){ctx.fillStyle='#dce6eb';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#9db3bf';ctx.lineWidth=3;ctx.setLineDash([10,10]);ctx.strokeRect(x+2,y+2,w-4,h-4);ctx.setLineDash([]);ctx.fillStyle='#6f8997';ctx.font='600 25px Montserrat';ctx.textAlign='center';ctx.fillText(`ADD PHOTO ${index+1}`,x+w/2,y+h/2+8);ctx.textAlign='left';}
function photoCard(ctx:CanvasRenderingContext2D,img:HTMLImageElement|null,photo:Photo,x:number,y:number,w:number,h:number,rotation:number,index:number,insets=[34,45,34,37]){ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(rotation*Math.PI/180);ctx.shadowColor='rgba(25,48,64,.24)';ctx.shadowBlur=25;ctx.shadowOffsetY=14;ctx.fillStyle='#fff';ctx.fillRect(-w/2,-h/2,w,h);ctx.shadowColor='transparent';const px=-w/2+insets[0],py=-h/2+insets[1],pw=w-insets[0]-insets[2],ph=h-insets[1]-insets[3];if(img&&photo)cover(ctx,img,photo,px,py,pw,ph);else placeholder(ctx,px,py,pw,ph,index);ctx.restore();}
function tape(ctx:CanvasRenderingContext2D,x:number,y:number,w=205,h=65){ctx.save();ctx.globalAlpha=.7;ctx.fillStyle='#dfd0b4';ctx.fillRect(x,y,w,h);ctx.restore();}
function fitText(ctx:CanvasRenderingContext2D,text:string,max:number,start=67){let size=start;while(size>34){ctx.font=`600 ${size}px Montserrat`;if(ctx.measureText(text).width<=max)break;size-=2;}return size;}
function brand(ctx:CanvasRenderingContext2D,left:HTMLImageElement,right:HTMLImageElement,blue=false){if(blue){ctx.drawImage(left,0,0,327,90,50,955,335,93);ctx.drawImage(left,619,0,182,90,847,960,190,86);return;}ctx.drawImage(left,50,955,335,93);ctx.drawImage(right,847,960,190,86);}


export type PostState = { templateId: TemplateId; headline: string; background: string; wave: string; headlineColor: string; logoColor: string; photos: Photo[] };
export async function renderPost(canvas: HTMLCanvasElement, state: PostState) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  const { templateId, headline, background, wave, headlineColor, logoColor, photos } = state;
    const blueLogos=logoColor.toLowerCase()!=='#ffffff';
    const [leftLogo,rightLogo,...loaded]=await Promise.all([loadImage(blueLogos?'/assets/fao-blue-two-side.svg':'/assets/fao-un-white-trim.png'),loadImage(blueLogos?'/assets/fao-blue-two-side.svg':'/assets/fao-right-white-trim.png'),...photos.map(p=>p?loadImage(p.src):Promise.resolve(null))]);
    await document.fonts.load('600 68px Montserrat');await document.fonts.ready;ctx.clearRect(0,0,1080,1080);ctx.fillStyle=background;ctx.fillRect(0,0,1080,1080);
    if(templateId==='single'){
      if(loaded[0]&&photos[0])cover(ctx,loaded[0],photos[0],0,0,1080,920);else placeholder(ctx,0,0,1080,920,0);
      ctx.fillStyle='#fff';ctx.fillRect(0,920,1080,160);
      ctx.fillStyle=headlineColor;ctx.fillRect(0,21,751,109);
      const size=fitText(ctx,headline,650,67);ctx.font=`600 ${size}px Montserrat`;ctx.fillStyle='#fff';ctx.fillText(headline,52,95);
      brand(ctx,leftLogo,rightLogo,blueLogos);return;
    }
    if(templateId==='right'){
      ctx.fillStyle=wave;ctx.beginPath();ctx.moveTo(0,202);ctx.bezierCurveTo(230,410,630,238,1080,424);ctx.lineTo(1080,675);ctx.bezierCurveTo(780,900,360,592,0,694);ctx.closePath();ctx.fill();
      photoCard(ctx,loaded[0],photos[0],31,76,802,482,-1.4,0);photoCard(ctx,loaded[1],photos[1],220,422,820,490,2,1);tape(ctx,241,20);
      ctx.fillStyle=headlineColor;ctx.fillRect(473,21,607,108);const size=fitText(ctx,headline,535,64);ctx.font=`600 ${size}px Montserrat`;ctx.fillStyle='#fff';ctx.fillText(headline,510,95);
    }else if(templateId==='left'){
      ctx.fillStyle=wave;ctx.beginPath();ctx.moveTo(0,690);ctx.bezierCurveTo(260,560,590,885,1080,676);ctx.lineTo(1080,1080);ctx.lineTo(0,1080);ctx.closePath();ctx.fill();
      photoCard(ctx,loaded[0],photos[0],246,71,810,483,1.2,0);photoCard(ctx,loaded[1],photos[1],40,438,822,492,0,1);tape(ctx,584,18);
      ctx.fillStyle=headlineColor;ctx.fillRect(0,22,609,108);const size=fitText(ctx,headline,505,64);ctx.font=`600 ${size}px Montserrat`;ctx.fillStyle='#fff';ctx.fillText(headline,98,95);
    }else if(templateId==='clean'){
      ctx.fillStyle=wave;ctx.beginPath();ctx.moveTo(0,203);ctx.bezierCurveTo(240,430,660,225,1080,424);ctx.lineTo(1080,676);ctx.bezierCurveTo(700,900,360,565,0,694);ctx.closePath();ctx.fill();
      photoCard(ctx,loaded[0],photos[0],38,58,805,480,0,0);photoCard(ctx,loaded[1],photos[1],230,406,820,488,0,1);tape(ctx,355,23);
      ctx.fillStyle=headlineColor;ctx.fillRect(473,34,607,108);const size=fitText(ctx,headline,535,64);ctx.font=`600 ${size}px Montserrat`;ctx.fillStyle='#fff';ctx.fillText(headline,506,106);
    }else if(templateId==='today'){
      ctx.fillStyle=wave;ctx.beginPath();ctx.moveTo(0,694);ctx.bezierCurveTo(220,590,610,968,1080,675);ctx.lineTo(1080,1080);ctx.lineTo(0,1080);ctx.closePath();ctx.fill();
      photoCard(ctx,loaded[0],photos[0],27,133,530,316,1.3,0,[28,29,28,27]);
      photoCard(ctx,loaded[1],photos[1],512,73,547,328,-.4,1,[28,33,31,35]);
      tape(ctx,625,51,204,43);
      photoCard(ctx,loaded[2],photos[2],144,442,807,483,.2,2,[42,49,46,50]);
      tape(ctx,466,429,152,46);
      ctx.fillStyle=headlineColor;ctx.fillRect(0,32,696,108);const size=fitText(ctx,headline,632,68);ctx.font=`600 ${size}px Montserrat`;ctx.fillStyle='#fff';ctx.fillText(headline,33,108);
    }
    brand(ctx,leftLogo,rightLogo,blueLogos);
}
