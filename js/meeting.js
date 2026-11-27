// Meeting mode is a separate presentation; the saved studio catalogue stays intact.
(() => {
  // Static hosting also serves index.html directly. A rewrite for / cannot
  // reliably override that file, so select the bundled showcase on remote hosts.
  const hosted = /^https?:$/.test(location.protocol) && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const staticMode = hosted || new URLSearchParams(location.search).has('demo') || document.documentElement.dataset.meeting === 'true';
  const image = n => ({ src: `/public/demo/project-${n}.webp`, pos: '50% 50%' });
  const card = (id, title, cat, sub, size, slides, extra = {}) => ({
    id, title, cat, sub, size, slides, icon: 'frames', accent: 'cyan',
    fx: 'push', interval: 4600, action: { type: 'detail' }, ...extra
  });
  const minimal = (color, logoIcon) => ({
    style: logoIcon ? 'logo' : 'gradient', color, logoIcon,
    showTitle: false, showCategory: false, showDescription: false, frame: false
  });
  const showcase = {
    settings: {
      ...window.VASTUCHITRA?.settings, columns: 8, rows: 5, showAdmin: true, showTools: false,
      meetingPreview: true, autoplaySlides: true, motion: true, introAnimation: true,
      showClock: true, showProjectCount: false, cardTilt: false, cardGap: 10,
      cardRadius: 4, pagePadding: 28, cardContentPadding: 16, cardRowHeight: 100
    },
    projects: [
      card('meeting-selected', 'Spaces worth experiencing.', 'Selected work', 'Architecture, brought to life.', [3, 2], [1,2,3,4,5,6,7,8,9].map(image), {
        desc: 'Explore a selection of architectural images from our studio library. Swipe the tile or choose a view below to look closer.',
        specs: [['Collection', 'Nine selected architectural views'], ['Experience', 'Touch, swipe, explore']]
      }),
      card('meeting-brand', 'VastuChitra', 'Our studio', 'Ideas. Images. Experiences.', [1, 1], [], {
        tile: { ...minimal('#007C91', 'cube'), logoSrc: 'public/logo-ui.png', logoIcon: null, style: 'logo' },
        desc: 'A living canvas for the work, people, and ideas behind our studio.', icon: 'cube'
      }),
      card('meeting-residences', 'A new perspective.', 'Architecture', 'Details that bring a place to life.', [2, 2], [3,4,10,11].map(image), { fx: 'lift', interval: 5300, accent: 'mint' }),
      card('meeting-about', 'We make space for imagination.', 'About us', 'Meet the thinking behind the images.', [2, 1], [], {
        tile: { style: 'gradient', color: '#00856C' }, icon: 'garden', accent: 'mint',
        desc: 'VastuChitra brings architectural imagery and interactive experiences together in one place. This showcase connects project stories, studio updates, and the people behind the work.',
        specs: [['Our focus', 'Architectural visualization'], ['Our canvas', 'Images · Motion · Interactive experiences']]
      }),
      card('meeting-cube', 'Spatial experiences', 'Studio mark', '', [1, 1], [], {
        tile: minimal('#643DB2', 'cube'), desc: 'Ideas become spaces. Explore our studio’s architectural visualization and interactive experiences.'
      }),
      card('meeting-journal', 'Inside the studio', 'Studio journal · Preview', 'New perspectives. Work in progress. Ideas taking shape.', [2, 1], [], {
        tile: { style: 'gradient', color: '#C44B26' }, icon: 'blueprint', accent: 'coral',
        desc: 'A place for your newsletter, recent work, studio milestones, and behind-the-scenes stories. This sample edition shows how a newsletter tile can sit alongside client projects.',
        specs: [['In this edition', 'From first sketch to final frame'], ['Studio notes', 'Material, light, and atmosphere']]
      }),
      card('meeting-outdoors', 'Life beyond the walls.', 'Landscape & community', 'Places to pause, connect, and belong.', [2, 2], [5,6,12].map(image), { fx: 'wipe', interval: 6100, accent: 'mint' }),
      card('meeting-palette', 'Studio ochre', 'Studio palette', '', [1, 1], [], {
        tile: minimal('#D49B32'), desc: 'A simple block of studio colour. A moment of breathing room between the images.'
      }),
      card('meeting-process', 'From vision to atmosphere.', 'Behind the frame', 'Light. Material. Place.', [3, 1], [7,2,13].map(image), {
        fx: 'push', interval: 5700, accent: 'gold',
        desc: 'An animated image sequence from the studio library. This tile can also hold a short studio film or project video when your footage is ready.',
        specs: [['Today', 'Animated image sequence'], ['Future content', 'Studio films & project snippets']]
      }),
      card('meeting-team', 'The people behind the picture.', 'Our people', 'Explore a sample studio structure.', [2, 1], [], {
        tile: { style: 'gradient', color: '#185B98' }, icon: 'building', accent: 'ocean',
        desc: 'An illustrative office structure for the meeting preview. Replace these roles with your actual team as the showcase develops.',
        team: { name: 'Studio leadership', children: [
          { name: 'Creative direction', children: [{name: 'Architecture & design'}, {name: 'Visualization artists'}] },
          { name: 'Production', children: [{name: 'Motion & film'}, {name: 'Interactive experiences'}] },
          { name: 'Client partnerships', children: [{name: 'Project coordination'}] }
        ] }
      }),
      card('meeting-detail', 'A closer look', 'Architectural details', '', [2, 1], [14,15].map(image), {
        tile: { showTitle: false, showCategory: false, showDescription: false },
        fx: 'lift', interval: 6900, desc: 'Explore the details, proportions, and perspectives that shape an architectural story.'
      }),
      card('meeting-leaf', 'Room to grow', 'Studio mark', '', [1, 1], [], {
        tile: minimal('#007F6A', 'garden'), desc: 'Architecture and landscape, considered together.'
      }),
      card('meeting-plan', 'Drawn to possibility', 'Studio mark', '', [1, 1], [], {
        tile: minimal('#D15B2D', 'blueprint'), desc: 'Every experience starts with an idea. A drawing, a conversation, a new point of view.'
      }),
      card('meeting-community', 'Made for everyday life.', 'Shared spaces', '', [2, 1], [16,5,12].map(image), {
        interval: 6200, fx: 'wipe', desc: 'A collection of shared spaces and architectural views from our studio image library.'
      }),
      card('meeting-city', 'The bigger picture.', 'Urban perspectives', '', [3, 1], [17,6,1].map(image), {
        interval: 7400, desc: 'A change of scale: explore the relationship between buildings, streets, and the city around them.'
      }),
      card('meeting-blue', 'Studio blue', 'Studio palette', '', [1, 1], [], {
        tile: minimal('#2166C1'), desc: 'A clear blue accent from the showcase palette.'
      }),
      card('meeting-interior', 'Spaces within.', 'Interior studies', '', [2, 1], [18,7].map(image), {
        interval: 6700, fx: 'fade', desc: 'Explore architectural spaces through light, material, and atmosphere.'
      }),
      card('meeting-frames', 'Another point of view', 'From the archive', '', [2, 1], [8,9,13].map(image), {
        tile: { showTitle: false, showCategory: false, showDescription: false },
        interval: 5900, fx: 'push', desc: 'More perspectives from the studio archive. Select a thumbnail to explore each view.'
      })
    ]
  };
  showcase.personalProjects=window.VASTUCHITRA?.personalProjects || window.VASTUCHITRA_CLIENT;
  const artwork = { 'meeting-about':14, 'meeting-journal':13, 'meeting-team':11 };
  showcase.projects.forEach(project => {
    if (!project.slides.length){
      project.slides = artwork[project.id] ? [image(artwork[project.id])] : [{ src:'/public/logo-ui.png' }];
    }
  });
  function normalizeCollections(config){
    const settings = { ...config.settings };
    // Earlier versions used personal for the temple collection.
    if (settings.catalogModesVersion !== 1 && settings.presentationMode === 'personal') settings.presentationMode = 'heritage';
    settings.catalogModesVersion = 1;
    const personalProjects = Array.isArray(config.personalProjects) ? config.personalProjects : showcase.projects
      .filter(project => ['meeting-selected','meeting-residences','meeting-outdoors','meeting-process','meeting-detail','meeting-interior'].includes(project.id))
      .map(project => ({ ...JSON.parse(JSON.stringify(project)), id:project.id.replace('meeting-','personal-') }));
    let clientProjects = personalProjects;
    if ((settings.clientCatalogVersion !== 1 || !Array.isArray(config.personalProjects) || personalProjects.length>0 && personalProjects.every(project=>/^personal-(selected|residences|outdoors|process|detail|interior)$/.test(project.id))) && window.VASTUCHITRA_CLIENT){
      const oldSeeds = showcase.projects.filter(project => ['meeting-selected','meeting-residences','meeting-outdoors','meeting-process','meeting-detail','meeting-interior'].includes(project.id));
      const isStarter = project => oldSeeds.some(seed => project.id === seed.id.replace('meeting-','personal-') && project.title === seed.title && project.desc === seed.desc);
      // Replace the previous sample portfolio, retaining any custom client cards.
      clientProjects = [...JSON.parse(JSON.stringify(window.VASTUCHITRA_CLIENT)).filter(seed=>!personalProjects.some(project=>project.id===seed.id)), ...personalProjects.filter(project => !isStarter(project))];
      settings.clientCatalogVersion = 1;
    }
    if (settings.clientDesignVersion !== 2 && window.VASTUCHITRA_CLIENT){
      const oldTitles = {ar:'Bring it into your space.',vr:'A different point of view.','360':'Look all around.',projection:'Architecture, illuminated.',brochures:'Take a closer look.',people:'The people behind it.',tools:'Made with.',partners:'In good company.',site:'From the site.',renders:'The architecture',walkthrough:'Step inside.',balcony:'Your everyday horizon.',rera:'The details, on record.'};
      clientProjects = clientProjects.map(project => {
        const seed = window.VASTUCHITRA_CLIENT.find(seed => seed.id === project.id);
        if (!seed) return project;
        const key = project.id.replace('sadhna-','');
        const defaultSize = JSON.stringify(project.size) === JSON.stringify(seed.previousSize);
        return {...project,
          ...(defaultSize ? {size:seed.size,canvasPosition:seed.canvasPosition} : {}),
          ...(project.title === oldTitles[key] ? {title:seed.title} : {})};
      });
      settings.clientDesignVersion = 2;
    }
    if(settings.clientExperienceVersion!==1 && window.VASTUCHITRA_CLIENT){
      const oldNames={ar:['Augmented reality','Bring it into your space.'],vr:['Virtual reality','A different point of view.'],'360':['Interactive 360°','Look all around.'],projection:['Projection mapping','Architecture, illuminated.'],brochures:['Brochures & plans','Take a closer look.'],people:['Project team','The people behind it.'],tools:['Software','Made with.'],partners:['Brand partners','In good company.'],site:['Site camera','From the site.'],renders:['The render collection','The architecture'],walkthrough:['Walkthrough film','Step inside.'],balcony:['Balcony views','Your everyday horizon.'],rera:['RERA & project facts','The details, on record.']};
      clientProjects=clientProjects.map(project=>{
        const key=project.id.replace('sadhna-','');
        if(!oldNames[key]?.includes(project.title))return project;
        return {...project,title:window.VASTUCHITRA_CLIENT_NAMES[key],sub:window.VASTUCHITRA_CLIENT_LABELS[key]};
      });
      const ids=new Set(clientProjects.map(project=>project.id));
      if(clientProjects.length) clientProjects.push(...window.VASTUCHITRA_CLIENT.filter(project=>['green','balcony-simulator','design-intent','mep'].includes(project.clientKind) && !ids.has(project.id)).map(project=>JSON.parse(JSON.stringify(project))));
      settings.clientExperienceVersion=1;
    }
    if(settings.clientPlainNamesVersion!==1){
      const plainNames={"In Focus":"Detailed renders","In Motion":"Walkthrough video","Place It Here":"Augmented reality","Step Beyond":"Virtual reality","The Outlook":"Balcony views","Every Angle":"Interactive 360°","Afterglow":"Projection mapping","The Project Edit":"Brochures & plans","Ground Report":"Live site camera","The Makers":"Project team","The Toolkit":"Software used","In Company":"Brand partners","On Record":"RERA & project facts","A Lighter Footprint":"Green building status","Beyond the Balcony":"Balcony simulator","The Thinking Behind":"Design intent","Behind the Walls":"MEP & coordination"};
      clientProjects=clientProjects.map(project=>plainNames[project.title] && project.id.startsWith('sadhna-') ? {...project,title:plainNames[project.title]} : project);
      settings.clientPlainNamesVersion=1;
    }
    if(settings.clientCanvasDefaultsVersion!==1){
      settings.presentationOptions={...settings.presentationOptions,personal:{...settings.presentationOptions?.personal,canvasLoop:false,canvasAutoScroll:false}};
      if(!settings.clientLightBackground || settings.clientLightBackground==='#cbd5cf')settings.clientLightBackground='#dce5ee';
      if(!settings.clientDarkBackground || settings.clientDarkBackground==='#111816')settings.clientDarkBackground='#0c1423';
      settings.clientCanvasDefaultsVersion=1;
    }
    if(settings.clientMosaicVersion!==1 && window.VASTUCHITRA_CLIENT_COMPOSITION){
      const previousSizes={overview:[3,3],renders:[5,3],clay:[1,1],rera:[2,1],walkthrough:[3,2],ar:[2,1],vr:[2,1],sage:[1,1],'360':[2,1],balcony:[4,2],projection:[2,1],brochures:[2,1],people:[2,1],tools:[1,1],partners:[1,1],site:[5,1],plum:[1,1],ochre:[2,1],green:[2,2],'balcony-simulator':[2,2],'design-intent':[2,2],mep:[2,2]};
      clientProjects=clientProjects.map(project=>{const key=project.id.replace('sadhna-',''),slot=window.VASTUCHITRA_CLIENT_COMPOSITION[key];return slot && JSON.stringify(project.size)===JSON.stringify(previousSizes[key]) ? {...project,size:slot.size,canvasPosition:{col:slot.col,row:slot.row}} : project;});
      clientProjects.sort((a,b)=>(a.canvasPosition?.row||0)-(b.canvasPosition?.row||0)||(a.canvasPosition?.col||0)-(b.canvasPosition?.col||0));
      settings.clientMosaicVersion=1;
    }
    if(settings.clientIconTilesVersion!==1 && window.VASTUCHITRA_CLIENT_ICON_TILES){
      clientProjects=window.VASTUCHITRA_CLIENT_ICON_TILES(clientProjects);
      settings.clientIconTilesVersion=1;
    }
    if(settings.clientSuppliedArtVersion!==1 && window.VASTUCHITRA_CLIENT_SUPPLIED_ART){
      clientProjects=window.VASTUCHITRA_CLIENT_SUPPLIED_ART(clientProjects);
      settings.clientSuppliedArtVersion=1;
    }
    if(settings.clientWalkthroughVersion!==2){
      clientProjects=clientProjects.map(project=>project.id==='sadhna-walkthrough' ? {...project,slides:[{src:'/public/shreesadhna/Walkthrough.mp4'}],poster:'/public/shreesadhna/walkthrough-poster.webp',sub:'Shree Sadhna walkthrough film',desc:'Watch the Shree Sadhna architectural walkthrough.',tile:{...project.tile,style:'image'},action:{type:'detail'}} : project);
      settings.clientWalkthroughVersion=2;
    }
    if(settings.clientReraDocumentVersion!==1){
      clientProjects=clientProjects.map(project=>project.id==='sadhna-rera' ? {...project,reraNumber:'FFDFH541316556854H',slides:[{src:'/public/shreesadhna/rera-document.webp'}],action:{type:'detail'}} : project);
      settings.clientReraDocumentVersion=1;
    }
    if(settings.clientOverviewImageVersion!==1){
      clientProjects=clientProjects.map(project=>project.id==='sadhna-overview' ? {...project,slides:[{src:'/public/shreesadhna/8.webp',pos:'50% 50%'}]} : project);
      settings.clientOverviewImageVersion=1;
    }
    if(settings.clientVrImageVersion!==1){
      clientProjects=clientProjects.map(project=>project.id==='sadhna-vr' ? {...project,tile:{...project.tile,style:'logo',logoIcon:null,logoSrc:'/public/shreesadhna/vr-headset.webp?v=2'}} : project);
      settings.clientVrImageVersion=1;
    }
    if(settings.clientWhiteIconsVersion!==1 && window.VASTUCHITRA_CLIENT_WHITE_ICONS){
      clientProjects=window.VASTUCHITRA_CLIENT_WHITE_ICONS(clientProjects);settings.clientWhiteIconsVersion=1;
    }
    if(settings.clientIpdsTileVersion!==1 && window.VASTUCHITRA_CLIENT){
      const tile=window.VASTUCHITRA_CLIENT.find(project=>project.id==='sadhna-ipds');
      if(tile&&clientProjects.some(project=>project.id.startsWith('sadhna-'))&&!clientProjects.some(project=>project.id===tile.id))clientProjects.push(JSON.parse(JSON.stringify(tile)));
      clientProjects=clientProjects.map(project=>project.id==='sadhna-mep'&&JSON.stringify(project.size)==='[3,1]'&&project.canvasPosition?.row===8&&project.canvasPosition?.col===5 ? {...project,size:[2,1],canvasPosition:{col:6,row:8}} : project);
      settings.clientIpdsTileVersion=1;
    }
    return { ...config, settings, personalProjects:window.VASTUCHITRA_CLIENT_ASSETS ? window.VASTUCHITRA_CLIENT_ASSETS(clientProjects) : clientProjects };
  }
  window.VASTUCHITRA_COMMERCIAL = (config, offline = false) => {
    config = normalizeCollections(config);
    if (config.settings?.commercialCatalogVersion === 1) return config;
    const primary = config.projects || [];
    const startsWithShowcase = primary.some(project => showcase.projects.some(tile => tile.id === project.id));
    const combined = offline && !startsWithShowcase ? [...showcase.projects, ...primary] : primary.map(project => {
      const bundled = showcase.projects.find(tile => tile.id === project.id);
      return bundled && !project.slides?.length ? { ...project, slides:bundled.slides } : project;
    });
    if (!offline){
      const ids = new Set(combined.map(project => project.id));
      combined.push(...(window.VASTUCHITRA_PORTABLE_PROJECTS || []).filter(project => !ids.has(project.id)));
    }
    return { ...config, settings:{ ...config.settings, commercialCatalogVersion:1 }, projects:combined };
  };
  if (!staticMode){
    if (window.VASTUCHITRA) window.VASTUCHITRA = window.VASTUCHITRA_COMMERCIAL(window.VASTUCHITRA, true);
    return;
  }
  window.VASTUCHITRA = showcase;
  // Hosted administration saves a browser-local copy; the PC server keeps its
  // existing configuration API and saved catalogue.
  try {
    const saved = JSON.parse(localStorage.getItem('vastuchitra-showcase-config-v1'));
    if (saved && Array.isArray(saved.projects) && saved.settings){
      window.VASTUCHITRA = saved;
      Object.assign(saved.settings, { meetingPreview: true, showAdmin: true, showTools: false });
    }
  } catch {}
  window.VASTUCHITRA = window.VASTUCHITRA_COMMERCIAL(window.VASTUCHITRA);
  if (!/\/admin(?:\.html)?\/?$/.test(location.pathname || '')) document.title = 'VastuChitra — Studio Showcase';
  document.body.classList.add('meeting-preview');
})();
