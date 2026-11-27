const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/admin.js'),'utf8');
const start=source.indexOf('  function getProjectThumbnail(p){'),end=source.indexOf('  function renderProjectArtwork',start);
const context={isVideoPath:src=>/\.(mp4|webm|mov)(?:$|\?)/i.test(src)};vm.createContext(context);vm.runInContext(source.slice(start,end),context);
test('Admin thumbnails use the visible tile artwork instead of hidden gallery images',()=>{
 const gallery=[{src:'/old.webp'}];
 assert.equal(context.getProjectThumbnail({tile:{style:'logo',logoSrc:'/logo.webp'},slides:gallery}),'/logo.webp');
 assert.equal(context.getProjectThumbnail({tile:{style:'logo',logoIcon:'vr'},slides:gallery}),'');
 assert.equal(context.getProjectThumbnail({tile:{style:'gradient'},slides:gallery}),'');
 assert.equal(context.getProjectThumbnail({poster:'/poster.webp',slides:[{src:'/film.mp4'}]}),'/poster.webp');
 assert.equal(context.getProjectThumbnail({slides:[{src:'/film.mp4'},...gallery]}),'/old.webp');
});
