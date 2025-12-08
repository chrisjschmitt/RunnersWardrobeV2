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



