/* Shared validation and defaults: Admin and launcher use the same settings. */
((scope)=>{
  const presets={
    commercial:{columns:8,rows:5,cardGap:10,cardRadius:4,cardRowHeight:100,pagePadding:28,cardContentPadding:16,titleScale:100,headerGap:20},
    personal:{columns:8,rows:6,cardGap:12,cardRadius:14,cardRowHeight:120,pagePadding:24,cardContentPadding:22,titleScale:100,headerGap:16},
    heritage:{columns:6,rows:4,cardGap:18,cardRadius:22,cardRowHeight:142,pagePadding:30,cardContentPadding:24,titleScale:100,headerGap:22}
  };
  const bounds={columns:[2,12],rows:[2,8],cardGap:[6,40],cardRadius:[4,40],cardRowHeight:[90,220],pagePadding:[12,64],cardContentPadding:[12,40],titleScale:[80,140],headerGap:[8,48]};
  const collectionKeys=['followGrid','canvasLoop','canvasAutoScroll','canvasPauseOnHover','canvasScrollSpeed','canvasEdgeBlur','canvasSmoothScroll','canvasEdgeHeight','canvasEdgeStrength','hoverZoomEnabled','hoverZoomDuration','hoverZoom','cardTilt','tiltStrength','transitionSpeed','autoplaySlides','introAnimation','showClock','showClockIcon','clock24Hour','showProjectCount','showDescriptions','showCategories','showSlidePager','showGridDots'];
  const fields=[
    ['followGrid','Follow grid','motion','boolean',true,'Align cards into complete rows without gaps. Turn off for free modular placement.'],
    ['canvasLoop','Infinite scroll','canvas','boolean',false,'Repeat the collection after the last row. Off gives the canvas a natural end.'],
    ['hoverZoomEnabled','Hover image zoom','motion','boolean',true,'Gently enlarge image cards when using a mouse.'],
    ['hoverZoomDuration','Hover zoom duration','motion','number',1100,'Controls both zoom-in and zoom-out, without snapping.',150,2500,'ms'],
    ['canvasSmoothScroll','Smooth scrolling','motion','boolean',true,'Ease mouse-wheel movement on the infinite canvas.'],
    ['canvasEdgeHeight','Bottom fade height','motion','number',68,'Height of the soft scrolling edge.',24,140,'px'],
    ['canvasEdgeStrength','Bottom blur strength','motion','number',8,'Set to zero for a fade without blur.',0,16,'px'],
    ['brandLogoOriginal','Preserve logo colours','branding','boolean',false,'Show the original artwork instead of adapting it to the Client theme.'],
    ['clientThemeDefault','Default appearance','client','select','system','Used when no remembered visitor choice applies.',null,null,null,['system','light','dark']],
    ['clientRememberTheme','Remember visitor appearance','client','boolean',true,'Keep the visitor’s light or dark choice after a reload.'],
    ['clientShowThemeToggle','Show appearance switch','client','boolean',true,'Show the sun and moon control on the Client canvas.'],
    ['clientThemeAnimation','Animate theme changes','client','boolean',true,'Smoothly transition theme colours; reduced-motion preferences always take priority.'],
    ['clientLightBackground','Light canvas colour','client','color','#dce5ee','Background behind the cards in light mode.'],
    ['clientDarkBackground','Dark canvas colour','client','color','#0c1423','Background behind the cards in dark mode.'],
    ['brochureSize','Brochure size','brochure','number',72,'Maximum book height relative to the screen. Mobile sizing fits the available space.',55,78,'%'],
    ['brochureCornerRadius','Brochure corners','brochure','number',9,'Round the outer edges while keeping a straight binding.',0,24,'px'],
    ['brochureFlipDuration','Page flip duration','brochure','number',850,'Length of the page-turn animation.',250,1600,'ms'],
    ['brochureAnimate','Animate page turns','brochure','boolean',true,'Turn off for immediate page changes.'],
    ['brochureSwipe','Allow swipe navigation','brochure','boolean',true,'Turn pages by swiping across the brochure.'],
    ['brochureSinglePage','Always show one page','brochure','boolean',false,'Use one page at a time on desktop as well as mobile.'],
    ['brochureShowCounter','Show page counter','brochure','boolean',true,'Show the current page between the arrows.'],
    ['brochureShowNumbers','Number inside pages','brochure','boolean',true,'Cover pages always remain unnumbered.'],
    ['brochureShowTitle','Show booklet title','brochure','boolean',true,'Display the brochure title above the pages.']
  ].map(([key,label,group,type,value,help,min,max,unit,options])=>({key,label,group,type,value,help,min,max,unit,options,id:'cfg'+key[0].toUpperCase()+key.slice(1)}));
  const numeric=(value,fallback,min,max)=>{
    if(value===null || value==='' || !Number.isFinite(Number(value)))return fallback;
    return Math.min(max,Math.max(min,Math.round(Number(value))));
  };
  function layout(settings={},mode='commercial'){
    const preset=presets[mode] || presets.commercial;
    const source=settings.presentationLayouts?.[mode] || {};
    return Object.fromEntries(Object.entries(preset).map(([key,value])=>[key,numeric(source[key],value,...bounds[key])]));
  }
  function normalize(settings={}){
    const result={...settings};
    for(const field of fields){
      const value=settings[field.key];
      result[field.key]=field.type==='boolean' ? typeof value==='boolean' ? value : field.value :
        field.type==='number' ? numeric(value,field.value,field.min,field.max) :
        field.type==='color' ? /^#[0-9a-f]{6}$/i.test(value || '') ? value : field.value :
        field.options.includes(value) ? value : field.value;
    }
    result.presentationLayouts=Object.fromEntries(Object.keys(presets).map(mode=>[mode,layout(settings,mode)]));
    result.presentationOptions=Object.fromEntries(Object.keys(presets).map(mode=>{
      const source=settings.presentationOptions?.[mode] || {};
      const valid={};
      for(const key of collectionKeys){
        if(!Object.hasOwn(source,key))continue;
        const field=fields.find(field=>field.key===key);
        if(field?.type==='number')valid[key]=numeric(source[key],field.value,field.min,field.max);
        else if(['hoverZoom','tiltStrength','transitionSpeed','canvasScrollSpeed'].includes(key)){
          const limits={hoverZoom:[100,115,107],tiltStrength:[0,14,7],transitionSpeed:[50,180,100],canvasScrollSpeed:[5,100,24]}[key];
          valid[key]=numeric(source[key],limits[2],limits[0],limits[1]);
        }else if(typeof source[key]==='boolean')valid[key]=source[key];
      }
      return [mode,valid];
    }));
    return result;
  }
  function resolve(settings={},mode=settings.presentationMode || 'commercial'){
    const normalized=normalize(settings);
    return {...normalized,...normalized.presentationOptions[mode],...layout(settings,mode)};
  }
  const api={presets,bounds,fields,collectionKeys,numeric,layout,normalize,resolve};
  if(typeof module==='object')module.exports=api;else scope.VASTU_SETTINGS=api;
})(typeof window==='object' ? window : globalThis);
