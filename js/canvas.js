/* Repeated, bounded canvas cycles. Originals remain the only editable cards. */
((scope) => {
  const wrapScroll = (top, length) => length > 0 && top >= length ? top % length : top;
  class LoopCanvas {
    constructor(grid, options){
      this.grid = grid;
      this.options = options;
      this.copies = [];
      this.editing = false;
      this.frame = 0;
      this.motionFrame = 0;
      this.remaining = 0;
      this.rebuild = this.rebuild.bind(this);
      this.media = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) options.load(entry.target._original);
        entry.target.querySelectorAll('video').forEach(video => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      }), {root:grid,rootMargin:'100px'});
      this.resize = new ResizeObserver(() => {
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(this.rebuild);
      });
      this.resize.observe(grid);
      grid.addEventListener('scroll', () => {
        if (!this.editing && options.enabled){
          const next = wrapScroll(grid.scrollTop,this.length);
          if (Math.abs(next - grid.scrollTop) > 1) grid.scrollTop = next;
        }
      }, {passive:true});
      grid.addEventListener('wheel', event => {
        if (this.editing || event.ctrlKey || !event.deltaY || (!options.enabled && options.smooth === false) || (options.enabled && !this.length)) return;
        // High-resolution trackpads already provide smooth, inertial pixel input.
        if(event.deltaMode===0 && Math.abs(event.deltaY)<24){this.stopMotion();return;}
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? grid.clientHeight : 1;
        const delta = event.deltaY * unit;
        if (options.smooth === false){
          grid.scrollTop = this.destination(grid.scrollTop + delta);
          return;
        }
        if (this.remaining * delta < 0) this.remaining = 0;
        this.remaining += delta;
        if (!this.motionFrame){
          this.position = grid.scrollTop;
          this.lastMotion = performance.now();
          this.motionFrame = requestAnimationFrame(now => this.move(now));
        }
      }, {passive:false});
      grid.addEventListener('pointerdown', () => this.stopMotion(), {passive:true});
      grid.addEventListener('keydown', () => this.stopMotion());
      this.rebuild();
    }
    move(now){
      this.motionFrame = 0;
      if (this.editing || (!this.options.enabled && this.options.smooth === false)) return this.stopMotion();
      const elapsed = Math.min(40,Math.max(1,now - this.lastMotion));
      this.lastMotion = now;
      const distance = Math.abs(this.remaining) < .35 ? this.remaining : this.remaining * (1 - Math.exp(-elapsed / 95));
      this.remaining -= distance;
      this.position = this.destination(this.position + distance);
      this.grid.scrollTop = this.position;
      if (this.position === 0 && this.remaining < 0) this.remaining = 0;
      if(!this.options.enabled && this.position>=Math.max(0,this.grid.scrollHeight-this.grid.clientHeight) && this.remaining>0)this.remaining=0;
      if (Math.abs(this.remaining) > .01) this.motionFrame = requestAnimationFrame(time => this.move(time));
    }
    stopMotion(){
      cancelAnimationFrame(this.motionFrame);
      this.motionFrame = 0;
      this.remaining = 0;
    }
    destination(top){
      return this.options.enabled ? wrapScroll(Math.max(0,top),this.length) : Math.min(Math.max(0,(Number(this.grid.scrollHeight)||0)-this.grid.clientHeight),Math.max(0,top));
    }
    setEnabled(enabled){
      const top=this.options.enabled ? wrapScroll(this.grid.scrollTop,this.length) : this.grid.scrollTop;
      this.options.enabled=!!enabled;this.rebuild();this.grid.scrollTop=top;
    }
    clear(){
      this.media.disconnect();
      this.copies.forEach(cycle => {
        cycle.querySelectorAll('video').forEach(video => video.pause());
        cycle.remove();
      });
      this.copies = [];
    }
    setEditing(editing){
      this.stopMotion();
      this.editing = editing;
      if (editing){
        const top = wrapScroll(this.grid.scrollTop,this.length);
        this.clear();
        this.grid.scrollTop = top;
      } else this.rebuild();
    }
    rebuild(){
      this.stopMotion();
      const top = wrapScroll(this.grid.scrollTop,this.length);
      this.clear();
      const cards = this.options.cards();
      if (this.editing || !this.options.enabled || !cards.length) return;
      const style = getComputedStyle(this.grid);
      const gap = parseFloat(style.rowGap) || 0;
      const row = parseFloat(style.gridAutoRows) || 130;
      const bottom = Math.max(...cards.map(card => card.offsetTop + card.offsetHeight));
      const rows = Math.max(1,Math.round((bottom + gap) / (row + gap)));
      const length = rows * (row + gap);
      this.length = length;
      const count = Math.max(2,Math.ceil(this.grid.clientHeight / length) + 1);
      for (let index = 0; index < count; index++){
        const cycle = document.createElement('div');
        cycle.className = 'canvas-cycle';
        cycle.style.gridRow = 'span ' + rows;
        cycle.setAttribute('aria-hidden','true');
        for (const card of cards){
          const copy = card.cloneNode(true);
          copy.tabIndex = -1;
          copy._original = card;
          copy._slides = [...copy.querySelectorAll('.slide')];
          copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
          copy.querySelectorAll('button,a,[tabindex]').forEach(node => node.tabIndex = -1);
          copy.querySelectorAll('video').forEach(video => { video.muted = true; video.playsInline = true; video.preload = 'metadata'; });
          copy.addEventListener('click', event => this.options.activate(copy,event));
          cycle.appendChild(copy);
          this.media.observe(copy);
        }
        this.grid.appendChild(cycle);
        this.copies.push(cycle);
      }
      this.grid.scrollTop = top;
    }
    sync(card){
      for (const cycle of this.copies){
        const copy = [...cycle.children].find(node => node.dataset.id === card.dataset.id);
        if (!copy) continue;
        const slides = copy.querySelectorAll('.slide');
        card.querySelectorAll('.slide').forEach((slide,index) => {
          if (!slides[index]) return;
          slides[index].className = slide.className;
          slides[index].style.cssText = slide.style.cssText;
          slides[index].firstElementChild.style.cssText = slide.firstElementChild.style.cssText;
        });
      }
    }
  }
  if (typeof module === 'object') module.exports = {wrapScroll};
  else scope.VASTU_CANVAS = {LoopCanvas,wrapScroll};
})(typeof window === 'object' ? window : globalThis);
