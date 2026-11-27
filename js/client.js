// A single development, explored through individual editable experience cards.
// Artwork is from the bundled studio library until the client's assets are supplied.
(() => {
  const image = n => ({src:`/public/shreesadhna/${(n-1)%17+1}.webp`,pos:'50% 50%'});
  const make = (key,title,cat,sub,size,kind,extra={}) => ({
    id:`sadhna-${key}`,title,cat,sub,size,clientKind:kind,icon:'frames',accent:'gold',
    fx:'fade',interval:6500,slides:[],action:{type:'detail'},...extra
  });
  const paper = color => ({style:'gradient',color,frame:false});
  const block = (key,color) => make(key,'Colour study','Palette','',[1,1],'colour',{
    tile:{...paper(color),showTitle:false,showCategory:false,showDescription:false},action:{type:'none'}
  });
  window.VASTUCHITRA_CLIENT = [
    make('overview','Shree Sadhna','The project','A place to make your own.',[3,2],'overview',{
      icon:'home',tile:paper('#ece6da'),
      desc:'Shree Sadhna brings every part of the project into one place: the architecture, the views, the people and the experiences. This is a presentation preview; project facts and final artwork will be added with the client.',
      specs:[['Project','Shree Sadhna'],['Location','To be added'],['Developer','To be added'],['Presentation','Preview artwork from the studio library']]
    }),
    make('renders','The architecture','01 / Render collection','Exterior. Interior. Every detail.',[3,2],'renders',{
      slides:[1,3,5,10,14,18].map(image),desc:'Explore the image collection. These studio library renders demonstrate the gallery; replace them with the approved Shree Sadhna renders.',icon:'frames'
    }),
    block('clay','#bb623f'),
    make('rera','The details, on record.','02 / RERA & project facts','Registration details to be added',[2,1],'rera',{
      reraNumber:'FFDFH541316556854H',slides:[{src:'/public/shreesadhna/rera-document.webp'}],tile:paper('#e2ddcc'),icon:'blueprint',desc:'The official project registration, approved details and relevant documents will live here. No registration number has been supplied.',
      specs:[['RERA registration','To be added'],['Registered project name','To be confirmed'],['Authority / official record','To be added']]
    }),
    make('walkthrough','Step inside.','03 / Walkthrough film','The project, in motion.',[3,2],'film',{
      slides:[{src:'/public/shreesadhna/Walkthrough.mp4'}],poster:'/public/shreesadhna/walkthrough-poster.webp',icon:'reel',desc:'Watch the Shree Sadhna architectural walkthrough.'
    }),
    make('ar','Bring it into your space.','04 / Augmented reality','AR experience to be connected',[2,1],'ar',{
      tile:paper('#d9e0ce'),icon:'ar',desc:'A dedicated entry to the project’s augmented reality model. Add the hosted AR experience URL in this card’s Action settings.'
    }),
    make('vr','A different point of view.','05 / Virtual reality','VR experience to be connected',[2,1],'vr',{
      tile:paper('#382c40'),icon:'vr',desc:'Explore the development at full scale. Connect the VR application or hosted experience in this card’s Action settings.'
    }),
    block('sage','#899777'),
    make('balcony','Your everyday horizon.','06 / Balcony views','A little further. A little quieter.',[3,2],'balcony',{
      slides:[8,9,4].map(image),icon:'landscape',desc:'A gallery for views from individual balconies and floors. Current images are preview artwork; approved floor and direction labels can be added as specifications.'
    }),
    make('360','Look all around.','07 / Interactive 360°','360° walkthrough to be connected',[2,1],'360',{
      tile:paper('#c5b48f'),icon:'orbit',desc:'An interactive tour of the project. Connect the published 360° walkthrough through this card’s URL action.'
    }),
    make('projection','Architecture, illuminated.','08 / Projection mapping','Mapping experience to be connected',[2,1],'projection',{
      tile:paper('#4a4151'),icon:'projector',desc:'A home for the project’s projection mapping film or installation. Upload the film in Media or connect the installation application in Action settings.'
    }),
    make('brochures','Take a closer look.','09 / Brochures & plans','Project documents to be added',[2,1],'documents',{
      tile:paper('#e8d5ba'),icon:'blueprint',desc:'The project brochure, floor plans and information pack will be available here. Add an approved PDF URL as this card’s action when ready.'
    }),
    block('plum','#382c40'),
    make('site','From the site.','10 / Site camera','Camera not connected',[3,1],'camera',{
      tile:paper('#d5d8cc'),icon:'projector',desc:'The live site camera has not been connected. Add an authorized, embeddable camera URL in this card’s Action settings. This preview does not display a live feed.',
      specs:[['Feed status','Not connected'],['Site / camera','To be added']]
    }),
    make('people','The people behind it.','11 / Project team','One project. Many hands.',[3,1],'people',{
      tile:paper('#ece6da'),icon:'building',desc:'Credits for the people who brought the project together. Add the actual names and roles in this card’s specifications.',
      specs:[['Developer','To be added'],['Architect','To be added'],['Visualization & experiences','To be confirmed'],['Project consultants','To be added']]
    }),
    make('tools','Made with.','12 / Software & workflow','The tools behind the experience',[2,1],'tools',{
      tile:paper('#d9e0ce'),icon:'cube',desc:'A place to credit the production software and tools actually used on this project. Add confirmed software names and their role in the specifications.'
    }),
    make('partners','In good company.','13 / Associated brands','Project partners & collaborators',[2,1],'partners',{
      tile:paper('#e2ddcc'),icon:'garden',desc:'Credits for the brands and partners associated with Shree Sadhna. Add confirmed names, logos and links once supplied.'
    }),
    block('ochre','#c3a471'),
    make('green','Green building status','Green building status','Green building status · Awaiting details',[2,2],'green',{
      tile:paper('#d9e0ce'),icon:'garden',
      desc:'The project’s environmental goals, resource strategy and verified green building status belong here. No certification, rating or performance claim has been supplied yet.',
      specs:[['Certification / rating','To be confirmed'],['Energy strategy','To be added'],['Water & reuse','To be added'],['Landscape & materials','To be added']]
    }),
    make('balcony-simulator','Balcony simulator','Balcony simulator','Balcony simulator · Not connected',[2,2],'balcony-simulator',{
      tile:paper('#c5b48f'),icon:'landscape',
      desc:'A dedicated entry to the balcony simulator: explore the view from different floors, orientations and times of day once the experience is connected. Add the simulator URL or application in this card’s Action settings.',
      specs:[['Experience','Balcony simulator'],['Connection','Not connected'],['Floors & orientations','To be supplied']]
    }),
    make('design-intent','Design intent','Design intent','The idea behind the architecture',[2,2],'design-intent',{
      slides:[image(3),image(14)],icon:'blueprint',
      desc:'A place for the architectural concept, site response, design decisions and material story. The current images are studio preview artwork; add the approved Shree Sadhna design narrative here.',
      specs:[['Architectural concept','To be added'],['Site response','To be added'],['Materials & character','To be added']]
    }),
    make('mep','MEP & coordination','MEP & coordination','Building systems, brought together',[2,2],'mep',{
      tile:paper('#d5d8cc'),icon:'model',
      desc:'Explore the mechanical, electrical and plumbing systems behind the project. Add approved diagrams, coordination views and system information, or connect a model viewer through this card’s Action settings.',
      specs:[['Mechanical / ventilation','To be supplied'],['Electrical systems','To be supplied'],['Plumbing & drainage','To be supplied'],['Fire & life safety','To be supplied']]
    })
  ];
  // Eight-column exhibition wall: every default tile has a deliberate slot.
  window.VASTUCHITRA_CLIENT_COMPOSITION = {
    overview:{size:[4,2],col:0,row:0},renders:{size:[4,3],col:4,row:0},
    clay:{size:[1,1],col:0,row:2},rera:{size:[3,1],col:1,row:2},
    walkthrough:{size:[4,2],col:0,row:3},vr:{size:[2,1],col:4,row:3},ar:{size:[2,1],col:6,row:3},
    sage:{size:[1,1],col:4,row:4},'360':{size:[3,1],col:5,row:4},
    balcony:{size:[3,2],col:0,row:5},brochures:{size:[3,2],col:3,row:5},projection:{size:[2,1],col:6,row:5},
    plum:{size:[1,1],col:6,row:6},tools:{size:[1,1],col:7,row:6},
    green:{size:[2,2],col:0,row:7},people:{size:[2,1],col:2,row:7},site:{size:[4,1],col:4,row:7},
    partners:{size:[2,1],col:2,row:8},ochre:{size:[1,1],col:4,row:8},mep:{size:[3,1],col:5,row:8},
    'design-intent':{size:[4,2],col:0,row:9},'balcony-simulator':{size:[4,2],col:4,row:9}
  };
  const titles = {ar:'Augmented reality',vr:'Virtual reality','360':'Interactive 360°',projection:'Projection mapping',brochures:'Brochures & plans',people:'Project team',tools:'Software used',partners:'Brand partners',site:'Live site camera',renders:'Detailed renders',walkthrough:'Walkthrough video',balcony:'Balcony views',rera:'RERA & project facts'};
  const labels={ar:'Augmented reality · Not connected',vr:'Virtual reality · Not connected','360':'Interactive 360° tour · Not connected',projection:'Projection mapping · Not connected',brochures:'Brochure & floor plans',people:'Project team & credits',tools:'Software & workflow',partners:'Associated brands',site:'Site camera · Not connected',renders:'Architectural render collection',walkthrough:'Shree Sadhna walkthrough film',balcony:'Balcony views & perspectives',rera:'RERA & project facts · Awaiting details'};
  window.VASTUCHITRA_CLIENT_NAMES=titles;
  window.VASTUCHITRA_CLIENT_LABELS=labels;
  window.VASTUCHITRA_BROCHURE_PAGES = [
    {layout:'cover',src:'/public/shreesadhna/3.webp',eyebrow:'Project publication · Preview edition',title:'Shree Sadhna',body:'A place to make your own.\nStudio preview artwork.'},
    {layout:'text',eyebrow:'01 / A first look',title:'A project,\nin perspective.',body:'Architecture. Shared spaces. The views beyond your window.\n\nExplore this sample publication through images and project notes. Final project information and approved artwork will replace this preview edition.'},
    {layout:'photo',src:'/public/shreesadhna/1.webp',eyebrow:'02 / Shared spaces',title:'Room for everyday moments.',body:'Preview render from the studio library.'},
    {layout:'text',eyebrow:'03 / The architecture',title:'The details\nmake the difference.',body:'Use this page for the design story, materials, finishes and amenities.\n\nProject-specific information is to be added after client approval.'},
    {layout:'photo',src:'/public/shreesadhna/1.webp',eyebrow:'04 / Interior studies',title:'Spaces within.',body:'Preview render from the studio library.'},
    {layout:'plan',eyebrow:'05 / Plans & layouts',title:'A closer look\nat the plan.',body:'Approved floor plans have not been supplied yet.\n\nAdd a plan image to this page in Admin. Plan images are shown in full so dimensions and annotations remain visible.'},
    {layout:'photo',src:'/public/shreesadhna/8.webp',eyebrow:'06 / Beyond the building',title:'Another point of view.',body:'Preview render from the studio library.'},
    {layout:'text',eyebrow:'Shree Sadhna',title:'The next chapter.',body:'This is a sample project publication.\n\nDeveloper details, location, RERA registration, specifications and contact information are to be added. All imagery currently shown is studio preview artwork.'}
  ];
  window.VASTUCHITRA_CLIENT.find(project=>project.clientKind==='documents').brochurePages = window.VASTUCHITRA_BROCHURE_PAGES;
  window.VASTUCHITRA_CLIENT.forEach(project => {
    const key = project.id.replace('sadhna-','');
    const slot = window.VASTUCHITRA_CLIENT_COMPOSITION[key];
    project.previousSize = project.size;
    project.size = slot.size;
    project.canvasPosition = {col:slot.col,row:slot.row};
    if (titles[key]) project.title = titles[key];
    if (labels[key]) project.sub = labels[key];
  });
  window.VASTUCHITRA_CLIENT_ASSETS = projects => projects.map(project=>{
    if(!project.id.startsWith('sadhna-'))return project;
    const key=project.id.replace('sadhna-','');
    const replace=src=>typeof src==='string' ? src.replace(/\/public\/demo\/project-(\d+)\.webp/g,(_,n)=>'/public/shreesadhna/'+((+n-1)%17+1)+'.webp') : src;
    const result={...project,slides:(project.slides||[]).map(slide=>typeof slide==='string' ? replace(slide) : {...slide,src:replace(slide.src)}),brochurePages:project.brochurePages?.map(page=>({...page,src:replace(page.src)}))};
    const backgrounds={rera:2,ar:7,vr:12,'360':4,projection:15,brochures:1,site:8,people:13,tools:14,partners:17,green:9,mep:6,'balcony-simulator':17};
    if(backgrounds[key] && (result.featureImage || result.tile?.style==='gradient' || !result.slides.length)){
      result.slides=[{src:'/public/shreesadhna/'+backgrounds[key]+'.webp',pos:'50% 50%'}];
      result.tile={...result.tile,style:'image'};delete result.tile.color;
    }
    delete result.featureImage;
    if(key==='renders' && result.slides.length===6 && result.slides.every(slide=>slide.src?.startsWith('/public/shreesadhna/')))result.slides=Array.from({length:17},(_,i)=>({src:'/public/shreesadhna/'+(i+1)+'.webp',pos:'50% 50%'}));
    return result;
  });
  window.VASTUCHITRA_CLIENT_ICON_TILES=projects=>projects.map(project=>{
    const colours={rera:'#bd4a2c',ar:'#007e83',vr:'#5737b0','360':'#1466b8',projection:'#a52d72',site:'#155c6e',tools:'#3853a5',partners:'#a43443',green:'#167547',mep:'#a05216'};
    const colour=colours[project.id.replace('sadhna-','')];
    if(!colour)return project;
    return {...project,tile:{...project.tile,style:'logo',color:colour,logoIcon:project.icon,logoSrc:null,showTitle:true,showCategory:false,showDescription:false}};
  });
  window.VASTUCHITRA_CLIENT_SUPPLIED_ART=projects=>projects.map(project=>{
    const artwork={vr:'vr-headset.webp',rera:'maha rera.webp',people:'Team+forming.webp',partners:'brand-partners.webp'};
    const image=artwork[project.id.replace('sadhna-','')];
    return image ? {...project,tile:{...project.tile,style:'logo',color:'#ffffff',logoIcon:null,logoSrc:'/public/shreesadhna/'+image,showTitle:true,showCategory:false,showDescription:false}} : project;
  });
  window.VASTUCHITRA_CLIENT=window.VASTUCHITRA_CLIENT_SUPPLIED_ART(window.VASTUCHITRA_CLIENT_ICON_TILES(window.VASTUCHITRA_CLIENT_ASSETS(window.VASTUCHITRA_CLIENT)));
})();
