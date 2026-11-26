const {test}=require('node:test');
const assert=require('node:assert/strict');
const {clean,create}=require('../js/view-state.js');
test('reading state persists per collection without affecting another collection',()=>{
  const values=new Map();const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const client=create(storage,'client'),heritage=create(storage,'heritage');
  client.write({projectId:'brochure',brochureIndex:5,scrollTop:340});
  heritage.write({projectId:'temple',detailIndex:2,scrollTop:120});
  assert.equal(client.read().brochureIndex,5);
  assert.equal(client.read().projectId,'brochure');
  assert.equal(heritage.read().projectId,'temple');
  client.write({projectId:null,scrollTop:340});
  assert.equal(client.read().projectId,null);
});
test('invalid, stale and blocked storage safely falls back to the canvas',()=>{
  assert.deepEqual(create({getItem:()=>'{bad'},'test').read(),{});
  const blocked=create({getItem(){throw Error();},setItem(){throw Error();}},'test');
  assert.deepEqual(blocked.read(),{});assert.doesNotThrow(()=>blocked.write({}));
  const state=clean({projectId:{},scrollTop:Infinity,brochureIndex:-9,detailIndex:1.9});
  assert.equal(state.projectId,null);assert.equal(state.scrollTop,0);assert.equal(state.brochureIndex,0);assert.equal(state.detailIndex,1);
});
