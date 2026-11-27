const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../js/layout-history.js');
test('layout history restores order sizes and positions without aliasing',()=>{
 const original={order:['a','b'],sizes:{a:{cs:2,rs:1}},positions:{a:{col:0,row:0}}};const history=create(original);
 const changed={order:['b','a'],sizes:{a:{cs:3,rs:2}},positions:{a:{col:2,row:1}}};history.record(changed);changed.sizes.a.cs=99;
 assert.deepEqual(history.undo(),original);assert.equal(history.redo().sizes.a.cs,3);assert.equal(history.redo(),null);
});
test('a new layout after undo clears redo and duplicate snapshots are ignored',()=>{
 const h=create({n:0});h.record({n:1});h.record({n:2});assert.deepEqual(h.undo(),{n:1});h.record({n:3});assert.equal(h.canRedo,false);assert.equal(h.record({n:3}),false);assert.deepEqual(h.undo(),{n:1});
});
test('long-reset layout remains undoable and history has a bounded size',()=>{
 const h=create({n:0},3);h.record({n:1});h.record({n:2});h.record({n:0});assert.deepEqual(h.undo(),{n:2});assert.deepEqual(h.undo(),{n:1});assert.equal(h.undo(),null);
});
