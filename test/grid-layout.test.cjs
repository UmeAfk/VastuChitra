'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {packGrid} = require('../js/grid-layout.js');
const items = [{id:'left',cs:2,rs:2},{id:'middle',cs:2,rs:2},{id:'right',cs:2,rs:2},{id:'small',cs:1,rs:1}];
const preferred = {left:{col:0,row:0},middle:{col:2,row:0},right:{col:4,row:0},small:{col:0,row:2}};
function noOverlap(items,positions,cols){
  const cells = new Set();
  for(const item of items){
    const pos = positions[item.id], width = Math.min(cols,item.cs);
    assert.ok(pos.col >= 0 && pos.col + width <= cols);
    for(let y=pos.row;y<pos.row+item.rs;y++) for(let x=pos.col;x<pos.col+width;x++){
      const key = y + ':' + x;
      assert.equal(cells.has(key),false,'overlap at ' + key);
      cells.add(key);
    }
  }
}
test('a small tile can reserve a cell between three large tiles', () => {
  const positions = packGrid(items,6,preferred,{id:'small',col:2,row:0});
  assert.deepEqual(positions.small,{col:2,row:0});
  assert.deepEqual(positions.left,preferred.left);
  assert.deepEqual(positions.right,preferred.right);
  assert.ok(positions.middle.row >= 1);
  noOverlap(items,positions,6);
});
test('an existing empty cell can be filled without shifting its neighbours', () => {
  const positions = packGrid(items,6,preferred,{id:'small',col:5,row:2});
  for(const id of ['left','middle','right']) assert.deepEqual(positions[id],preferred[id]);
  assert.deepEqual(positions.small,{col:5,row:2});
});
test('enlarging a card moves overlapping cards without overlaps', () => {
  const resized = items.map(item => item.id === 'left' ? {...item,cs:3,rs:3} : item);
  const positions = packGrid(resized,6,preferred,{id:'left',col:0,row:0});
  assert.deepEqual(positions.left,{col:0,row:0});
  noOverlap(resized,positions,6);
});
test('narrow screens clamp the same saved layout to visible columns', () => {
  const positions = packGrid(items,2,preferred);
  noOverlap(items,positions,2);
  assert.deepEqual(packGrid(items,2,JSON.parse(JSON.stringify(positions))),positions);
});
test('saved positions reproduce the exact dropped cell', () => {
  const positions = packGrid(items,6,preferred,{id:'small',col:3,row:4});
  assert.deepEqual(packGrid(items,6,JSON.parse(JSON.stringify(positions))),positions);
});

test('follow grid preserves tile proportions and stays bounded at all device column counts',()=>{
 const {followGrid}=require('../js/grid-layout.js');
 for(const columns of [1,2,4,6,8,12]){const result=followGrid(items,columns);const adjusted=items.map(item=>({...item,...result.sizes[item.id]}));noOverlap(adjusted,result.positions,columns);const height=Math.max(...adjusted.map(item=>result.positions[item.id].row+item.rs));for(const item of adjusted)assert.equal(item.rs,items.find(original=>original.id===item.id).rs);}
});

test('Follow grid reserves the actual drop cell instead of packing a moved tile back into its old hole',()=>{const {followGrid}=require('../js/grid-layout.js');const result=followGrid(items,6,preferred,{id:'small',col:3,row:3});assert.deepEqual(result.positions.small,{col:3,row:3});noOverlap(items,result.positions,6);});
