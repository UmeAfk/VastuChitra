'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/script.js'), 'utf8');
const gesture = source.slice(source.indexOf('let gestureBusy = false;'), source.indexOf('// -- move:'));
test('settling a resized tile applies its new cell span before saving', () => {
  const {packGrid} = require('../js/grid-layout.js');
  const card = {dataset:{id:'small'},style:{left:'0px',top:'0px',width:'200px',height:'100px',gridColumn:'1 / span 2'},classList:{remove(){}}};
  const placeholder = {style:{},getBoundingClientRect:() => ({left:0,top:0,width:100,height:100}),before(){},remove(){}};
  let savedSpan = '';
  const context = {window:{VASTU_GRID:{packGrid}},allCards:() => [card],
    gridMetrics:() => ({columns:6}),sizeOf:() => ({cs:1,rs:1}),
    layoutPositions:{small:{col:2,row:0}},livePositions:{},
    cancelFlip(){},reduceMotion:true,grid:{classList:{remove(){}}},
    commitGridOrder(){},pulse(){},saveLayout:() => { savedSpan = card.style.gridColumn; },gestureBusy:true,
    card,placeholder};
  const arrange = source.slice(source.indexOf('function arrangeGrid('),source.indexOf('function commitGridOrder('));
  const settle = source.slice(source.indexOf('function settle('),source.indexOf('// ---- gestures'));
  vm.createContext(context);
  vm.runInContext(arrange + settle + '\narrangeGrid({id:"small",col:2,row:0},layoutPositions,placeholder,card);settle(card,placeholder);',context);
  assert.equal(savedSpan,'3 / span 1');
  assert.equal(card.style.gridRow,'1 / span 1');
});

function gestureHarness(){
  const listeners = new Map();
  const events = [];
  const card = { addEventListener: (name,fn) => listeners.set(name,fn),
    removeEventListener: name => listeners.delete(name), setPointerCapture() {} };
  const context = {
    window:{ addEventListener:(name,fn) => listeners.set(name,fn), removeEventListener:name => listeners.delete(name) },
    startResize: () => ({ move:event => events.push(['move',event.clientX]), end:cancel => events.push(['end',cancel]) }),
    startDrag: () => ({ move:event => events.push(['move',event.clientX]), end:cancel => events.push(['end',cancel]) }),
    card
  };
  vm.createContext(context);
  vm.runInContext(gesture, context);
  const pointer = { pointerId:1,isPrimary:true,clientX:100,clientY:100,preventDefault(){} };
  return { context,listeners,events,card,pointer };
}
test('resize release uses the final pointer position and cleans up listeners', () => {
  const { context,listeners,events,card,pointer } = gestureHarness();
  context.beginGesture(card,pointer,'resize');
  listeners.get('pointerup')({ ...pointer,type:'pointerup',clientX:375 });
  assert.deepEqual(events,[['move',375],['end',false]]);
  assert.equal(listeners.size,0);
});
test('Escape, pointer cancellation, and capture loss cancel the edit', () => {
  for (const event of ['keydown','pointercancel','lostpointercapture']){
    const { context,listeners,events,card,pointer } = gestureHarness();
    context.beginGesture(card,pointer,'resize');
    listeners.get(event)({ ...pointer,type:event,key:'Escape' });
    assert.deepEqual(events.at(-1),['end',true]);
    assert.equal(listeners.size,0);
  }
});
test('a tap does not start a drag and a second pointer cannot resize', () => {
  const { context,listeners,events,card,pointer } = gestureHarness();
  context.beginGesture(card,{...pointer,isPrimary:false},'resize');
  assert.equal(listeners.size,0);
  context.beginGesture(card,pointer,'drag');
  listeners.get('pointerup')({...pointer,type:'pointerup'});
  assert.equal(events.length,0);
  assert.equal(listeners.size,0);
});
test('resize metrics use the visible tracks and both grid gaps', () => {
  const code = source.slice(source.indexOf('function gridMetrics(){'), source.indexOf('function slotRect('));
  const grid = {clientWidth:390};
  const style = {gridTemplateColumns:'186px 186px',columnGap:'18px',gridAutoRows:'150px'};
  const context = {grid,getComputedStyle:() => style,gapPx:() => 18,CFG:{columns:6}};
  vm.createContext(context);
  vm.runInContext(code,context);
  const metrics = context.gridMetrics();
  assert.equal(metrics.columns,2);
  assert.equal(metrics.columnStep,204);
  assert.equal(metrics.rowStep,168);
});
