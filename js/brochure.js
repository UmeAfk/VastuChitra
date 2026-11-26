/* A lightweight, local-first booklet. Each leaf is an image and/or editable copy. */
((scope) => {
  const spread = (index,count,single) => {
    const last=Math.max(0,count-1);
    const bounded=Math.max(0,Math.min(Math.floor(index),last));
    if(single || bounded===0 || bounded===last) return {start:bounded,indices:count ? [bounded] : [],step:1};
    const start=bounded%2 ? bounded : bounded-1;
    return {start,indices:[start,start+1].filter(i=>i<last),step:2};
  };
  const nextPage = (index,count,single,direction) => {
    const last=Math.max(0,count-1);
    if(single) return Math.max(0,Math.min(last,index+direction));
    if(direction>0) return index===0 ? Math.min(1,last) : Math.min(last,index+2);
    return index===last ? Math.max(0,last%2 ? last-2 : last-1) : Math.max(0,index-2);
  };
  if (typeof module === 'object'){ module.exports = {spread,nextPage}; return; }
  class Brochure {
    constructor(host,options={}){
      this.options=options;
      host.style.setProperty('--brochure-height',(options.brochureSize ?? 72)+'vh');
      host.style.setProperty('--brochure-mobile-height',Math.min(options.brochureSize ?? 72,68)+'vh');
      host.style.setProperty('--brochure-radius',(options.brochureCornerRadius ?? 9)+'px');
      host.style.setProperty('--brochure-flip-duration',(options.brochureFlipDuration ?? 850)+'ms');
      host.classList.toggle('book-no-animation',options.brochureAnimate===false || options.motion===false);
      this.host = host; this.pages = []; this.index = 0; this.busy = false;
      this.single = matchMedia('(max-width:700px)');
      this.single.addEventListener('change',() => { this.stop(); this.index = spread(this.index,this.pages.length,this.singlePage).start; this.render(); });
      host.innerHTML = '<div class="brochure-heading"><h2></h2></div><div class="book-stage" tabindex="0" aria-label="Brochure pages"></div><div class="book-controls"><button type="button" class="book-prev" aria-label="Previous brochure pages"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m14 6-6 6 6 6"/></svg></button><span class="book-counter" role="status" aria-live="polite"></span><button type="button" class="book-next" aria-label="Next brochure pages"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m10 6 6 6-6 6"/></svg></button></div>';
      host.querySelector('.brochure-heading').hidden = options.brochureShowTitle === false;
      host.querySelector('.book-counter').hidden = options.brochureShowCounter === false;
      this.stage = host.querySelector('.book-stage');
      this.prev = host.querySelector('.book-prev'); this.next = host.querySelector('.book-next');
      this.prev.onclick = () => this.turn(-1); this.next.onclick = () => this.turn(1);
      this.stage.addEventListener('keydown',event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft'){
          event.preventDefault(); this.turn(event.key === 'ArrowRight' ? 1 : -1);
        } else if (event.key === 'Home'){ event.preventDefault(); this.go(0); }
        else if (event.key === 'End'){ event.preventDefault(); this.go(this.pages.length-1); }
      });
      let start = null;
      this.stage.addEventListener('pointerdown',event => { if (event.isPrimary && event.button === 0) start={x:event.clientX,y:event.clientY}; });
      this.stage.addEventListener('pointerup',event => {
        if (!start || this.options.brochureSwipe === false) return;
        const dx=event.clientX-start.x,dy=event.clientY-start.y; start=null;
        if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.3) this.turn(dx<0 ? 1 : -1);
      });
      this.stage.addEventListener('pointercancel',()=>start=null);
      this.stage.addEventListener('pointerleave',()=>start=null);
    }
    get singlePage(){ return this.options.brochureSinglePage === true || this.single.matches; }
    open(project,pages){
      this.stop(); this.pages=pages; this.index=0;
      this.host.querySelector('h2').textContent=project.title;
      this.render();
      this.stage.focus({preventScroll:true});
    }
    page(index){
      const data=this.pages[index];
      const page=document.createElement('article'); page.className='book-page';
      if (!data){page.classList.add('book-blank');return page;}
      const cover=index===0 || index===this.pages.length-1;
      page.dataset.layout=cover ? 'cover' : ['photo','text','plan'].includes(data.layout) ? data.layout : 'photo';
      page.setAttribute('aria-label',`${index===0 ? 'Front cover' : index===this.pages.length-1 ? 'Back cover' : 'Page '+(index+1)}: ${data.title || ''}`);
      if (data.src){
        const img=document.createElement('img'); img.src=data.src; img.alt=data.title || `Brochure page ${index+1}`;
        img.draggable=false; img.decoding='async';
        img.addEventListener('error',()=>{img.remove();page.classList.add('book-image-missing');},{once:true});
        page.appendChild(img);
      }
      const copy=document.createElement('div');copy.className='book-copy';
      const eyebrow=document.createElement('span');eyebrow.className='book-kicker';eyebrow.textContent=data.eyebrow || 'Shree Sadhna';
      const title=document.createElement('h3');title.textContent=data.title || '';
      const body=document.createElement('p');body.textContent=data.body || '';
      copy.append(eyebrow,title,body);page.appendChild(copy);
      if(!cover && this.options.brochureShowNumbers !== false){
        const number=document.createElement('span');number.className='book-page-number';number.textContent=String(index+1).padStart(2,'0');page.appendChild(number);
      }
      return page;
    }
    render(){
      if (!this.pages.length) return;
      const state=spread(this.index,this.pages.length,this.singlePage);this.index=state.start;
      this.stage.setAttribute('aria-busy','false');
      const front=this.index===0,back=this.index===this.pages.length-1 && !front;
      const left=front ? -1 : this.index;
      const right=back ? -1 : front ? 0 : state.indices[1] ?? -1;
      this.stage.replaceChildren(...(this.singlePage ? [this.page(this.index)] : [this.page(left),this.page(right)]));
      this.stage.classList.toggle('book-single',this.singlePage);
      this.stage.classList.toggle('book-front',front && !this.singlePage);
      this.stage.classList.toggle('book-back',back && !this.singlePage);
      this.prev.disabled=this.index===0 || this.busy;
      this.next.disabled=this.index>=this.pages.length-1 || this.busy;
      this.host.querySelector('.book-counter').textContent=front ? 'Front cover' : back ? 'Back cover' : `${state.indices.length>1 ? 'Pages' : 'Page'} ${this.index+1}${state.indices.length>1 ? '–'+(this.index+state.indices.length) : ''} of ${this.pages.length}`;
      this.options.onPageChange?.(this.index);
      // Warm the next spread without downloading the entire publication.
      for(const data of this.pages.slice(this.index+state.step,this.index+state.step*2)) if(data.src){ const img=new Image();img.src=data.src; }
    }
    go(index){
      const target=spread(index,this.pages.length,this.singlePage).start;
      if(target!==this.index) this.turn(target>this.index ? 1 : -1,target);
    }
    async turn(direction,target){
      if(this.busy) return;
      const next=target ?? nextPage(this.index,this.pages.length,this.singlePage,direction);
      if(next<0 || next>=this.pages.length || next===this.index) return;
      if(matchMedia('(prefers-reduced-motion: reduce)').matches || this.options.brochureAnimate === false || this.options.motion === false){this.index=next;this.render();return;}
      this.busy=true;this.prev.disabled=true;this.next.disabled=true;
      this.stage.setAttribute('aria-busy','true');
      const token=this.token=(this.token || 0)+1;
      const leaf=document.createElement('div');leaf.className='book-leaf '+(direction>0 ? 'turn-forward' : 'turn-back');
      leaf.setAttribute('aria-hidden','true');
      const front=document.createElement('div');front.className='book-leaf-face book-leaf-front';
      const back=document.createElement('div');back.className='book-leaf-face book-leaf-back';
      const currentState=spread(this.index,this.pages.length,this.singlePage);
      const targetState=spread(next,this.pages.length,this.singlePage);
      const currentLeft=this.index===0 ? -1 : this.index;
      const currentRight=this.index===0 ? 0 : currentState.indices[1] ?? -1;
      const targetLeft=next===0 ? -1 : next;
      const targetRight=next===0 ? 0 : targetState.indices[1] ?? -1;
      front.appendChild(this.page(this.singlePage ? this.index : direction>0 ? currentRight : currentLeft));
      back.appendChild(this.page(this.singlePage ? next : direction>0 ? targetLeft : targetRight));
      leaf.append(front,back);
      if(this.singlePage) this.stage.replaceChildren(this.page(next));
      else if(direction>0) this.stage.replaceChildren(this.page(currentLeft),this.page(targetRight));
      else this.stage.replaceChildren(this.page(targetLeft),this.page(currentRight));
      this.stage.classList.toggle('book-front',next===0 && !this.singlePage);
      this.stage.classList.toggle('book-back',next===this.pages.length-1 && !this.singlePage);
      this.stage.appendChild(leaf);
      this.animation=leaf.animate([{transform:'rotateY(0deg)'},{transform:`rotateY(${direction>0 ? -180 : 180}deg)`}],{duration:this.options.brochureFlipDuration ?? 850,easing:'cubic-bezier(.22,.65,.2,1)',fill:'forwards'});
      try{await this.animation.finished;}catch{}
      if(token!==this.token) return;
      this.index=next;this.busy=false;this.render();this.animation=null;
    }
    stop(){this.token=(this.token || 0)+1;this.animation?.cancel();this.animation=null;this.busy=false;}
  }
  scope.VASTU_BROCHURE={Brochure};
})(typeof window==='object' ? window : globalThis);
