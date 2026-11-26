const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spread,nextPage}=require('../js/brochure.js');
test('desktop brochure uses facing pages and keeps odd final pages in bounds',()=>{
  assert.deepEqual(spread(0,8,false),{start:0,indices:[0],step:1});
  assert.deepEqual(spread(3,8,false),{start:3,indices:[3,4],step:2});
  assert.deepEqual(spread(100,7,false),{start:6,indices:[6],step:1});
  assert.deepEqual(spread(-2,7,false),{start:0,indices:[0],step:1});
});
test('mobile brochure shows every page, including the final page',()=>{
  for(let i=0;i<8;i++) assert.deepEqual(spread(i,8,true),{start:i,indices:[i],step:1});
});
test('switching from mobile to desktop preserves the spread containing the current page',()=>{
  assert.deepEqual(spread(5,8,false).indices,[5,6]);
  assert.deepEqual(spread(7,8,false).indices,[7]);
});

test('covers stand alone and every interior page is reachable in either direction',()=>{
  for(let count=1;count<=12;count++){
    let index=0;const stops=[0];const visited=[];
    for(let i=0;i<count+1;i++){
      visited.push(...spread(index,count,false).indices);
      const next=nextPage(index,count,false,1);
      if(next===index) break;
      index=next;stops.push(index);
    }
    assert.deepEqual(visited,Array.from({length:count},(_,i)=>i));
    assert.equal(index,count-1);
    for(let i=stops.length-2;i>=0;i--){index=nextPage(index,count,false,-1);assert.equal(index,stops[i]);}
  }
});
