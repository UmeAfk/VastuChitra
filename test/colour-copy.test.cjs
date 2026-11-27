const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/script.js'),'utf8');const context={};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function isColourBlock('),source.indexOf('function duplicateColourBlock(')),context);
test('only plain decorative colour blocks qualify for Shift duplication',()=>{const block={action:{type:'none'},tile:{style:'gradient',color:'#bb623f',showTitle:false,showCategory:false,showDescription:false}};assert.equal(context.isColourBlock(block),true);assert.equal(context.isColourBlock({...block,action:{type:'detail'}}),false);assert.equal(context.isColourBlock({...block,tile:{...block.tile,logoIcon:'cube'}}),false);assert.equal(context.isColourBlock({...block,tile:{...block.tile,showTitle:true}}),false);assert.equal(context.isColourBlock(undefined),false);});

function gestureHarness(shiftKey){
 const events=new Map(),original={dataset:{id:'original'},addEventListener(){},removeEventListener(){},setPointerCapture(){}},copy={dataset:{id:'copy'}};
 let copies=0,dragged=null,ended=null;
 const ctx={gestureBusy:false,window:{addEventListener:(name,fn)=>events.set(name,fn),removeEventListener(){}},byId:new Map([['original',{}]]),isColourBlock:()=>true,duplicateColourBlock:()=>{copies++;return copy;},startDrag:card=>{dragged=card;return {move(){},end:cancelled=>{ended=cancelled;}};}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function beginGesture('),source.indexOf('// -- move:')),ctx);
 ctx.beginGesture(original,{isPrimary:true,pointerId:1,clientX:0,clientY:0,shiftKey,preventDefault(){}},'drag');
 return {events,original,copy,get copies(){return copies;},get dragged(){return dragged;},get ended(){return ended;}};
}
test('Shift drag creates a copy only after the drag threshold and drags that copy',()=>{const h=gestureHarness(true);h.events.get('pointermove')({pointerId:1,clientX:2,clientY:1});assert.equal(h.copies,0);h.events.get('pointermove')({pointerId:1,clientX:20,clientY:0});assert.equal(h.copies,1);assert.equal(h.dragged,h.copy);h.events.get('pointerup')({pointerId:1,clientX:30,clientY:0,type:'pointerup'});assert.equal(h.ended,false);});
test('ordinary drag keeps moving the original and Escape discards a new copy',()=>{const normal=gestureHarness(false);normal.events.get('pointermove')({pointerId:1,clientX:20,clientY:0});assert.equal(normal.copies,0);assert.equal(normal.dragged,normal.original);const copy=gestureHarness(true);copy.events.get('pointermove')({pointerId:1,clientX:20,clientY:0});copy.events.get('keydown')({key:'Escape',preventDefault(){}});assert.equal(copy.copy._discardOnSettle,true);assert.equal(copy.ended,true);});
