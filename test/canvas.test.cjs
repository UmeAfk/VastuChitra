'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {wrapScroll} = require('../js/canvas.js');
test('the repeat boundary preserves overshoot, including large scrolls', () => {
  assert.equal(wrapScroll(219,220),219);
  assert.equal(wrapScroll(220,220),0);
  assert.equal(wrapScroll(250,220),30);
  assert.equal(wrapScroll(2230,220),30);
  assert.equal(wrapScroll(50,0),50);
});
function harness(){
  let time = 0, next = 1;
  const frames = new Map();
  const events = {};
  const cycles = [];
  const node = () => ({children:[],style:{},dataset:{},setAttribute(){},addEventListener(){},
    querySelectorAll:() => [], appendChild(child){ this.children.push(child); },
    remove(){ cycles.splice(cycles.indexOf(this),1); }});
  const cards = [0,110].map((top,i) => ({offsetTop:top,offsetHeight:100,dataset:{id:String(i)},cloneNode:node}));
  const grid = {scrollTop:0,clientHeight:500,appendChild:cycle => cycles.push(cycle),
    addEventListener:(type,fn) => { events[type] = fn; }};
  const sandbox = {window:{}, document:{createElement:node}, getComputedStyle:() => ({rowGap:'10px',gridAutoRows:'100px'}),
    IntersectionObserver:class{ observe(){} disconnect(){} },
    ResizeObserver:class{ observe(){} }, performance:{now:()=>time},
    requestAnimationFrame(fn){ const id = next++;frames.set(id,fn);return id; },
    cancelAnimationFrame(id){frames.delete(id);} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/canvas.js'),'utf8'),sandbox);
  const options = {enabled:true,cards:() => cards,load(){},activate(){}};
  const canvas = new sandbox.window.VASTU_CANVAS.LoopCanvas(grid,options);
  const tick = () => { time += 16;const pending = [...frames.values()];frames.clear();pending.forEach(fn=>fn(time)); };
  return {canvas,grid,cycles,events,options,tick};
}
test('cycles remain bounded after rebuilds and disappear during editing', () => {
  const {canvas,cycles,grid} = harness();
  assert.equal(cycles.length,4);
  assert.equal(canvas.length,220);
  canvas.rebuild();
  canvas.rebuild();
  assert.equal(cycles.length,4);
  grid.scrollTop = 250;
  canvas.setEditing(true);
  assert.equal(cycles.length,0);
  assert.equal(grid.scrollTop,30);
  canvas.setEditing(false);
  assert.equal(cycles.length,4);
});
test('large wheel input wraps before browser scroll limits clamp it', () => {
  const {grid,events,canvas,tick} = harness();
  let prevented = false;
  events.wheel({deltaY:2230,deltaMode:0,preventDefault(){prevented = true;}});
  assert.equal(prevented,true);
  for(let i=0;i<100;i++)tick();
  assert.ok(Math.abs(grid.scrollTop - 30) < .02);
  canvas.setEditing(true);
  events.wheel({deltaY:40,preventDefault(){throw Error('Editor must retain native scrolling');}});
});
test('wheel scrolling eases across frames instead of jumping to its destination', () => {
  const {grid,events,tick} = harness();
  events.wheel({deltaY:100,deltaMode:0,preventDefault(){}});
  assert.equal(grid.scrollTop,0);
  tick();
  const first = grid.scrollTop;
  assert.ok(first > 0 && first < 30);
  tick();
  assert.ok(grid.scrollTop > first && grid.scrollTop < 60);
  for(let i=0;i<100;i++)tick();
  assert.ok(Math.abs(grid.scrollTop - 100) < .02);
});
test('starting an edit cancels pending scroll movement', () => {
  const {grid,canvas,events,tick} = harness();
  events.wheel({deltaY:100,deltaMode:0,preventDefault(){}});
  tick();
  canvas.setEditing(true);
  const top = grid.scrollTop;
  for(let i=0;i<20;i++)tick();
  assert.equal(grid.scrollTop,top);
});
test('disabling infinite mode removes every repeated cycle', () => {
  const {canvas,options,cycles} = harness();
  options.enabled = false;
  canvas.rebuild();
  assert.equal(cycles.length,0);
});
