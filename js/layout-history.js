((scope)=>{
 function create(initial,limit=40){
  let entries=[JSON.stringify(initial)],index=0;
  return {
   record(value){const next=JSON.stringify(value);if(next===entries[index])return false;entries=entries.slice(0,index+1);entries.push(next);if(entries.length>limit)entries.shift();index=entries.length-1;return true;},
   undo(){if(index===0)return null;return JSON.parse(entries[--index]);},
   redo(){if(index===entries.length-1)return null;return JSON.parse(entries[++index]);},
   get canUndo(){return index>0;},get canRedo(){return index<entries.length-1;}
  };
 }
 const api={create};if(typeof module==='object')module.exports=api;else scope.VASTU_LAYOUT_HISTORY=api;
})(typeof window==='object'?window:globalThis);
