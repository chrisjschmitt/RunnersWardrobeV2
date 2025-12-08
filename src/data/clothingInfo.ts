// Beginner-friendly information about clothing items
// Used to help new users understand recommendations

export interface ClothingInfo {
  name: string;
  description: string;
  whyWear?: string;        // When/why to wear this
  lookFor?: string[];      // Features to look for when buying
  examples?: string[];     // Brand/product examples
  budgetTip?: string;      // Budget-friendly advice
  avoid?: string;          // What to avoid
}

// Info organized by clothing category and item name
export const CLOTHING_INFO: Record<string, Record<string, ClothingInfo>> = {
  // ============ HEAD WEAR ============
  headCover: {
    'Beanie': {
      name: 'Beanie',
      description: 'A warm knit cap that covers your ears. Essential for cold weather.',
      whyWear: 'You lose significant heat through your head. A beanie keeps you warm below 40°F (4°C).',
      lookFor: ['Moisture-wicking material', 'Covers ears fully', 'Not too tight'],
      examples: ['Any athletic beanie', 'Smartwool Merino', 'Buff Knitted'],
      budgetTip: 'Any acrylic or fleece beanie works fine ($10-20)',
    },
    'Headband': {
      name: 'Headband / Ear Warmer',
      description: 'Covers your ears while letting heat escape from the top of your head.',
      whyWear: 'Great for 35-45°F (2-7°C) when a full beanie would be too warm.',
      lookFor: ['Wide enough to cover ears', 'Stays in place', 'Moisture-wicking'],
      examples: ['Smartwool Headband', 'Nike Fleece Headband', 'Buff Headband'],
      budgetTip: 'Basic fleece headbands work great ($10-15)',
    },
    'Cap': {
      name: 'Cap / Baseball Hat',
      description: 'Keeps sun out of your eyes and light rain off your face.',
      whyWear: 'Useful in sunny or lightly rainy conditions. Doesn\'t provide much warmth.',
      lookFor: ['Moisture-wicking', 'Breathable mesh back', 'Adjustable fit'],
      examples: ['Any running cap', 'Headsweats', 'Nike AeroBill'],
      budgetTip: 'Any breathable athletic cap ($15-25)',
    },
    'Ear warmers': {
      name: 'Ear Warmers',
      description: 'Wrap around your head to cover just your ears.',
      whyWear: 'When it\'s cold but you don\'t want a full headband or beanie.',
      lookFor: ['Fleece-lined', 'Stays in place', 'Folds flat for pocket'],
      budgetTip: 'Simple fleece ear warmers ($10-15)',
    },
    'Balaclava': {
      name: 'Balaclava',
      description: 'Full face and neck coverage with opening for eyes/face.',
      whyWear: 'Extreme cold (below 15°F / -10°C) or high winds.',
      lookFor: ['Breathable mouth area', 'Moisture-wicking', 'Thin enough to fit under helmet'],
      examples: ['Smartwool Balaclava', 'Outdoor Research'],
      budgetTip: 'Thin fleece balaclava ($15-25)',
    },
    'Sun hat': {
      name: 'Sun Hat',
      description: 'Wide-brimmed hat for maximum sun protection.',
      whyWear: 'Hot sunny days, especially for hiking. Protects face and neck from UV.',
      lookFor: ['UPF 50+ rating', 'Breathable', 'Chin strap for wind'],
      examples: ['Sunday Afternoons', 'Columbia Bora Bora', 'Outdoor Research'],
      budgetTip: 'Any wide-brimmed hat with UPF rating ($20-30)',
    },
    'Visor': {
      name: 'Visor',
      description: 'Open-top headwear that shades eyes while allowing heat to escape.',
      whyWear: 'Hot weather running when you want sun protection but need ventilation.',
      lookFor: ['Moisture-wicking band', 'Adjustable fit', 'Lightweight'],
      examples: ['Headsweats', 'Nike AeroBill', 'Ciele'],
      budgetTip: 'Basic running visor ($15-25)',
    },
    'Buff': {
      name: 'Buff / Neck Gaiter',
      description: 'Versatile tube of fabric that can be worn as headband, neck gaiter, or face covering.',
      whyWear: 'Multi-purpose - sun protection, dust, cold. Very packable.',
      lookFor: ['Moisture-wicking', 'UPF rating for sun', 'Seamless construction'],
      examples: ['Buff Original', 'Smartwool Neck Gaiter'],
      budgetTip: 'Generic buffs work fine ($10-15)',
    },
    'Fleece headband': {
      name: 'Fleece Headband',
      description: 'Warm fleece band that covers ears.',
      whyWear: 'Cold weather when you need ear warmth but not a full beanie.',
      lookFor: ['Fleece-lined', 'Wide enough to cover ears', 'Stays in place'],
      budgetTip: 'Basic fleece headband ($10-15)',
    },
    'Insulated hat': {
      name: 'Insulated Hat',
      description: 'Heavily insulated winter hat for extreme cold.',
      whyWear: 'Very cold conditions below 10°F (-12°C).',
      lookFor: ['Wind-resistant outer', 'Fleece or down insulation', 'Ear coverage'],
    },
    'Light beanie': {
      name: 'Light Beanie',
      description: 'Thin beanie for active use in cold weather.',
      whyWear: 'Cold but active - provides warmth without overheating.',
      lookFor: ['Thin, moisture-wicking material', 'Snug fit'],
    },
  },

  // ============ TOPS ============
  tops: {
    'T-shirt': {
      name: 'T-Shirt',
      description: 'Basic short-sleeve top. Best for mild to warm weather.',
      whyWear: 'Comfortable for 55-75°F (13-24°C). The default choice for most conditions.',
      lookFor: ['Moisture-wicking synthetic or merino', 'NOT cotton', 'Flatlock seams'],
      examples: ['Any athletic tee', 'Nike Dri-FIT', 'Under Armour Tech'],
      budgetTip: 'Costco/Target athletic tees work great ($10-15)',
      avoid: 'Cotton - it absorbs sweat, gets heavy, and chafes',
    },
    'Long sleeve': {
      name: 'Long Sleeve',
      description: 'Provides arm coverage and light warmth.',
      whyWear: 'Good for 40-55°F (4-13°C), or as a base layer in colder weather.',
      lookFor: ['Moisture-wicking', 'Thumb holes (nice to have)', 'Quarter zip for ventilation'],
      examples: ['Nike Element', 'Under Armour', 'Patagonia Capilene'],
      budgetTip: 'Basic athletic long sleeve ($20-30)',
    },
    'Fleece': {
      name: 'Fleece',
      description: 'Warm, breathable mid-layer that insulates even when damp.',
      whyWear: 'Great for 25-40°F (-4 to 4°C). Wear over a base layer for cold days.',
      lookFor: ['Lightweight/midweight', 'Quarter or half zip', 'Thumb holes'],
      examples: ['Patagonia R1', 'Nike Therma', 'Under Armour Fleece'],
      budgetTip: 'Any athletic fleece ($25-50). Costco has great options.',
    },
    'Sweater': {
      name: 'Sweater',
      description: 'Casual warm layer for walking and everyday activities.',
      whyWear: 'Good for casual cold-weather walks when you\'re not working hard.',
      lookFor: ['Breathable knit', 'Not too heavy'],
      budgetTip: 'Any comfortable sweater you already own works fine',
    },
    'Singlet': {
      name: 'Singlet / Tank Top',
      description: 'Sleeveless top for maximum cooling.',
      whyWear: 'Hot weather above 75°F (24°C). Maximum ventilation.',
      lookFor: ['Moisture-wicking', 'Loose or fitted based on preference'],
      examples: ['Nike Miler', 'Under Armour', 'Tracksmith'],
      budgetTip: 'Basic athletic tank ($15-20)',
    },
    'Base layer + jacket': {
      name: 'Base Layer + Jacket',
      description: 'A thin wicking layer plus an outer jacket for cold conditions.',
      whyWear: 'Below 30°F (-1°C). The base layer wicks sweat, jacket blocks wind.',
      lookFor: ['Thin, tight-fitting base layer', 'Wind-resistant outer jacket'],
      examples: ['Merino base + wind jacket', 'Nike Pro + Shield jacket'],
    },
    'Light jacket': {
      name: 'Light Jacket',
      description: 'Thin outer layer for wind or light rain protection.',
      whyWear: 'Windy days or as an outer layer over a sweater.',
      lookFor: ['Windproof', 'Breathable', 'Packable'],
      examples: ['Nike Windrunner', 'Patagonia Houdini', 'Any windbreaker'],
      budgetTip: 'Basic windbreaker ($30-50)',
    },
    'Base layer': {
      name: 'Base Layer',
      description: 'Thin, tight-fitting layer worn next to skin to wick moisture.',
      whyWear: 'Cold weather as your first layer. Wicks sweat away from body.',
      lookFor: ['Moisture-wicking', 'Snug fit', 'Flatlock seams'],
      examples: ['Nike Pro', 'Under Armour ColdGear', 'Patagonia Capilene'],
    },
    'Merino base': {
      name: 'Merino Wool Base Layer',
      description: 'Natural wool base layer that regulates temperature and resists odor.',
      whyWear: 'Cold weather. Wool stays warm even when wet and doesn\'t smell.',
      lookFor: ['150-200 weight for activity', 'Flatlock seams', 'Blend with nylon for durability'],
      examples: ['Smartwool', 'Icebreaker', 'Ridge Merino'],
      budgetTip: 'Worth the investment - lasts years and stays fresh',
    },
    'Synthetic base': {
      name: 'Synthetic Base Layer',
      description: 'Polyester/nylon base layer that dries quickly.',
      whyWear: 'Cold weather. Dries faster than wool, more affordable.',
      lookFor: ['Moisture-wicking', 'Quick-dry', 'Snug fit'],
      examples: ['Patagonia Capilene', 'Under Armour', 'REI Co-op'],
      budgetTip: 'Good synthetic bases available for $25-40',
    },
    'Light synthetic': {
      name: 'Light Synthetic Base Layer',
      description: 'Thin, breathable synthetic base for high-output activities.',
      whyWear: 'Active winter sports like XC skiing or snowshoeing where you generate lots of heat.',
      lookFor: ['Very lightweight', 'Highly breathable', 'Quick-dry'],
      examples: ['Patagonia Capilene Cool', 'Craft Active Intensity', 'Smartwool 150'],
      budgetTip: 'Any thin polyester athletic shirt can work in a pinch',
    },
    'Heavy merino': {
      name: 'Heavy Merino Base Layer',
      description: 'Thick merino wool base for extreme cold.',
      whyWear: 'Very cold conditions (below 10°F / -12°C) or lower-intensity activities.',
      lookFor: ['250+ weight merino', 'Flatlock seams', 'Thumb loops'],
      examples: ['Smartwool 250', 'Icebreaker 260', 'Ridge Merino'],
    },
    'Expedition weight': {
      name: 'Expedition Weight Base Layer',
      description: 'The warmest base layer for extreme cold conditions.',
      whyWear: 'Extreme cold (below 0°F / -18°C) or when standing around in cold.',
      lookFor: ['300+ weight', 'Grid fleece interior', 'High collar'],
      examples: ['Patagonia R1', 'Smartwool 320', 'Arc\'teryx Rho AR'],
      avoid: 'Too warm for high-output activities - you\'ll overheat',
    },
    'Race suit base': {
      name: 'XC Race Suit Base Layer',
      description: 'Ultra-thin base designed to wear under race suits.',
      whyWear: 'XC ski racing. Minimal bulk, maximum moisture management.',
      lookFor: ['Very thin', 'Seamless construction', 'Body-mapped ventilation'],
      examples: ['Craft Pro Dry Nanoweight', 'Swix RaceX'],
    },
    'Wind jacket': {
      name: 'Wind Jacket',
      description: 'Ultralight jacket that blocks wind but isn\'t waterproof.',
      whyWear: 'Windy conditions or as emergency layer. Very packable.',
      lookFor: ['Packs into pocket', 'Under 4oz weight', 'Breathable'],
      examples: ['Patagonia Houdini', 'Black Diamond Alpine Start'],
    },
    'Vest + long sleeve': {
      name: 'Vest + Long Sleeve',
      description: 'Core warmth from vest with arm coverage from long sleeve.',
      whyWear: 'Variable conditions - easy to regulate temperature.',
      lookFor: ['Lightweight vest', 'Moisture-wicking long sleeve base'],
    },
  },

  // ============ CYCLING JERSEYS ============
  jersey: {
    'Short sleeve jersey': {
      name: 'Cycling Jersey',
      description: 'Fitted cycling top with rear pockets and full zipper.',
      whyWear: 'Standard cycling top. Rear pockets hold food, phone, etc.',
      lookFor: ['Full-length zipper', '3 rear pockets', 'Snug fit'],
      examples: ['Rapha Core', 'Castelli', 'Pearl Izumi'],
      budgetTip: 'Amazon/Decathlon have good budget jerseys ($30-50)',
    },
    'Sleeveless jersey': {
      name: 'Sleeveless Cycling Jersey',
      description: 'Cycling jersey without sleeves for hot weather.',
      whyWear: 'Very hot conditions. Maximum arm ventilation.',
      lookFor: ['Full zipper', 'Rear pockets', 'Breathable mesh'],
    },
    'Long sleeve jersey': {
      name: 'Long Sleeve Jersey',
      description: 'Cycling jersey with arm coverage for cooler weather.',
      whyWear: '50-65°F (10-18°C). Arm coverage without needing arm warmers.',
      lookFor: ['Brushed interior for warmth', 'Full zipper', 'Rear pockets'],
    },
    'Thermal jersey': {
      name: 'Thermal Cycling Jersey',
      description: 'Heavy insulated jersey for cold weather riding.',
      whyWear: 'Below 50°F (10°C). Can be worn alone or with base layer.',
      lookFor: ['Fleece-lined', 'Wind-resistant front', 'Reflective details'],
    },
    'Jersey + vest': {
      name: 'Jersey + Vest',
      description: 'Cycling jersey with a gilet/vest for core warmth.',
      whyWear: 'Cool mornings that warm up. Easy to remove vest.',
      lookFor: ['Packable vest', 'Wind-resistant vest front'],
    },
    'Jersey + jacket': {
      name: 'Jersey + Jacket',
      description: 'Layered system for cold or wet rides.',
      whyWear: 'Cold or rainy conditions. Jacket over jersey.',
    },
    'Race suit top': {
      name: 'XC Race Suit Top',
      description: 'Aerodynamic, fitted top for cross-country ski racing.',
      whyWear: 'XC ski racing. Minimal wind resistance, maximum performance.',
      lookFor: ['Tight fit', 'Wind-resistant front', 'Breathable back panel'],
      examples: ['Swix', 'Craft', 'Bjorn Daehlie'],
    },
    'XC jacket': {
      name: 'XC Ski Jacket',
      description: 'Fitted softshell jacket designed for cross-country skiing.',
      whyWear: 'Standard XC skiing. Wind-resistant front, breathable back.',
      lookFor: ['Softshell front', 'Stretchy back panel', 'Close fit', 'High collar'],
      examples: ['Swix', 'Craft', 'Salomon', 'Bjorn Daehlie'],
      budgetTip: 'Any fitted softshell jacket can work if it\'s not too bulky',
    },
    'Soft shell': {
      name: 'Soft Shell Top',
      description: 'Stretchy, wind-resistant top for active winter use.',
      whyWear: 'Cold weather aerobic activities. Breathes better than hardshell.',
      lookFor: ['4-way stretch', 'Wind-resistant', 'Close fit'],
      examples: ['Patagonia R1 TechFace', 'Arc\'teryx Gamma'],
    },
  },

  // ============ BOTTOMS ============
  bottoms: {
    'Shorts': {
      name: 'Shorts',
      description: 'Standard running/athletic shorts with built-in liner or worn with compression shorts.',
      whyWear: 'Comfortable above 55°F (13°C). The default for most activities.',
      lookFor: ['Built-in brief', 'Side pockets', 'Not too short or long for you'],
      examples: ['Nike Challenger', 'Under Armour', 'Patagonia Strider'],
      budgetTip: 'Any athletic shorts with liner ($20-35)',
    },
    'Tights': {
      name: 'Tights / Running Tights',
      description: 'Full-length compression bottoms for cold weather.',
      whyWear: 'Below 45°F (7°C). Keeps legs warm and muscles supported.',
      lookFor: ['Fleece-lined for cold', 'Side pocket', 'Reflective details'],
      examples: ['Nike Phenom', 'Under Armour ColdGear', '2XU'],
      budgetTip: 'Basic fleece-lined tights ($30-50)',
    },
    'Casual pants': {
      name: 'Casual Pants',
      description: 'Regular everyday pants suitable for walking.',
      whyWear: 'Mild weather walking when athletic wear isn\'t needed.',
      lookFor: ['Comfortable, allows movement', 'Not too tight'],
    },
    'Jeans': {
      name: 'Jeans',
      description: 'Denim pants. OK for casual walking, not ideal for athletic activity.',
      whyWear: 'Casual walks when you don\'t want to change clothes.',
      avoid: 'Not great for exercise - heavy, restrictive, slow to dry',
    },
    'Leggings': {
      name: 'Leggings',
      description: 'Stretchy, fitted pants. Comfortable for walking.',
      whyWear: 'Comfortable for most temperatures. Layer under pants if cold.',
      lookFor: ['Thick enough to not be see-through', 'High waist stays up'],
    },
    'Fleece-lined leggings': {
      name: 'Fleece-Lined Leggings',
      description: 'Leggings with warm fleece interior. Great for cold weather walking.',
      whyWear: 'Best for 20-40°F (-7 to 4°C) walks. Warm but flexible.',
      lookFor: ['Thick fleece lining', 'High waist', 'Not too tight'],
      budgetTip: 'Amazon/Target have good options ($20-40)',
    },
    'Sweatpants': {
      name: 'Sweatpants',
      description: 'Casual cotton or fleece pants.',
      whyWear: 'Casual activities only. Cotton versions get cold when wet.',
      avoid: 'Cotton sweatpants hold moisture - go for fleece or synthetic',
    },
    'Insulated pants': {
      name: 'Insulated Pants',
      description: 'Pants with built-in insulation for very cold weather.',
      whyWear: 'Below 20°F (-7°C). Maximum warmth for cold walks.',
      lookFor: ['Synthetic insulation', 'Wind-resistant outer', 'Articulated knees'],
      examples: ['Outdoor Research', 'Columbia', 'North Face'],
    },
    'Short shorts': {
      name: 'Short Shorts / Split Shorts',
      description: 'Minimal coverage running shorts with high leg cut.',
      whyWear: 'Racing or hot weather. Maximum leg freedom.',
      lookFor: ['Built-in brief', 'Lightweight', '2-3 inch inseam'],
    },
    'Capris': {
      name: 'Capris / 3/4 Tights',
      description: 'Tights that end below the knee.',
      whyWear: '45-55°F (7-13°C). When full tights are too warm.',
      lookFor: ['Same features as full tights', 'Stay-put leg opening'],
    },
    'Shorts over tights': {
      name: 'Shorts Over Tights',
      description: 'Running shorts worn over full-length tights.',
      whyWear: 'Cold weather with shorts coverage. Popular style choice.',
    },
    'Hiking pants': {
      name: 'Hiking Pants',
      description: 'Durable, stretchy pants designed for hiking.',
      whyWear: 'Year-round hiking. More durable than running tights.',
      lookFor: ['Stretchy fabric', 'Articulated knees', 'Zip pockets', 'Quick-dry'],
      examples: ['prAna Stretch Zion', 'Outdoor Research Ferrosi', 'Arc\'teryx Gamma'],
      budgetTip: 'REI Co-op brand has good affordable options ($50-70)',
    },
    'Convertible pants': {
      name: 'Convertible Pants',
      description: 'Hiking pants with zip-off legs that convert to shorts.',
      whyWear: 'Variable weather or elevation changes.',
      lookFor: ['Easy zippers', 'Look good as shorts', 'Stretchy fabric'],
    },
    'Softshell pants': {
      name: 'Softshell Pants',
      description: 'Stretchy, wind-resistant pants for active winter use.',
      whyWear: 'Cold weather activity. More breathable than hardshell.',
      lookFor: ['4-way stretch', 'DWR coating', 'Articulated knees'],
      examples: ['Outdoor Research Cirque', 'Arc\'teryx Gamma'],
    },
    'Rain pants': {
      name: 'Rain Pants',
      description: 'Waterproof pants to keep legs dry in heavy rain.',
      whyWear: 'Heavy rain or wet conditions.',
      lookFor: ['Full side zips', 'Waterproof membrane', 'Packable'],
    },
    'Hardshell pants': {
      name: 'Hardshell Pants',
      description: 'Fully waterproof, windproof pants for severe weather.',
      whyWear: 'Extreme weather - rain, snow, high winds.',
      lookFor: ['Gore-Tex or similar', 'Full side zips', 'Reinforced seat'],
    },
    'Bibs': {
      name: 'Bibs / Bib Pants',
      description: 'Pants with suspender-style upper for secure fit.',
      whyWear: 'Snowshoeing/skiing. Stays up well, snow can\'t get in.',
      lookFor: ['Adjustable suspenders', 'Waterproof', 'Insulated for winter'],
    },
  },

  // ============ CYCLING BIBS/SHORTS ============
  bibs: {
    'Bib shorts': {
      name: 'Bib Shorts',
      description: 'Cycling shorts with suspender-style straps instead of waistband.',
      whyWear: 'Most comfortable for long rides. No waistband digging in.',
      lookFor: ['Quality chamois pad', 'Comfortable straps', 'Leg grippers'],
      examples: ['Rapha Core', 'Castelli', 'Assos'],
      budgetTip: 'Don\'t cheap out on chamois - mid-range ($80-120) is worth it',
    },
    'Shorts': {
      name: 'Cycling Shorts',
      description: 'Padded cycling shorts with waistband.',
      whyWear: 'Shorter rides or if you don\'t like bibs.',
      lookFor: ['Quality chamois', 'Wide waistband', 'Leg grippers'],
    },
    '3/4 bibs': {
      name: '3/4 Bibs / Knickers',
      description: 'Bib shorts that extend below the knee.',
      whyWear: '50-60°F (10-15°C). Knee coverage without full tights.',
      lookFor: ['Thermal fabric', 'Quality chamois', 'Reflective details'],
    },
    'Bib tights': {
      name: 'Bib Tights',
      description: 'Full-length cycling tights with bib straps.',
      whyWear: 'Cold weather riding below 50°F (10°C).',
      lookFor: ['Thermal/fleece-lined', 'Wind-resistant front panel', 'Quality chamois'],
    },
    'Tights over bibs': {
      name: 'Tights Over Bibs',
      description: 'Thermal leg warmers or tights worn over bib shorts.',
      whyWear: 'Very cold rides. Allows wearing your favorite bibs year-round.',
    },
    'XC pants': {
      name: 'XC Ski Pants',
      description: 'Fitted pants designed for cross-country skiing.',
      whyWear: 'Standard XC skiing. Windproof front, stretchy back.',
      lookFor: ['Softshell front', 'Stretchy back panel', 'Articulated knees'],
      examples: ['Swix', 'Craft', 'Salomon'],
    },
    'Race suit tights': {
      name: 'XC Race Suit',
      description: 'One-piece or tight-fitting suit for XC ski racing.',
      whyWear: 'Racing. Minimal wind resistance, maximum performance.',
      lookFor: ['Aerodynamic fit', 'High-stretch fabric', 'Breathable panels'],
    },
  },

  // ============ FOOTWEAR ============
  shoes: {
    'Running shoes': {
      name: 'Running Shoes',
      description: 'Cushioned shoes designed for road running.',
      whyWear: 'The standard choice for running on pavement.',
      lookFor: ['Proper fit (thumb width at toe)', 'Right cushion level for you', 'Get fitted at a running store'],
      examples: ['Brooks Ghost', 'Nike Pegasus', 'ASICS Gel-Nimbus', 'Hoka Clifton'],
      budgetTip: 'Previous year models are often 30-50% off',
    },
    'Sneakers': {
      name: 'Sneakers',
      description: 'General athletic shoes for casual walking.',
      whyWear: 'Fine for casual walks. Not ideal for long distances.',
      lookFor: ['Comfortable fit', 'Decent support'],
    },
    'Sandals': {
      name: 'Sandals',
      description: 'Open footwear for warm weather casual walks.',
      whyWear: 'Hot weather, short easy walks on smooth surfaces only.',
      lookFor: ['Secure heel strap', 'Good arch support', 'Non-slip sole'],
      examples: ['Chaco', 'Teva', 'Birkenstock'],
      avoid: 'Flip-flops for anything more than a short stroll - no support or security',
    },
    'Walking shoes': {
      name: 'Walking Shoes',
      description: 'Comfortable shoes designed for walking with good support.',
      whyWear: 'Better than sneakers for regular walking. More support and cushion.',
      lookFor: ['Good arch support', 'Cushioned sole', 'Breathable upper'],
      examples: ['New Balance 928', 'ASICS Gel-Contend', 'Skechers Go Walk'],
    },
    'Boots': {
      name: 'Boots',
      description: 'Ankle-high footwear for cold or rough conditions.',
      whyWear: 'Cold weather, snow, or uneven terrain.',
      lookFor: ['Warm lining', 'Good traction', 'Waterproof if for snow'],
    },
    'Waterproof shoes': {
      name: 'Waterproof Shoes',
      description: 'Shoes with waterproof membrane to keep feet dry.',
      whyWear: 'Rainy days or wet conditions. Keeps feet dry.',
      lookFor: ['Gore-Tex or similar membrane', 'Sealed seams'],
      examples: ['Any shoe with "GTX" in name'],
    },
    'Trail shoes': {
      name: 'Trail Running Shoes',
      description: 'Running shoes with aggressive tread for off-road terrain.',
      whyWear: 'Trails, dirt paths, uneven terrain. More grip than road shoes.',
      lookFor: ['Lugged outsole', 'Rock plate', 'Secure fit'],
      examples: ['Salomon Speedcross', 'Hoka Speedgoat', 'Brooks Cascadia'],
    },
    'Hiking boots': {
      name: 'Hiking Boots',
      description: 'Sturdy boots with ankle support for hiking.',
      whyWear: 'Rough trails, heavy packs, ankle support needed.',
      lookFor: ['Good ankle support', 'Stiff sole', 'Waterproof'],
      examples: ['Salomon X Ultra', 'Merrell Moab', 'Keen Targhee'],
    },
    'Racing flats': {
      name: 'Racing Flats',
      description: 'Lightweight running shoes for racing.',
      whyWear: 'Races and speed workouts. Lighter but less cushion.',
      lookFor: ['Low drop', 'Lightweight', 'Responsive foam'],
      examples: ['Nike Vaporfly', 'Saucony Endorphin', 'Adidas Adizero'],
    },
    'Track spikes': {
      name: 'Track Spikes',
      description: 'Shoes with metal spikes for track racing.',
      whyWear: 'Track races only. Maximum grip on synthetic surfaces.',
      lookFor: ['Replaceable spikes', 'Event-specific (sprint vs distance)'],
    },
    'Light trail shoes': {
      name: 'Light Trail Shoes',
      description: 'Trail shoes that feel more like road shoes.',
      whyWear: 'Easy trails, groomed paths. More cushion, less aggressive.',
      lookFor: ['Moderate tread', 'Good cushion', 'Comfortable for roads too'],
      examples: ['Hoka Challenger', 'Brooks Catamount', 'Saucony Peregrine'],
    },
    'Aggressive trail shoes': {
      name: 'Aggressive Trail Shoes',
      description: 'Trail shoes with deep lugs for technical terrain.',
      whyWear: 'Mud, steep terrain, technical trails.',
      lookFor: ['Deep lugs', 'Rock plate', 'Secure fit'],
      examples: ['Salomon Speedcross', 'Inov-8 X-Talon', 'La Sportiva'],
    },
    'Approach shoes': {
      name: 'Approach Shoes',
      description: 'Hybrid hiking/climbing shoes with sticky rubber.',
      whyWear: 'Rocky terrain, scrambling, approaching climbs.',
      lookFor: ['Sticky rubber sole', 'Toe protection', 'Precise fit'],
      examples: ['La Sportiva TX', 'Scarpa Gecko', 'Five Ten'],
    },
    'Trail runners': {
      name: 'Trail Runners',
      description: 'Running shoes designed for off-road use.',
      whyWear: 'Trail hiking when you want light, flexible footwear.',
      lookFor: ['Good tread', 'Toe protection', 'Drainage if needed'],
    },
    'Hiking shoes': {
      name: 'Hiking Shoes',
      description: 'Low-cut hiking footwear without ankle support.',
      whyWear: 'Day hikes on moderate terrain. Lighter than boots.',
      lookFor: ['Sturdy sole', 'Toe protection', 'Good traction'],
      examples: ['Merrell Moab Low', 'Salomon X Ultra Low', 'Keen Targhee Low'],
    },
    'Waterproof boots': {
      name: 'Waterproof Boots',
      description: 'Hiking boots with waterproof membrane.',
      whyWear: 'Wet conditions - stream crossings, rain, snow.',
      lookFor: ['Gore-Tex or similar', 'Sealed seams', 'Good ankle support'],
    },
    'Mountaineering boots': {
      name: 'Mountaineering Boots',
      description: 'Stiff, insulated boots for technical mountain terrain.',
      whyWear: 'Snow climbing, glacier travel, crampons needed.',
      lookFor: ['Crampon-compatible', 'Insulated', 'Very stiff sole'],
    },
    'Winter boots': {
      name: 'Winter Boots',
      description: 'Insulated, waterproof boots for cold weather.',
      whyWear: 'Snow and cold conditions. Warmth is priority.',
      lookFor: ['Insulation rating', 'Waterproof', 'Good traction'],
      examples: ['Sorel', 'Columbia Bugaboot', 'Kamik'],
    },
    'Winter hiking boots': {
      name: 'Winter Hiking Boots',
      description: 'Hiking boots with insulation for cold weather hiking.',
      whyWear: 'Cold weather hiking when regular boots aren\'t warm enough.',
      lookFor: ['Insulated', 'Waterproof', 'Crampon-compatible if needed'],
    },
    'Pac boots': {
      name: 'Pac Boots',
      description: 'Traditional winter boots with removable liner.',
      whyWear: 'Extreme cold. Liner can be dried separately.',
      lookFor: ['Removable liner', 'Very warm rating', 'Waterproof rubber bottom'],
      examples: ['Sorel Caribou', 'LaCrosse'],
    },
    'Road shoes': {
      name: 'Cycling Road Shoes',
      description: 'Stiff shoes that clip into road bike pedals.',
      whyWear: 'Road cycling. Transfers power efficiently to pedals.',
      lookFor: ['Stiff carbon or nylon sole', 'BOA or velcro closure', 'Lightweight'],
      examples: ['Shimano', 'Specialized', 'Sidi'],
      budgetTip: 'Entry-level ($100-150) shoes are fine for most riders',
    },
    'MTB shoes': {
      name: 'Mountain Bike Shoes',
      description: 'Cycling shoes with recessed cleats for walking.',
      whyWear: 'Mountain biking. Can walk normally when off bike.',
      lookFor: ['Recessed cleats', 'Grippy sole', 'Toe protection'],
    },
    'Flat pedal shoes': {
      name: 'Flat Pedal Shoes',
      description: 'Grippy shoes for flat (non-clipless) pedals.',
      whyWear: 'Casual cycling or if you prefer not to clip in.',
      lookFor: ['Sticky rubber sole', 'Stiff sole', 'Low profile'],
      examples: ['Five Ten', 'Ride Concepts'],
    },
    'Shoe covers': {
      name: 'Shoe Covers / Booties',
      description: 'Neoprene or thermal covers worn over cycling shoes.',
      whyWear: 'Cold or wet cycling. Keeps feet warm and dry.',
      lookFor: ['Waterproof for rain', 'Thermal for cold', 'Easy to put on'],
    },
    'Classic boots': {
      name: 'XC Classic Ski Boots',
      description: 'Flexible boots for classic (diagonal stride) XC skiing.',
      whyWear: 'Classic skiing technique. More ankle flex than skate.',
      lookFor: ['Flexible sole', 'Warm lining', 'Compatible with your bindings'],
    },
    'Skate boots': {
      name: 'XC Skate Ski Boots',
      description: 'Stiffer boots with ankle support for skate skiing.',
      whyWear: 'Skate skiing technique. Lateral support needed.',
      lookFor: ['Stiff ankle cuff', 'Tight fit', 'Compatible bindings'],
    },
    'Combi boots': {
      name: 'XC Combi Boots',
      description: 'Boots that work for both classic and skate skiing.',
      whyWear: 'If you do both techniques. Compromise design.',
      lookFor: ['Removable ankle cuff', 'Moderate stiffness'],
    },
    'Insulated boots': {
      name: 'Insulated Ski Boots',
      description: 'Extra-warm XC ski boots for very cold days.',
      whyWear: 'Extreme cold or if you run cold.',
      lookFor: ['Heavy insulation', 'Warm lining', 'Wind-resistant upper'],
    },
  },

  // ============ SOCKS ============
  socks: {
    'Regular': {
      name: 'Regular Athletic Socks',
      description: 'Basic athletic socks for everyday use.',
      whyWear: 'Fine for mild conditions and short activities.',
      lookFor: ['Moisture-wicking', 'No cotton if possible'],
    },
    'Wool': {
      name: 'Wool Socks',
      description: 'Merino wool socks that regulate temperature and resist odor.',
      whyWear: 'Cold weather. Wool stays warm even when damp.',
      lookFor: ['Merino wool blend', 'Cushioned heel/toe', 'No seams at toe'],
      examples: ['Darn Tough', 'Smartwool', 'Icebreaker'],
      budgetTip: 'Worth investing in - quality wool socks last years',
    },
    'Thick': {
      name: 'Thick Socks',
      description: 'Extra cushioning and warmth for cold weather.',
      whyWear: 'Very cold conditions or if you prefer more cushion.',
      lookFor: ['Not so thick that shoes don\'t fit'],
    },
    'No-show': {
      name: 'No-Show Socks',
      description: 'Low-cut socks that don\'t show above shoe.',
      whyWear: 'Warm weather, personal preference.',
      lookFor: ['Silicone grip at heel so they don\'t slip'],
    },
    'Compression': {
      name: 'Compression Socks',
      description: 'Tight socks that improve blood flow.',
      whyWear: 'Recovery, long runs, or if you get calf fatigue.',
      lookFor: ['Graduated compression', 'Proper size for your calf'],
      examples: ['CEP', 'Zensah', '2XU'],
    },
    'Waterproof': {
      name: 'Waterproof Socks',
      description: 'Socks with waterproof membrane layer.',
      whyWear: 'Stream crossings, very wet conditions.',
      lookFor: ['Breathable membrane', 'Not too thick'],
      examples: ['SealSkinz', 'Showers Pass'],
    },
    'Hiking socks': {
      name: 'Hiking Socks',
      description: 'Cushioned socks designed for hiking comfort.',
      whyWear: 'Hiking - extra cushion in heel and toe.',
      lookFor: ['Medium cushion', 'Merino blend', 'Moisture-wicking'],
      examples: ['Darn Tough Hiker', 'Smartwool Hike'],
    },
    'Light hiking': {
      name: 'Light Hiking Socks',
      description: 'Thinner hiking socks for warm weather.',
      whyWear: 'Warm weather hiking or if you prefer thinner socks.',
      lookFor: ['Light cushion', 'Moisture-wicking', 'Breathable'],
    },
    'Heavy wool': {
      name: 'Heavy Wool Socks',
      description: 'Thick wool socks for maximum warmth.',
      whyWear: 'Very cold conditions. Mountaineering, snowshoeing.',
      lookFor: ['Expedition weight', 'Shin cushioning', 'Merino blend'],
    },
    'Liner + wool': {
      name: 'Liner + Wool Sock System',
      description: 'Thin liner sock under wool sock for blister prevention.',
      whyWear: 'Long hikes, blister-prone feet, or very cold.',
      lookFor: ['Synthetic or silk liner', 'Wool outer sock'],
    },
    'Heated socks': {
      name: 'Heated Socks',
      description: 'Battery-powered socks with heating elements.',
      whyWear: 'Extreme cold or if you have circulation issues.',
      lookFor: ['Rechargeable battery', 'Multiple heat settings'],
    },
    'Cycling socks': {
      name: 'Cycling Socks',
      description: 'Thin, tall socks for cycling.',
      whyWear: 'Cycling - thin for shoe fit, tall for style.',
      lookFor: ['Thin construction', 'Moisture-wicking', 'Crew or taller height'],
    },
    'Thermal socks': {
      name: 'Thermal Socks',
      description: 'Insulated socks for cold weather cycling.',
      whyWear: 'Cold weather riding. Extra warmth layer.',
      lookFor: ['Wool or thermal synthetic', 'Not too thick for shoes'],
    },
    'Overshoes': {
      name: 'Overshoes',
      description: 'Booties worn over cycling shoes for warmth/waterproofing.',
      whyWear: 'Cold or wet rides. Keeps feet warm and dry.',
      lookFor: ['Neoprene for cold', 'Waterproof for rain', 'Reflective details'],
    },
    'XC socks': {
      name: 'XC Ski Socks',
      description: 'Thin, warm socks for cross-country skiing.',
      whyWear: 'XC skiing - need warmth without bulk.',
      lookFor: ['Medium cushion', 'Moisture-wicking', 'Snug fit'],
    },
    'Thin socks': {
      name: 'Thin Socks',
      description: 'Minimal socks for warm weather or tight shoes.',
      whyWear: 'When you need socks but minimal thickness.',
      lookFor: ['Moisture-wicking', 'Snug fit'],
    },
    'Wool socks': {
      name: 'Wool Cycling/Ski Socks',
      description: 'Merino wool socks for cold weather cycling or skiing.',
      whyWear: 'Cold weather rides or ski days. Wool regulates temperature and resists odor.',
      lookFor: ['Merino blend', 'Thin enough for cycling shoes', 'Moisture-wicking'],
      examples: ['Rapha Merino', 'Swiftwick Pursuit', 'Smartwool PhD'],
      budgetTip: 'Any thin merino sock works - doesn\'t have to be cycling-specific',
    },
  },

  // ============ GLOVES ============
  gloves: {
    'Light gloves': {
      name: 'Light Gloves',
      description: 'Thin gloves for mild cold. Often touchscreen compatible.',
      whyWear: 'Good for 30-45°F (-1 to 7°C). Your hands warm up as you exercise.',
      lookFor: ['Touchscreen compatible', 'Snug fit', 'Can stuff in pocket'],
      examples: ['Any running gloves', 'Nike Lightweight', 'Under Armour'],
      budgetTip: 'Basic thin gloves ($10-20)',
    },
    'Warm gloves': {
      name: 'Warm Gloves',
      description: 'Insulated gloves for cold conditions.',
      whyWear: 'Below 30°F (-1°C) for walking, or if your hands run cold.',
      lookFor: ['Fleece or insulated', 'Wind-resistant'],
    },
    'Heavy gloves': {
      name: 'Heavy Gloves',
      description: 'Thick insulated gloves for very cold conditions.',
      whyWear: 'Below 20°F (-7°C) or if you have poor circulation.',
      lookFor: ['Heavy insulation', 'Wind/waterproof shell'],
    },
    'Mittens': {
      name: 'Mittens',
      description: 'Keep all fingers together for maximum warmth.',
      whyWear: 'Extreme cold. Warmer than gloves because fingers share heat.',
      lookFor: ['Waterproof shell', 'Removable liner'],
    },
    'Fleece gloves': {
      name: 'Fleece Gloves',
      description: 'Warm fleece gloves for cold conditions.',
      whyWear: '25-40°F (-4 to 4°C). Good warmth, breathable.',
      lookFor: ['Wind-resistant', 'Touchscreen compatible', 'Snug fit'],
    },
    'Insulated gloves': {
      name: 'Insulated Gloves',
      description: 'Gloves with synthetic insulation for cold.',
      whyWear: 'Below 25°F (-4°C). More warmth than fleece.',
      lookFor: ['Synthetic insulation', 'Waterproof shell option'],
    },
    'Heavy mittens': {
      name: 'Heavy Mittens',
      description: 'Heavily insulated mittens for extreme cold.',
      whyWear: 'Below 0°F (-18°C) or poor circulation.',
      lookFor: ['Down or heavy synthetic fill', 'Waterproof shell'],
    },
    'Lobster mitts': {
      name: 'Lobster Mitts',
      description: 'Hybrid - two-finger mittens with thumb.',
      whyWear: 'Very cold but need some finger dexterity.',
      lookFor: ['Good insulation', 'Wind-resistant'],
    },
    'Liner + mittens': {
      name: 'Liner + Mittens',
      description: 'Thin liner glove under heavy mittens.',
      whyWear: 'Extreme cold. Liner helps when you remove mittens briefly.',
      lookFor: ['Thin wool or synthetic liner', 'Heavy outer mitten'],
    },
    'Fingerless': {
      name: 'Fingerless Cycling Gloves',
      description: 'Padded cycling gloves without finger coverage.',
      whyWear: 'Warm weather cycling. Palm padding for comfort.',
      lookFor: ['Gel or foam padding', 'Breathable back', 'Secure fit'],
    },
    'Full finger light': {
      name: 'Full Finger Light Gloves',
      description: 'Thin full-finger cycling gloves.',
      whyWear: '55-65°F (13-18°C) cycling. Light hand coverage.',
      lookFor: ['Thin construction', 'Touchscreen compatible'],
    },
    'Thermal gloves': {
      name: 'Thermal Cycling Gloves',
      description: 'Insulated full-finger cycling gloves.',
      whyWear: 'Cold weather cycling below 50°F (10°C).',
      lookFor: ['Windproof back', 'Insulated palm', 'Reflective details'],
    },
    'Lobster gloves': {
      name: 'Lobster Cycling Gloves',
      description: 'Two-finger cycling gloves for extreme cold.',
      whyWear: 'Very cold cycling below 35°F (2°C).',
      lookFor: ['Heavy insulation', 'Wind/waterproof', 'Bar grip'],
    },
    'XC gloves': {
      name: 'XC Ski Gloves',
      description: 'Fitted gloves designed for cross-country skiing.',
      whyWear: 'Standard XC skiing. Dexterity for pole grip.',
      lookFor: ['Snug fit', 'Grip palm', 'Windproof back'],
      examples: ['Swix', 'Craft', 'Salomon'],
    },
  },

  // ============ OUTER LAYERS ============
  outerLayer: {
    'Light jacket': {
      name: 'Light Jacket / Windbreaker',
      description: 'Thin jacket that blocks wind but allows some breathability.',
      whyWear: 'Windy days, light rain, or as a layer over other clothing.',
      lookFor: ['Wind-resistant', 'Packable', 'Breathable'],
      examples: ['Nike Windrunner', 'Patagonia Houdini', 'Under Armour Storm'],
      budgetTip: 'Basic windbreaker ($30-50)',
    },
    'Rain jacket': {
      name: 'Rain Jacket',
      description: 'Waterproof jacket to keep you dry in rain.',
      whyWear: 'Rainy conditions. Fully waterproof, not just water-resistant.',
      lookFor: ['Waterproof rating (10k+)', 'Sealed seams', 'Pit zips for ventilation'],
      examples: ['Outdoor Research Helium', 'Patagonia Torrentshell', 'Marmot PreCip'],
    },
    'Winter coat': {
      name: 'Winter Coat',
      description: 'Heavy insulated coat for very cold weather walking.',
      whyWear: 'Below 25°F (-4°C) for walking when you need maximum warmth.',
      lookFor: ['Down or synthetic insulation', 'Wind-resistant shell'],
    },
    'Down jacket': {
      name: 'Down Jacket / Puffy',
      description: 'Lightweight but very warm insulated jacket.',
      whyWear: 'Cold weather when you need warmth without bulk.',
      lookFor: ['Down or synthetic fill', 'Packable', 'DWR coating'],
      examples: ['Patagonia Down Sweater', 'Arc\'teryx Cerium', 'Mountain Hardwear Ghost Whisperer'],
    },
    'Wind jacket': {
      name: 'Wind Jacket',
      description: 'Ultralight jacket that blocks wind.',
      whyWear: 'Windy conditions. Very packable emergency layer.',
      lookFor: ['Packs into pocket', 'Lightweight', 'Breathable'],
      examples: ['Patagonia Houdini', 'Black Diamond Alpine Start'],
    },
    'Hardshell': {
      name: 'Hardshell Jacket',
      description: 'Fully waterproof, windproof outer layer.',
      whyWear: 'Rain, snow, extreme conditions. Full weather protection.',
      lookFor: ['Gore-Tex or similar', 'Pit zips', 'Helmet-compatible hood'],
      examples: ['Arc\'teryx Beta', 'Patagonia Triolet', 'OR Foray'],
    },
    'Insulated jacket': {
      name: 'Insulated Jacket',
      description: 'Jacket with built-in insulation for cold.',
      whyWear: 'Cold weather. All-in-one warmth solution.',
      lookFor: ['Synthetic or down fill', 'Weather-resistant shell'],
    },
    'Softshell': {
      name: 'Softshell Jacket',
      description: 'Stretchy, breathable jacket with some weather resistance.',
      whyWear: 'Active use in cold. Breathes better than hardshell.',
      lookFor: ['4-way stretch', 'DWR coating', 'Breathable'],
      examples: ['Arc\'teryx Gamma', 'Patagonia R1 TechFace'],
    },
  },

  // ============ MID LAYERS ============
  midLayer: {
    'Fleece': {
      name: 'Fleece',
      description: 'Warm, breathable mid-layer.',
      whyWear: '25-45°F (-4 to 7°C). Insulates even when damp.',
      lookFor: ['Lightweight or midweight', 'Quarter zip', 'Thumb holes'],
      examples: ['Patagonia R1', 'Arc\'teryx Delta'],
    },
    'Light fleece': {
      name: 'Light Fleece',
      description: 'Thin fleece for mild cold or high activity.',
      whyWear: '35-50°F (2-10°C) or as base layer under shell.',
      lookFor: ['Thin, stretchy', 'Moisture-wicking'],
    },
    'Grid fleece': {
      name: 'Grid Fleece',
      description: 'Fleece with grid pattern for breathability.',
      whyWear: 'High-output activities in cold. Very breathable.',
      lookFor: ['Grid interior', 'Stretchy', 'Low bulk'],
      examples: ['Patagonia R1', 'Polartec Grid'],
    },
    'Light puffy': {
      name: 'Light Puffy / Ultralight Down',
      description: 'Thin insulated layer for warmth without bulk.',
      whyWear: 'Layering piece or mild cold weather.',
      lookFor: ['Packable', 'Light insulation', 'DWR treated'],
    },
    'Heavy puffy': {
      name: 'Heavy Puffy / Belay Jacket',
      description: 'Thick insulated jacket for stationary warmth.',
      whyWear: 'Very cold or when not moving (belaying, breaks).',
      lookFor: ['Heavy down or synthetic fill', 'Draft collar'],
    },
  },

  // ============ RAIN GEAR ============
  rainGear: {
    'Light rain jacket': {
      name: 'Light Rain Jacket',
      description: 'Lightweight, packable rain protection.',
      whyWear: 'Light to moderate rain. Packs small.',
      lookFor: ['Sealed seams', 'Packable', 'Breathable membrane'],
    },
    'Waterproof jacket': {
      name: 'Waterproof Jacket',
      description: 'Fully waterproof shell for heavy rain.',
      whyWear: 'Heavy rain or extended wet conditions.',
      lookFor: ['High waterproof rating', 'Pit zips', 'Adjustable hood'],
    },
    'Rain cape': {
      name: 'Rain Cape',
      description: 'Poncho-style rain protection for cycling.',
      whyWear: 'Cycling in rain. Covers you and handlebar area.',
      lookFor: ['Thumb loops', 'Visibility', 'Ventilation'],
    },
    'Full rain kit': {
      name: 'Full Rain Kit',
      description: 'Complete rain protection - jacket, pants, covers.',
      whyWear: 'Serious wet weather. Full coverage.',
    },
  },

  // ============ HELMETS ============
  helmet: {
    'Road helmet': {
      name: 'Road Cycling Helmet',
      description: 'Lightweight, ventilated helmet for road cycling.',
      whyWear: 'Road cycling. Good ventilation, aerodynamic.',
      lookFor: ['MIPS or similar tech', 'Good ventilation', 'Proper fit'],
      examples: ['Giro', 'POC', 'Smith'],
      budgetTip: 'Entry-level ($50-80) helmets are perfectly safe',
    },
    'Aero helmet': {
      name: 'Aero Helmet',
      description: 'Aerodynamic helmet for racing/time trials.',
      whyWear: 'Racing, TT, triathlon. Maximum speed.',
      lookFor: ['Wind tunnel tested', 'Minimal vents'],
    },
    'MTB helmet': {
      name: 'Mountain Bike Helmet',
      description: 'Helmet with extended coverage for mountain biking.',
      whyWear: 'Mountain biking. More coverage at back of head.',
      lookFor: ['Extended rear coverage', 'Visor', 'Good ventilation'],
    },
    'Commuter helmet': {
      name: 'Commuter Helmet',
      description: 'Urban-style helmet for city cycling.',
      whyWear: 'Commuting, city riding. Often more stylish.',
      lookFor: ['Rear light mount', 'Good visibility', 'Comfortable'],
    },
  },

  // ============ ARM/LEG WARMERS ============
  armWarmers: {
    'Arm warmers': {
      name: 'Arm Warmers',
      description: 'Sleeves that add warmth to short-sleeve jersey.',
      whyWear: '55-65°F (13-18°C). Easy to remove as you warm up.',
      lookFor: ['Grippy top edge', 'Thermal or regular', 'Packable'],
    },
    'Leg warmers': {
      name: 'Leg Warmers',
      description: 'Full-length leg coverage worn with shorts.',
      whyWear: '50-60°F (10-15°C). Add warmth without bib tights.',
      lookFor: ['Thermal fabric', 'Grippy edges', 'Good fit'],
    },
    'Knee warmers': {
      name: 'Knee Warmers',
      description: 'Coverage from above knee to mid-calf.',
      whyWear: '55-65°F (13-18°C). Protect knees from cold.',
      lookFor: ['Stays in place', 'Thermal fabric'],
    },
    'Arm + leg warmers': {
      name: 'Arm + Leg Warmers',
      description: 'Full arm and leg coverage set.',
      whyWear: 'Cool mornings that warm up. Remove as needed.',
    },
    'Arm + knee warmers': {
      name: 'Arm + Knee Warmers',
      description: 'Arms and knee coverage set.',
      whyWear: 'Moderate cold - protect extremities and knees.',
    },
  },

  // ============ EYEWEAR ============
  eyewear: {
    'Sunglasses': {
      name: 'Sunglasses',
      description: 'Eye protection from sun and UV.',
      whyWear: 'Sunny conditions. Reduces glare and UV exposure.',
      lookFor: ['100% UV protection', 'Secure fit', 'Wrap-around for wind'],
      examples: ['Goodr', 'Oakley', 'Smith'],
    },
    'Clear glasses': {
      name: 'Clear Lens Glasses',
      description: 'Eye protection without tint.',
      whyWear: 'Overcast days, dusk, or night. Blocks wind/debris.',
      lookFor: ['Anti-fog coating', 'Wrap-around style'],
    },
    'Photochromic': {
      name: 'Photochromic Glasses',
      description: 'Lenses that darken in bright light.',
      whyWear: 'Variable conditions. One pair for all light levels.',
      lookFor: ['Fast transition', 'Wide range of tint', 'Quality optics'],
    },
    'Goggles': {
      name: 'Goggles',
      description: 'Full eye coverage for snow sports.',
      whyWear: 'Snow, high winds, very cold. Complete protection.',
      lookFor: ['Anti-fog', 'Helmet compatible', 'Good peripheral vision'],
      examples: ['Smith', 'Oakley', 'POC'],
    },
  },

  // ============ HYDRATION ============
  hydration: {
    'Handheld bottle': {
      name: 'Handheld Bottle',
      description: 'Water bottle with hand strap.',
      whyWear: 'Runs up to 1 hour. Simple, lightweight.',
      lookFor: ['Comfortable grip strap', 'Easy squeeze', 'Small pocket'],
    },
    'Waist belt': {
      name: 'Hydration Belt',
      description: 'Belt with small bottles around waist.',
      whyWear: 'Medium runs. Carries bottles and small items.',
      lookFor: ['Stable fit', 'No bounce', 'Multiple bottles'],
    },
    'Hydration vest': {
      name: 'Hydration Vest',
      description: 'Vest with bladder or soft flasks.',
      whyWear: 'Long runs, trail running. Carries water and gear.',
      lookFor: ['500ml-2L capacity', 'Multiple pockets', 'Secure fit'],
      examples: ['Salomon ADV Skin', 'Nathan VaporAir', 'Ultimate Direction'],
    },
    'Running pack': {
      name: 'Running Pack',
      description: 'Small backpack for running with more storage.',
      whyWear: 'Ultra runs, self-supported runs. More gear capacity.',
      lookFor: ['Stable fit', 'Hydration compatible', 'Hip belt pockets'],
    },
  },

  // ============ GAITERS ============
  gaiters: {
    'Low gaiters': {
      name: 'Low Gaiters / Trail Gaiters',
      description: 'Ankle-height gaiters that keep debris out of shoes.',
      whyWear: 'Trail running, hiking. Keeps rocks and sand out.',
      lookFor: ['Lightweight', 'Secure fit', 'Breathable'],
      examples: ['Dirty Girl Gaiters', 'Outdoor Research'],
    },
    'Gaiters': {
      name: 'Gaiters',
      description: 'Mid-height gaiters for snow and brush.',
      whyWear: 'Snow hiking, snowshoeing. Keeps snow out of boots.',
      lookFor: ['Waterproof', 'Instep strap', 'Secure top'],
    },
    'Full gaiters': {
      name: 'Full Gaiters',
      description: 'Knee-height gaiters for deep snow.',
      whyWear: 'Deep snow, bushwhacking. Maximum protection.',
      lookFor: ['Heavy-duty', 'Front zip or velcro', 'Crampon compatible'],
    },
  },

  // ============ POLES ============
  poles: {
    'Trekking poles': {
      name: 'Trekking Poles',
      description: 'Adjustable poles for hiking support.',
      whyWear: 'Steep terrain, heavy pack, knee issues.',
      lookFor: ['Adjustable length', 'Comfortable grips', 'Lightweight'],
      examples: ['Black Diamond', 'Leki', 'REI Co-op'],
      budgetTip: 'Budget aluminum poles ($50-70) work great',
    },
    'Poles': {
      name: 'Poles',
      description: 'Poles for snowshoeing or skiing support.',
      whyWear: 'Balance and propulsion in snow.',
      lookFor: ['Larger baskets for snow', 'Adjustable length'],
    },
  },

  // ============ PACKS ============
  pack: {
    'Waist pack': {
      name: 'Waist Pack / Fanny Pack',
      description: 'Small pack worn around waist.',
      whyWear: 'Short hikes, minimal gear needs.',
      lookFor: ['Doesn\'t bounce', 'Easy access', 'Water bottle holder'],
    },
    'Daypack (20L)': {
      name: 'Small Daypack (20L)',
      description: 'Compact backpack for short hikes.',
      whyWear: 'Day hikes with minimal gear.',
      lookFor: ['Hip belt', 'Hydration compatible', 'Comfortable straps'],
    },
    'Daypack (30L)': {
      name: 'Daypack (30L)',
      description: 'Standard daypack for full-day hikes.',
      whyWear: 'Full-day hikes with layers, food, gear.',
      lookFor: ['Hip belt with pockets', 'Load-bearing frame', 'Rain cover'],
    },
    'Overnight pack': {
      name: 'Overnight Pack (40L+)',
      description: 'Larger pack for overnight trips.',
      whyWear: 'Backpacking, overnight hikes.',
      lookFor: ['Proper frame', 'Hip belt', 'External attachment points'],
    },
  },

  // ============ ACCESSORIES ============
  accessories: {
    'Sunglasses': {
      name: 'Sunglasses',
      description: 'Protect your eyes from sun and UV rays.',
      whyWear: 'Sunny conditions. Reduces eye strain and UV damage.',
      lookFor: ['UV protection', 'Secure fit for activity', 'Non-slip nose pads'],
      examples: ['Goodr (budget)', 'Oakley', 'Smith'],
      budgetTip: 'Goodr sunglasses are $25 and great for running',
    },
    'Headlamp': {
      name: 'Headlamp',
      description: 'Hands-free light worn on your head.',
      whyWear: 'Before sunrise or after sunset. Essential for visibility and safety.',
      lookFor: ['200+ lumens', 'Red light mode', 'Rechargeable'],
      examples: ['Petzl Actik', 'Black Diamond Spot', 'BioLite'],
      budgetTip: 'Basic USB-rechargeable headlamp ($20-30)',
    },
    'Scarf': {
      name: 'Scarf',
      description: 'Covers neck for warmth in cold weather.',
      whyWear: 'Cold and windy conditions. Protects neck from cold air.',
    },
    'Umbrella': {
      name: 'Umbrella',
      description: 'For walking in rain when you don\'t want to get wet.',
      whyWear: 'Rainy walks when a rain jacket isn\'t enough.',
    },
    'Lights': {
      name: 'Bike Lights',
      description: 'Front and rear lights for cycling visibility.',
      whyWear: 'Dawn, dusk, night, or low visibility. Required by law in many places.',
      lookFor: ['Bright front (200+ lumens)', 'Rear flasher', 'Rechargeable'],
      examples: ['Light & Motion', 'Cygolite', 'NiteRider'],
    },
    'Reflective vest': {
      name: 'Reflective Vest',
      description: 'High-visibility vest for low light.',
      whyWear: 'Dawn, dusk, night running/cycling. Be seen by drivers.',
      lookFor: ['Bright color', 'Reflective strips', 'Lightweight'],
    },
    'Lights + vest': {
      name: 'Lights + Reflective Vest',
      description: 'Full visibility kit for low-light cycling.',
      whyWear: 'Night cycling. Maximum visibility.',
    },
    'Neck gaiter': {
      name: 'Neck Gaiter',
      description: 'Tube of fabric worn around neck for warmth.',
      whyWear: 'Cold weather. Protects neck, can pull up over face.',
      lookFor: ['Moisture-wicking', 'Warm fleece or merino'],
      examples: ['Buff', 'Smartwool'],
    },
    'Hand warmers': {
      name: 'Hand Warmers',
      description: 'Disposable or rechargeable heat packs for hands.',
      whyWear: 'Extreme cold. Extra warmth in gloves or pockets.',
      lookFor: ['Long-lasting', 'Rechargeable option for regular use'],
    },
    'Neck gaiter + hand warmers': {
      name: 'Neck Gaiter + Hand Warmers',
      description: 'Cold weather accessory combo.',
      whyWear: 'Very cold XC skiing. Extra warmth for neck and hands.',
    },
  },
};

// Get info for a specific clothing item
export function getClothingInfo(category: string, itemName: string): ClothingInfo | null {
  // Normalize the item name for lookup
  const normalizedItem = itemName.toLowerCase().trim();
  
  // Check the specific category first
  const categoryInfo = CLOTHING_INFO[category];
  if (categoryInfo) {
    for (const [key, info] of Object.entries(categoryInfo)) {
      if (key.toLowerCase() === normalizedItem) {
        return info;
      }
    }
  }
  
  // Search all categories as fallback
  for (const catInfo of Object.values(CLOTHING_INFO)) {
    for (const [key, info] of Object.entries(catInfo)) {
      if (key.toLowerCase() === normalizedItem) {
        return info;
      }
    }
  }
  
  return null;
}



