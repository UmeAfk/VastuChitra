// Load the shared repository-backed configuration before rendering the hosted UI.
window.VASTU_CLOUD_READY=(async()=>{
 if(['localhost','127.0.0.1','[::1]'].includes(location.hostname)||location.protocol==='file:')return;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
 try{
  const response=await fetch('/api/admin?action=config',{cache:'no-store',signal:controller.signal});if(!response.ok)return;
  const data=await response.json();window.VASTU_CLOUD={enabled:data.enabled,revision:data.revision||null};
  if(data.config){window.VASTUCHITRA=window.VASTUCHITRA_COMMERCIAL(data.config);window.VASTUCHITRA.settings.meetingPreview=true;}
 }catch{}finally{clearTimeout(timer);}
})();
