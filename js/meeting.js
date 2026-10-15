// Meeting mode is a separate presentation; the saved studio catalogue stays intact.
(() => {
  // Static hosting also serves index.html directly. A rewrite for / cannot
  // reliably override that file, so select the bundled showcase on remote hosts.
  const hosted = /^https?:$/.test(location.protocol) && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (!hosted && !new URLSearchParams(location.search).has('demo') && document.documentElement.dataset.meeting !== 'true') return;
  const image = n => ({ src: `public/demo/project-${n}.webp`, pos: '50% 50%' });
  const card = (id, title, cat, sub, size, slides, extra = {}) => ({
    id, title, cat, sub, size, slides, icon: 'frames', accent: 'cyan',
    fx: 'push', interval: 4600, action: { type: 'detail' }, ...extra
  });
  const minimal = (color, logoIcon) => ({
    style: logoIcon ? 'logo' : 'gradient', color, logoIcon,
    showTitle: false, showCategory: false, showDescription: false, frame: false
  });
  window.VASTUCHITRA = {
    settings: {
      ...window.VASTUCHITRA?.settings, columns: 8, rows: 5, showAdmin: false,
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
  document.title = 'VastuChitra — Studio Showcase';
  document.body.classList.add('meeting-preview');
  const note = document.createElement('span');
  note.className = 'meeting-note';
  note.textContent = 'STUDIO SHOWCASE · MEETING PREVIEW';
  document.querySelector('.brand').appendChild(note);
})();
