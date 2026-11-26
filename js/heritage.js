(() => {
  const photo = (name, pos = '50% 50%') => ({ src: '/public/temple/' + encodeURIComponent(name + '.jpg'), pos });
  const story = (id, title, location, type, size, photos, desc, detail, source) => ({
    id: 'heritage-' + id, title, cat: location + ' · ' + type, sub: detail,
    size, slides: photos, desc, specs: [['Location', location], ['Collection', type], ['Look for', detail]],
    source, icon: type === 'Temple' ? 'museum' : 'landscape', accent: 'gold',
    fx: 'kenburns', interval: 6900, action: { type: 'detail' }
  });
  window.VASTUCHITRA_HERITAGE = [
    story('thanjavur', 'Brihadisvara Temple', 'Thanjavur, Tamil Nadu', 'Temple', [4,2],
      [photo('Brihadishwara Temple, Tanjavur, TN', '50% 42%')],
      'Rajaraja I commissioned this Shiva temple in the early eleventh century. It is part of UNESCO’s Great Living Chola Temples. The complex gives a sense of the scale and ambition of Chola architecture, while worship continues there today.',
      'The tall vimana rising over the sanctum', 'https://whc.unesco.org/en/list/250/'),
    story('ayodhya', 'Shri Ram Mandir', 'Ayodhya, Uttar Pradesh', 'Temple', [2,2],
      [photo('Ayodhya Ram Mandir picture'), photo('अयोध्या राम मंदिर')],
      'The temple is dedicated to Rama. In the Ramayana tradition, Ayodhya is his birthplace. A broad staircase leads to the entrance, beneath a series of carved towers.',
      'Carved pillars and the rising temple towers', 'https://ayodhya.nic.in/ayodhya-tourism/'),
    story('vrindavan', 'Prem Mandir', 'Vrindavan, Uttar Pradesh', 'Temple', [3,1],
      [photo('Prem mandir Vrindavan'), photo('प्रेम मंदिर वृंदावन तस्वीरें')],
      'Prem Mandir honours Radha and Krishna as well as Rama and Sita. Its white marble and sculpted scenes give visitors a way to encounter stories from Krishna’s life through architecture.',
      'Narrative carvings in white marble', 'https://www.prod.incredibleindia.gov.in/content/incredible-india-v2/en/destinations/mathura-vrindavan/prem-mandir.html'),
    story('murudeshwara', 'Murudeshwara Temple', 'Uttara Kannada, Karnataka', 'Temple', [3,1],
      [photo('Majestic Murudeshwar', '50% 38%')],
      'On Kanduka Hill beside the Arabian Sea, the temple complex brings together a Shiva shrine, a tall entrance tower and a monumental Shiva statue. Local tradition connects the site with the story of the Atma Linga.',
      'The Shiva statue and Raja Gopuram against the sea', 'https://karnatakatourism.org/en/destinations/murudeshwara/'),
    story('dhanushkodi', 'Dhanushkodi', 'Rameswaram, Tamil Nadu', 'Coastal heritage', [2,1],
      [photo('The Last Road of India - Dhanushkodi, Tamilnadu, INDIA')],
      'At the far end of the Rameswaram peninsula, Dhanushkodi is part of a coastal landscape associated with the Ramayana. The landscape itself is the focus here: a narrow stretch of land framed by water.',
      'The meeting of road, shore and open water', 'https://www.incredibleindia.gov.in/en/tamil-nadu/rameswaram/rameswaram-tracing-the-footsteps-of-lord-ram'),
    story('thiruvalluvar', 'Thiruvalluvar Statue', 'Kanniyakumari, Tamil Nadu', 'Literary heritage', [2,1],
      [photo('Kanyakumari Thiruvalluvar', '50% 0%')],
      'This offshore stone sculpture honours Thiruvalluvar, the Tamil poet and thinker associated with the Tirukkural. Its 133-foot height recalls the 133 chapters of the work.',
      'The figure and pedestal rising from the offshore rock', 'https://kanniyakumari.nic.in/tspot_ts/'),
    story('unity', 'Statue of Unity', 'Ekta Nagar, Gujarat', 'Modern monument', [2,1],
      [photo('Statue of Unity Aerial Drone View _ 8K Cinematic Night Glow')],
      'This 182-metre monument in the Narmada River landscape commemorates Sardar Vallabhbhai Patel. The aerial view shows how the statue sits within the river valley.',
      'The scale of the figure against the Narmada valley', 'https://narmada.nic.in/tourist-place/statue-of-unity-kevadia/')
  ];
})();
