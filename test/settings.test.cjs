const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalize,resolve,layout,presets}=require('../js/settings.js');
test('each collection retains its design defaults and saves layout independently',()=>{
  const input={presentationMode:'personal',presentationLayouts:{personal:{cardGap:26,columns:10,rows:5}}};
  const settings=normalize(input);
  assert.equal(resolve(settings).cardGap,26);
  assert.equal(resolve(settings).columns,10);
  assert.equal(resolve(settings,'heritage').cardGap,presets.heritage.cardGap);
  assert.equal(resolve(settings,'commercial').columns,8);
  assert.deepEqual(input.presentationLayouts,{personal:{cardGap:26,columns:10,rows:5}});
});
test('invalid values are clamped and zero-valued controls are preserved',()=>{
  const settings=normalize({canvasEdgeStrength:0,brochureCornerRadius:0,hoverZoomDuration:99999,brochureSize:'bad',clientThemeDefault:'invalid',clientLightBackground:'url(x)',presentationLayouts:{personal:{columns:999,cardGap:-100,rows:'not a number'}}});
  assert.equal(settings.canvasEdgeStrength,0);
  assert.equal(settings.brochureCornerRadius,0);
  assert.equal(settings.hoverZoomDuration,2500);
  assert.equal(settings.brochureSize,72);
  assert.equal(settings.clientThemeDefault,'system');
  assert.equal(settings.clientLightBackground,'#dce5ee');
  assert.equal(layout(settings,'personal').columns,12);
  assert.equal(layout(settings,'personal').cardGap,6);
  assert.equal(layout(settings,'personal').rows,6);
});
test('disabled features, unknown settings and saved settings round-trip unchanged',()=>{
  const settings=normalize({brochureAnimate:false,brochureSwipe:false,clientShowThemeToggle:false,hoverZoomEnabled:false,customSetting:'kept'});
  assert.equal(settings.brochureAnimate,false);
  assert.equal(settings.brochureSwipe,false);
  assert.equal(settings.clientShowThemeToggle,false);
  assert.equal(settings.hoverZoomEnabled,false);
  assert.equal(settings.customSetting,'kept');
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(settings))),settings);
});
test('collection options override defaults independently while universal motion stays shared',()=>{
  const source={motion:false,hoverZoomDuration:1100,presentationOptions:{personal:{hoverZoomDuration:1500,canvasLoop:false},heritage:{hoverZoomDuration:700,canvasLoop:true}}};
  assert.equal(resolve(source,'personal').hoverZoomDuration,1500);
  assert.equal(resolve(source,'personal').canvasLoop,false);
  assert.equal(resolve(source,'heritage').hoverZoomDuration,700);
  assert.equal(resolve(source,'heritage').canvasLoop,true);
  assert.equal(resolve(source,'commercial').hoverZoomDuration,1100);
  assert.equal(resolve(source,'personal').motion,false);
  assert.equal(resolve(source,'heritage').motion,false);
});
test('infinite scroll is off by default and can be enabled for a collection',()=>{
  assert.equal(resolve({},'personal').canvasLoop,false);
  assert.equal(resolve({presentationOptions:{personal:{canvasLoop:true}}},'personal').canvasLoop,true);
});
