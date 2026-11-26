/* Per-tab refresh state, isolated by page and collection. No cookies or accounts. */
((scope)=>{
  const number=(value,max)=>Number.isFinite(Number(value)) ? Math.min(max,Math.max(0,Number(value))) : 0;
  function clean(value){
    if(!value || typeof value!=='object')return {};
    return {
      projectId:typeof value.projectId==='string' ? value.projectId.slice(0,200) : null,
      scrollTop:number(value.scrollTop,10000000),
      detailIndex:Math.floor(number(value.detailIndex,10000)),
      brochureIndex:Math.floor(number(value.brochureIndex,10000)),
      detailScroll:number(value.detailScroll,10000000)
    };
  }
  function create(storage,key){
    return {
      read(){try{return clean(JSON.parse(storage.getItem(key)));}catch{return {}; }},
      write(value){try{storage.setItem(key,JSON.stringify(clean(value)));}catch{} }
    };
  }
  if(typeof module==='object')module.exports={clean,create};else scope.VASTU_VIEW_STATE={clean,create};
})(typeof window==='object' ? window : globalThis);
