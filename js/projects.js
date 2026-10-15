// ================================================================
// Vastuchitra — content & behaviour.
// Generated via Vastuchitra Admin Panel
// ================================================================
window.VASTUCHITRA = {

  settings: {
    "columns": 6,
    "rows": 4,
    "idleSeconds": 120,
    "kiosk": false,
    "cardGap": 16,
    "cardRadius": 22,
    "showClock": true,
    "showAdmin": true,
    "cardRowHeight": 130,
    "pagePadding": 32,
    "titleScale": 100,
    "showBrandSubtitle": true,
    "showDescriptions": true,
    "showCategories": true,
    "showGridDots": true,
    "clock24Hour": false,
    "showClockIcon": true,
    "showSlidePager": true,
    "motion": true,
    "cardTilt": false,
    "autoplaySlides": true,
    "kioskHoldSeconds": 2,
    "toolRevealSeconds": 15,
    "showProjectCount": false,
    "hideIdleCursor": true,
    "resetSlidesOnIdle": true,
    "disableSelection": true,
    "headerGap": 20,
    "cardContentPadding": 20,
    "introAnimation": true,
    "tiltStrength": 7,
    "hoverZoom": 107,
    "transitionSpeed": 100
},

  projects: [
    {
        "id": "meridian",
        "title": "Meridian Coastal Villa",
        "cat": "Newsletter",
        "sub": "Oceanfront luxury residence, real-time lighting & material swaps",
        "icon": "frames",
        "accent": "cyan",
        "size": [
            3,
            2
        ],
        "tile": {
            "style": "gradient",
            "gradient": "sand",
            "frame": true,
            "showTitle": true,
            "showCategory": true,
            "showDescription": true,
            "logoSrc": "/media/VastuChitra%20copy%20w.png"
        },
        "slides": [
            {
                "src": "/api/media-preview?path=0033%20-%20Uptown%20Avenue%20-%2005%20-%20230926.tif&mode=thumb",
                "pos": "50% 50%"
            },
            {
                "src": "/api/media-preview?path=0033%20-%20Uptown%20Avenue%20-%2001%20-%20230926.tif&mode=thumb",
                "pos": "50% 50%"
            }
        ],
        "fx": "push",
        "interval": 5000,
        "desc": "Experience this modern coastal villa in photorealistic real time. Seamlessly switch between daylight and golden hour, swap stone and hardwood materials, and explore outdoor terraces overlooking the ocean.",
        "specs": [
            [
                "Engine",
                "Unreal Engine 5.4"
            ],
            [
                "Resolution",
                "4K HDR UHD"
            ],
            [
                "Target Screen",
                "Main Display Wall"
            ],
            [
                "Controls",
                "Full Touch Orbit & Walk"
            ]
        ],
        "action": {
            "type": "exe"
        }
    },
    {
        "id": "pavilion-expo",
        "title": "The Kinetic Timber Pavilion",
        "cat": "Parametric Architecture",
        "sub": "Organic wooden ribbon roof and natural daylighting analysis",
        "icon": "frames",
        "accent": "rose",
        "size": [
            2,
            2
        ],
        "slides": [
            {
                "src": "/api/media-preview?path=2613%20-%20Kohinoor%20Central%20Park%20-%20Hires%20_09.tif&mode=thumb",
                "pos": "50% 42%"
            },
            {
                "src": "/api/media-preview?path=Kids%20Play%20copy.tif&mode=thumb",
                "pos": "50% 40%"
            }
        ],
        "fx": "push",
        "interval": 5200,
        "dir": 1,
        "desc": "An architectural marvel combining glulam timber arches with organic skylights. Inspect structural load paths, acoustic reflections, and seasonal solar ingress simulations.",
        "specs": [
            [
                "Material",
                "Cross-Laminated Timber"
            ],
            [
                "Span",
                "68 Meters Free Span"
            ],
            [
                "Design Style",
                "Biophilic Parametric"
            ]
        ],
        "action": {
            "type": "detail"
        }
    },
    {
        "id": "skyline-penthouse",
        "title": "Aura Horizon Penthouse",
        "cat": "Interactive UE5 · Realtime",
        "sub": "Panoramic high-rise living with live day-night cycle",
        "icon": "projector",
        "accent": "amber",
        "size": [
            3,
            2
        ],
        "slides": [
            {
                "src": "/media/2309%20-%20Persistent%20Option%2002%20(13).jpg",
                "pos": "50% 50%"
            },
            {
                "src": "/media/2309%20-%20Persistent%20Option%2001%20(4).jpg",
                "pos": "50% 50%"
            }
        ],
        "fx": "fade",
        "interval": 6000,
        "dir": 1,
        "desc": "Curved panoramic glazing frames a breathing metropolis. Features full interior lighting controls, interactive automated shading systems, and luxury bespoke furniture configurations.",
        "specs": [
            [
                "Engine",
                "Unreal Engine 5 Lumen"
            ],
            [
                "Floor Level",
                "Level 64 Penthouse"
            ],
            [
                "Features",
                "Custom Lighting States"
            ],
            [
                "Output",
                "Direct GPU Display"
            ]
        ],
        "action": {
            "type": "detail-launch",
            "app": "skyline-lobby"
        }
    },
    {
        "id": "gallery-360",
        "title": "Contemporary Gallery Space 360",
        "cat": "360° Panorama Tour",
        "sub": "Exhibition hall with interactive spatial hotspot navigation",
        "icon": "orbit",
        "accent": "violet",
        "size": [
            2,
            1
        ],
        "slides": [
            {
                "src": "/api/media-preview?path=0110%20-%20Kohinoor-Archana%20-%2003.tif&mode=thumb",
                "pos": "50% 42%"
            },
            {
                "src": "/api/media-preview?path=Senior%20Ci%20copy.tif&mode=thumb",
                "pos": "50% 50%"
            }
        ],
        "fx": "wipe",
        "interval": 5500,
        "dir": 1,
        "desc": "Tour the contemporary art and architecture pavilion in full 360° panorama. Seamlessly jump between high-ceiling gallerias, outdoor sculpture gardens, and private lounges.",
        "specs": [
            [
                "Tour Format",
                "8K Equirectangular"
            ],
            [
                "Navigation",
                "Touch Hotspots"
            ],
            [
                "Host",
                "Embedded Web Tour"
            ]
        ],
        "action": {
            "type": "url",
            "url": "https://example.com/"
        }
    },
    {
        "id": "skyline-lobby",
        "title": "Atrium Grand Lobby & Plaza",
        "cat": "Archviz Interactive · UE5",
        "sub": "Double-height civic headquarters with indoor botanical biomes",
        "icon": "cube",
        "accent": "violet",
        "size": [
            2,
            1
        ],
        "slides": [
            {
                "src": "/api/media-preview?path=2644%20-%20Kohinoor%20Mhalunge%20Exterior%20Renders%20-%20190724%20-%2005.tif&mode=thumb",
                "pos": "50% 50%"
            },
            {
                "src": "/api/media-preview?path=2613%20-%20Kohinoor%20Central%20Park%20-%20Hires%20_04.tif&mode=thumb",
                "pos": "50% 40%"
            }
        ],
        "fx": "fade",
        "interval": 4800,
        "dir": 1,
        "desc": "Explore a striking corporate headquarters featuring sculpted wood parametric canopies, marble finishes, and integrated indoor vegetation biomes.",
        "specs": [
            [
                "Simulation",
                "Real-Time Pedestrian Flow"
            ],
            [
                "Acoustics",
                "Spatial Sound Simulation"
            ],
            [
                "Engine",
                "Unreal Engine 5"
            ]
        ],
        "action": {
            "type": "exe",
            "app": "skyline-lobby"
        }
    },
    {
        "id": "ar-furniture",
        "title": "Spatial Living & AR Studio",
        "cat": "AR Experience",
        "sub": "True-to-scale furniture placement and finishes preview",
        "icon": "ar",
        "accent": "amber",
        "size": [
            1,
            2
        ],
        "slides": [
            {
                "src": "/api/media-preview?path=0033%20-%20Uptown%20Avenue%20-%2003%20-%20230926.tif&mode=thumb",
                "pos": "50% 50%"
            },
            {
                "src": "/api/media-preview?path=0252%20-%20Royal%20Realty%20-%20Rahatani%20-%20Hires%203d%20Renders%2002.tif&mode=thumb",
                "pos": "50% 50%"
            }
        ],
        "fx": "lift",
        "interval": 4000,
        "desc": "Preview designer chairs, lighting fixtures, and custom cabinetry at 1:1 true physical scale directly overlaid within room environments.",
        "specs": [
            [
                "Technology",
                "WebXR / Spatial Tracking"
            ],
            [
                "Scale",
                "1:1 Physical Metric"
            ],
            [
                "Catalog",
                "50+ Designer Items"
            ]
        ],
        "action": {
            "type": "detail"
        }
    },
    {
        "id": "facade-show",
        "title": "Facade Dynamic Light Show",
        "cat": "Architectural Lighting",
        "sub": "DMX kinetic lighting sequences on tower exterior",
        "icon": "reel",
        "accent": "cyan",
        "size": [
            2,
            1
        ],
        "slides": [
            {
                "src": "/api/media-preview?path=0033%20-%20Uptown%20Avenue%20-%2002%20-%20230926.tif&mode=thumb",
                "pos": "50% 42%"
            },
            {
                "src": "/api/media-preview?path=0110%20-%20Kohinoor-Archana%20-%2005.tif&mode=thumb",
                "pos": "50% 50%"
            }
        ],
        "fx": "push",
        "interval": 5000,
        "desc": "Program and trigger exterior architectural facade light shows with synchronized ambient soundtracks.",
        "specs": [
            [
                "Protocol",
                "Art-Net / DMX 512"
            ],
            [
                "Fixtures",
                "24,000 Addressable LEDs"
            ],
            [
                "Presets",
                "8 Curated Sequences"
            ]
        ],
        "action": {
            "type": "exe",
            "app": "facade-show"
        }
    },
    {
        "id": "vr-walkthrough",
        "title": "VR Masterplan & District Tour",
        "cat": "VR Spatial Walkthrough",
        "sub": "Full-scale walkable urban district with mixed-use zoning",
        "icon": "vr",
        "accent": "cyan",
        "size": [
            2,
            1
        ],
        "slides": [
            {
                "src": "/media/2309%20-%20Persistent%20Option%2001%20(13).jpg",
                "pos": "50% 50%"
            },
            {
                "src": "/media/2761%20-%20Cotton%20Market%20-%2015.jpg",
                "pos": "50% 50%"
            }
        ],
        "fx": "fade",
        "interval": 5000,
        "desc": "Immerse clients into an expansive sustainable smart district. Review green transit corridors, commercial plazas, and residential clusters.",
        "specs": [
            [
                "Area",
                "42 Hectares"
            ],
            [
                "Immersion",
                "Free Walk / Teleport"
            ],
            [
                "Displays",
                "VR Headset & Main Mirror"
            ]
        ],
        "action": {
            "type": "exe"
        }
    },
    {
        "id": "nordic-retreat",
        "title": "Nordic Forest Sanctuary",
        "cat": "Archviz Interactive · UE5",
        "sub": "Timber lakehouse nestled into pine forest terrain",
        "icon": "cube",
        "accent": "cyan",
        "size": [
            3,
            1
        ],
        "slides": [
            {
                "src": "/api/media-preview?path=0252%20-%20Royal%20Realty%20-%20Rahatani%20-%20Hires%203d%20Renders%2007.tif&mode=thumb",
                "pos": "50% 50%"
            },
            {
                "src": "/media/2761%20-%20Cotton%20Market%20-%2002.jpg",
                "pos": "50% 40%"
            }
        ],
        "fx": "wipe",
        "interval": 5000,
        "desc": "Minimalist Scandinavian architecture harmonizing blackened timber, raw granite stone, and geothermal heating systems.",
        "specs": [
            [
                "Location",
                "Lofoten, Norway"
            ],
            [
                "Biome",
                "Boreal Forest & Lake"
            ],
            [
                "Lighting",
                "Lumen Atmospheric Fog"
            ]
        ],
        "action": {
            "type": "detail"
        }
    },
    {
        "id": "concept-art-reel",
        "title": "Kinetic CGI & Cinematics Reel",
        "cat": "Cinematics & Media",
        "sub": "Ultra-high resolution architectural visual concepts",
        "icon": "reel",
        "accent": "rose",
        "size": [
            2,
            1
        ],
        "slides": [
            {
                "src": "/media/2799_mahila%20ani%20bal%20vikas%20-%2001%20(7).jpg",
                "pos": "50% 42%"
            },
            {
                "src": "/media/1625%20-%20Seed%20Tree%20Ananta%20One%20(6).jpg",
                "pos": "50% 50%"
            }
        ],
        "fx": "push",
        "interval": 4500,
        "desc": "A showreel of high-fidelity architectural visualizations, lighting moods, and structural concept art renders.",
        "specs": [
            [
                "Resolution",
                "8K DCI Cinemascope"
            ],
            [
                "Color Space",
                "ACEScg High Dynamic"
            ],
            [
                "Render Pipeline",
                "Unreal Engine 5 MRQ"
            ]
        ],
        "action": {
            "type": "detail"
        }
    },
    {
        "id": "room-mapping",
        "title": "Immersive Room Projection",
        "cat": "Interactive UE5 · Realtime",
        "sub": "Cave-style spatial surround projection mapping",
        "icon": "projector",
        "accent": "amber",
        "size": [
            2,
            1
        ],
        "slides": [
            {
                "src": "/api/media-preview?path=Library%20copy.tif&mode=thumb",
                "pos": "50% 50%"
            },
            {
                "src": "/api/media-preview?path=Multipurpose%20Hall%20%20cam2%20copy.tif&mode=thumb",
                "pos": "50% 50%"
            }
        ],
        "fx": "lift",
        "interval": 5000,
        "desc": "Synchronized multi-projector output designed for CAVE environments and curved wrap-around display showrooms.",
        "specs": [
            [
                "Projectors",
                "4 Edge-Blended 4K Units"
            ],
            [
                "Field of View",
                "270° Panoramic Wrap"
            ],
            [
                "Calibration",
                "Auto Camera Warp & Blend"
            ]
        ],
        "action": {
            "type": "exe",
            "app": "room-mapping"
        }
    },
    {
        "id": "botanical-biomes",
        "title": "Botanical Conservatory 360",
        "cat": "360° Panorama Tour",
        "sub": "Tropical greenhouse with multi-level canopy walkway",
        "icon": "orbit",
        "accent": "violet",
        "size": [
            2,
            1
        ],
        "slides": [
            {
                "src": "/media/1625%20-%20Seed%20Tree%20Ananta%20One%20(1).jpg",
                "pos": "50% 50%"
            },
            {
                "src": "/api/media-preview?path=0033%20-%20Uptown%20Avenue%20-%2004%20-%20230926.tif&mode=thumb",
                "pos": "50% 50%"
            }
        ],
        "fx": "fade",
        "interval": 5200,
        "desc": "Step inside a climate-controlled botanical dome featuring exotic flora, elevated tree canopy suspension bridges, and misting systems.",
        "specs": [
            [
                "Environment",
                "Cloud Forest Biome"
            ],
            [
                "Coverage",
                "32 Spherical Panoramas"
            ],
            [
                "Platform",
                "Interactive Web Tour"
            ]
        ],
        "action": {
            "type": "url",
            "url": "https://example.com/botanical"
        }
    },
    {
        "id": "atmosphere-study",
        "title": "Solar & Microclimate Studies",
        "cat": "Simulation & Studies",
        "sub": "Annual daylight exposure and thermodynamic airflow analysis",
        "icon": "frames",
        "accent": "violet",
        "size": [
            1,
            2
        ],
        "slides": [
            {
                "src": "/media/2467%20-%20Boat%20Club%20Road%20-%2003.jpg",
                "pos": "50% 42%"
            },
            {
                "src": "/api/media-preview?path=0033%20-%20Uptown%20Avenue%20-%2006%20-%20230926.tif&mode=thumb",
                "pos": "50% 40%"
            }
        ],
        "fx": "lift",
        "interval": 4200,
        "desc": "Calculates seasonal heat gain, glare metrics, and natural cross-ventilation patterns for sustainable building certification.",
        "specs": [
            [
                "Analysis Type",
                "Solar Insolation & CFD"
            ],
            [
                "Standards",
                "LEED Platinum / WELL"
            ],
            [
                "Visualization",
                "Heatmap & Particle Flow"
            ]
        ],
        "action": {
            "type": "detail"
        }
    },
    {
        "id": "heritage-3d",
        "title": "Heritage Restoration 3D",
        "cat": "Cinematics & Media",
        "sub": "Photogrammetry digital twin of historical facade",
        "icon": "frames",
        "accent": "rose",
        "size": [
            2,
            1
        ],
        "slides": [
            {
                "src": "/api/media-preview?path=1525%20-%20Kwality%20World%20Developers%20Hires%203d%20-%2001.tif&mode=thumb",
                "pos": "50% 50%"
            },
            {
                "src": "/api/media-preview?path=1525%20-%20Kwality%20World%20Developers%20Hires%203d%20-%2003.tif&mode=thumb",
                "pos": "50% 50%"
            }
        ],
        "fx": "fade",
        "interval": 4800,
        "desc": "Sub-millimeter LiDAR scan and photogrammetric recreation of historic architectural stone reliefs and vaulted arches.",
        "specs": [
            [
                "Accuracy",
                "0.5mm Point Cloud"
            ],
            [
                "Polygon Count",
                "48 Million Triangles (Nanite)"
            ],
            [
                "Archival Grade",
                "UNESCO Conservation Standard"
            ]
        ],
        "action": {
            "type": "detail"
        }
    },
    {
        "id": "riverstone-retreat",
        "title": "Riverstone Wellness Retreat",
        "cat": "Immersive Hospitality",
        "sub": "Biophilic resort interiors with day-to-night ambience",
        "icon": "cube",
        "accent": "violet",
        "size": [
            2,
            2
        ],
        "slides": [
            {
                "src": "/api/media-preview?path=2644%20-%20Kohinoor%20Mhalunge%20Exterior%20Renders%20-%20190724%20-%2002.tif&mode=thumb",
                "pos": "50% 50%"
            },
            {
                "src": "/api/media-preview?path=0033%20-%20Uptown%20Avenue%20-%2007%20-%20230926.tif&mode=thumb",
                "pos": "50% 50%"
            }
        ],
        "fx": "kenburns",
        "interval": 5400,
        "dir": 1,
        "desc": "Explore a calm riverside retreat shaped by natural stone, filtered daylight, and restorative landscape views across guest suites and wellness spaces.",
        "specs": [
            [
                "Experience",
                "Interactive Hospitality Walkthrough"
            ],
            [
                "Lighting",
                "Dynamic Day and Evening"
            ],
            [
                "Focus",
                "Wellness and Biophilic Design"
            ]
        ],
        "action": {
            "type": "detail"
        }
    },
    {
        "id": "urban-nexus",
        "title": "Urban Nexus Experience Center",
        "cat": "Interactive Masterplanning",
        "sub": "A connected mixed-use district presented at city scale",
        "icon": "orbit",
        "accent": "amber",
        "size": [
            2,
            1
        ],
        "slides": [
            {
                "src": "/api/media-preview?path=0033%20-%20Uptown%20Avenue%20-%2008%20-%20230926.tif&mode=thumb",
                "pos": "50% 42%"
            },
            {
                "src": "/api/media-preview?path=2613%20-%20Kohinoor%20Central%20Park%20-%20Hires%20_09.tif&mode=thumb",
                "pos": "50% 50%"
            }
        ],
        "fx": "push",
        "interval": 4900,
        "dir": 1,
        "desc": "Navigate a high-density urban district with residential, workplace, retail, transit, and public-realm layers presented as one interactive planning story.",
        "specs": [
            [
                "Scale",
                "District Digital Twin"
            ],
            [
                "Navigation",
                "Touch Hotspots and Layers"
            ],
            [
                "Content",
                "Planning and Mobility Data"
            ]
        ],
        "action": {
            "type": "detail"
        }
    }
]
};
