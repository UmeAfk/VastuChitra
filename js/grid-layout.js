/* Deterministic cell placement: a dragged tile reserves its actual grid cells. */
((scope) => {
  function packGrid(items, columns, preferred = {}, anchor = null){
    columns = Math.max(1,Math.floor(Number(columns)) || 1);
    const limit = Math.max(1,items.reduce((sum,item) => sum + (Number(item.rs) || 1),0) * 2);
    const occupied = new Set(), positions = {}, sizes = {};
    for (const item of items) sizes[item.id] = {
      cs:Math.min(columns,Math.max(1,Math.floor(Number(item.cs)) || 1)),
      rs:Math.min(32,Math.max(1,Math.floor(Number(item.rs)) || 1))
    };
    function normalize(id, pos){
      return { col:Math.max(0,Math.min(columns - sizes[id].cs,Math.floor(Number(pos?.col)) || 0)),
        row:Math.max(0,Math.min(limit,Math.floor(Number(pos?.row)) || 0)) };
    }
    function fits(id, pos){
      for(let y=pos.row;y<pos.row + sizes[id].rs;y++)
        for(let x=pos.col;x<pos.col + sizes[id].cs;x++) if(occupied.has(y + ':' + x)) return false;
      return true;
    }
    function put(id, pos){
      positions[id] = pos;
      for(let y=pos.row;y<pos.row + sizes[id].rs;y++)
        for(let x=pos.col;x<pos.col + sizes[id].cs;x++) occupied.add(y + ':' + x);
    }
    if (anchor && sizes[anchor.id]) put(anchor.id,normalize(anchor.id,anchor));
    // Keep unaffected tiles where they were, before finding homes for displaced tiles.
    for(const item of items){
      if(positions[item.id] || !preferred[item.id]) continue;
      const pos = normalize(item.id,preferred[item.id]);
      if(fits(item.id,pos)) put(item.id,pos);
    }
    for(const item of items){
      if(positions[item.id]) continue;
      let placed = false;
      for(let row=0;!placed;row++){
        for(let col=0;col<=columns-sizes[item.id].cs;col++){
          const pos = {row,col};
          if(fits(item.id,pos)){ put(item.id,pos); placed = true; break; }
        }
      }
    }
    return positions;
  }
  // Dense placement preserves individual tile proportions instead of stretching a whole row.
  function followGrid(items,columns,preferred={},anchor=null){
    columns=Math.max(1,Math.floor(columns)||1);
    const sizes=Object.fromEntries(items.map(item=>[item.id,{cs:Math.min(columns,Math.max(1,Math.floor(item.cs)||1)),rs:Math.max(1,Math.floor(item.rs)||1)}]));
    const positions=packGrid(items,columns,preferred,anchor);
    return {positions,sizes};
  }
  if(typeof module === 'object') module.exports = {packGrid,followGrid};
  else scope.VASTU_GRID = {packGrid,followGrid};
})(typeof window === 'object' ? window : globalThis);
