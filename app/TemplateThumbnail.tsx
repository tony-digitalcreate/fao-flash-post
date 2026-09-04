import { useEffect, useRef } from 'react';
import { renderPost, type Template } from './renderPost';

export function TemplateThumbnail({template}:{template:Template}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    if(!ref.current)return;
    void renderPost(ref.current,{
      templateId:template.id,headline:template.headline,
      background:template.colors.background,wave:template.colors.wave,
      headlineColor:template.colors.headline,logoColor:template.colors.logo,
      photos:[null,null,null,null],
    }).catch(()=>{/* The visible template label remains available. */});
  },[template]);
  return <canvas className="template-thumbnail" ref={ref} width={1080} height={1080} role="img" aria-label={template.name+' layout'}/>;
}
