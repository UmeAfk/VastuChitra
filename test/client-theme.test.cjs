const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../js/client-theme.js'),'utf8');
function load(saved,systemDark=false,blocked=false,settings={}){
  const events = {}, systemEvents = {};
  const root = {dataset:{}};
  let stored = saved;
  const context = {
    document:{documentElement:root}, Event:class {constructor(type){this.type=type;}},
    window:{VASTU_SETTINGS:require('../js/settings.js'),VASTUCHITRA:{settings},dispatchEvent(){},addEventListener:(name,fn)=>events[name]=fn},
    matchMedia:query=>({matches:query.includes('color-scheme') ? systemDark : true,addEventListener:(name,fn)=>systemEvents[name]=fn}),
    localStorage:{getItem(){if(blocked)throw Error();return stored;},setItem(key,value){if(blocked)throw Error();stored=value;}}
  };
  vm.runInNewContext(source,context);
  return {root,events,systemEvents,toggle:()=>context.window.VASTU_CLIENT_THEME.toggle(),stored:()=>stored};
}
test('Client starts from saved appearance or the system preference',()=>{
  assert.equal(load('light',true).root.dataset.clientTheme,'light');
  assert.equal(load('dark').root.dataset.clientTheme,'dark');
  assert.equal(load(null,true).root.dataset.clientTheme,'dark');
  assert.equal(load('invalid').root.dataset.clientTheme,'light');
});
test('Client theme toggles persist and work with storage blocked',async()=>{
  const page = load('light');
  await page.toggle();
  assert.equal(page.root.dataset.clientTheme,'dark');
  assert.equal(page.stored(),'dark');
  await page.toggle();
  assert.equal(page.root.dataset.clientTheme,'light');
  const blocked = load(null,false,true);
  await blocked.toggle();
  assert.equal(blocked.root.dataset.clientTheme,'dark');
});
test('configured default is used when remembering is off and does not overwrite a saved preference',async()=>{
  const page=load('dark',true,false,{clientThemeDefault:'light',clientRememberTheme:false});
  assert.equal(page.root.dataset.clientTheme,'light');
  await page.toggle();await page.toggle();
  assert.equal(page.stored(),'dark');
  page.events.storage({key:'vastuchitra-client-theme-v1',newValue:'dark'});
  assert.equal(page.root.dataset.clientTheme,'light');
});
test('system changes follow automatic mode and other tabs synchronize saved choices',async()=>{
  const page = load(null);
  page.systemEvents.change({matches:true});
  assert.equal(page.root.dataset.clientTheme,'dark');
  await page.toggle();
  page.systemEvents.change({matches:true});
  assert.equal(page.root.dataset.clientTheme,'light');
  page.events.storage({key:'vastuchitra-client-theme-v1',newValue:'dark'});
  assert.equal(page.root.dataset.clientTheme,'dark');
});

test('theme changes do not snapshot video or header layers and rapid toggles stay consistent',async()=>{
 const root={dataset:{}};let snapshots=0;
 const sandbox={document:{documentElement:root,startViewTransition(){snapshots++;throw Error('Unexpected snapshot');}},window:{VASTU_SETTINGS:require('../js/settings.js'),VASTUCHITRA:{settings:{}},dispatchEvent(){},addEventListener(){}},Event:class{},matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem:()=> 'light',setItem(){}}};
 vm.runInNewContext(source,sandbox);
 for(let i=0;i<6;i++)await sandbox.window.VASTU_CLIENT_THEME.toggle();
 assert.equal(snapshots,0);assert.equal(root.dataset.clientTheme,'light');
});
