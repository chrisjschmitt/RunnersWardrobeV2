/**
 * Activity-specific clothing defaults by temperature range
 * 
 * Temperature ranges (in °F):
 * - freezing: < 15°F (-9°C)
 * - veryCold: 15-25°F (-9 to -4°C)
 * - cold: 25-40°F (-4 to 4°C)
 * - cool: 40-55°F (4 to 13°C)
 * - mild: 55-65°F (13 to 18°C)
 * - warm: 65-75°F (18 to 24°C)
 * - hot: > 75°F (24°C)
 */

import type { ActivityType, ClothingItems } from '../types';

export type TempRange = 'freezing' | 'veryCold' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot';

export interface TempRangeDefaults {
  freezing: Partial<ClothingItems>;  // < 15°F
  veryCold: Partial<ClothingItems>;  // 15-25°F
  cold: Partial<ClothingItems>;      // 25-40°F
  cool: Partial<ClothingItems>;      // 40-55°F
  mild: Partial<ClothingItems>;      // 55-65°F
  warm: Partial<ClothingItems>;      // 65-75°F
  hot: Partial<ClothingItems>;       // > 75°F
}

/**
 * Get temperature range from temperature in Fahrenheit
 */
export function getTempRange(tempF: number): TempRange {
  if (tempF < 15) return 'freezing';
  if (tempF < 25) return 'veryCold';
  if (tempF < 40) return 'cold';
  if (tempF < 55) return 'cool';
  if (tempF < 65) return 'mild';
  if (tempF < 75) return 'warm';
  return 'hot';
}

/**
 * Activity-specific defaults for each temperature range
 */
export const ACTIVITY_TEMP_DEFAULTS: Record<ActivityType, TempRangeDefaults> = {
  // ============================================================
  // RUNNING
  // ============================================================
  running: {
    freezing: {
      headCover: 'Balaclava',
      tops: 'Base layer + jacket',
      bottoms: 'Tights',
      shoes: 'Running shoes',
      socks: 'Wool',
      gloves: 'Heavy gloves',
      rainGear: 'None',
      accessories: 'None',
    },
    veryCold: {
      headCover: 'Beanie',
      tops: 'Base layer + jacket',
      bottoms: 'Tights',
      shoes: 'Running shoes',
      socks: 'Wool',
      gloves: 'Heavy gloves',
      rainGear: 'None',
      accessories: 'None',
    },
    cold: {
      headCover: 'Beanie',
      tops: 'Long sleeve',
      bottoms: 'Tights',
      shoes: 'Running shoes',
      socks: 'Wool',
      gloves: 'Light gloves',
      rainGear: 'None',
      accessories: 'None',
    },
    cool: {
      headCover: 'Headband',
      tops: 'Long sleeve',
      bottoms: 'Tights',
      shoes: 'Running shoes',
      socks: 'Regular',
      gloves: 'None',
      rainGear: 'None',
      accessories: 'None',
    },
    mild: {
      headCover: 'None',
      tops: 'T-shirt',
      bottoms: 'Shorts',
      shoes: 'Running shoes',
      socks: 'Regular',
      gloves: 'None',
      rainGear: 'None',
      accessories: 'None',
    },
    warm: {
      headCover: 'Cap',
      tops: 'T-shirt',
      bottoms: 'Shorts',
      shoes: 'Running shoes',
      socks: 'No-show',
      gloves: 'None',
      rainGear: 'None',
      accessories: 'None',
    },
    hot: {
      headCover: 'Cap',
      tops: 'Singlet',
      bottoms: 'Short shorts',
      shoes: 'Running shoes',
      socks: 'No-show',
      gloves: 'None',
      rainGear: 'None',
      accessories: 'None',
    },
  },

  // ============================================================
  // TRAIL RUNNING
  // ============================================================
  trail_running: {
    freezing: {
      headCover: 'Balaclava',
      tops: 'Base layer + jacket',
      bottoms: 'Tights',
      shoes: 'Trail shoes',
      socks: 'Wool',
      gloves: 'Heavy gloves',
      rainGear: 'Wind jacket',
      hydration: 'Hydration vest',
      accessories: 'None',
    },
    veryCold: {
      headCover: 'Beanie',
      tops: 'Base layer + jacket',
      bottoms: 'Tights',
      shoes: 'Trail shoes',
      socks: 'Wool',
      gloves: 'Heavy gloves',
      rainGear: 'Wind jacket',
      hydration: 'Hydration vest',
      accessories: 'None',
    },
    cold: {
      headCover: 'Beanie',
      tops: 'Long sleeve',
      bottoms: 'Tights',
      shoes: 'Trail shoes',
      socks: 'Wool',
      gloves: 'Light gloves',
      rainGear: 'None',
      hydration: 'Hydration vest',
      accessories: 'None',
    },
    cool: {
      headCover: 'Buff',
      tops: 'Long sleeve',
      bottoms: 'Tights',
      shoes: 'Trail shoes',
      socks: 'Regular',
      gloves: 'None',
      rainGear: 'None',
      hydration: 'Hydration vest',
      accessories: 'None',
    },
    mild: {
      headCover: 'Cap',
      tops: 'T-shirt',
      bottoms: 'Shorts',
      shoes: 'Trail shoes',
      socks: 'Regular',
      gloves: 'None',
      rainGear: 'None',
      hydration: 'Handheld bottle',
      accessories: 'None',
    },
    warm: {
      headCover: 'Cap',
      tops: 'T-shirt',
      bottoms: 'Shorts',
      shoes: 'Trail shoes',
      socks: 'No-show',
      gloves: 'None',
      rainGear: 'None',
      hydration: 'Hydration vest',
      accessories: 'None',
    },
    hot: {
      headCover: 'Cap',
      tops: 'Singlet',
      bottoms: 'Short shorts',
      shoes: 'Light trail shoes',
      socks: 'No-show',
      gloves: 'None',
      rainGear: 'None',
      hydration: 'Hydration vest',
      accessories: 'None',
    },
  },

  // ============================================================
  // HIKING
  // ============================================================
  hiking: {
    freezing: {
      headCover: 'Balaclava',
      baseLayer: 'Merino base',
      midLayer: 'Heavy puffy',
      outerLayer: 'Insulated jacket',
      bottoms: 'Insulated pants',
      shoes: 'Waterproof boots',
      socks: 'Heavy wool',
      gloves: 'Insulated gloves',
      pack: 'Daypack (30L)',
      accessories: 'None',
    },
    veryCold: {
      headCover: 'Beanie',
      baseLayer: 'Merino base',
      midLayer: 'Heavy puffy',
      outerLayer: 'Hardshell',
      bottoms: 'Insulated pants',
      shoes: 'Waterproof boots',
      socks: 'Heavy wool',
      gloves: 'Insulated gloves',
      pack: 'Daypack (30L)',
      accessories: 'Trekking poles',
    },
    cold: {
      headCover: 'Beanie',
      baseLayer: 'Merino base',
      midLayer: 'Fleece',
      outerLayer: 'Wind jacket',
      bottoms: 'Softshell pants',
      shoes: 'Hiking boots',
      socks: 'Hiking socks',
      gloves: 'Light gloves',
      pack: 'Daypack (30L)',
      accessories: 'Trekking poles',
    },
    cool: {
      headCover: 'Cap',
      baseLayer: 'Long sleeve',
      midLayer: 'Fleece',
      outerLayer: 'None',
      bottoms: 'Hiking pants',
      shoes: 'Hiking boots',
      socks: 'Hiking socks',
      gloves: 'None',
      pack: 'Daypack (20L)',
      accessories: 'Trekking poles',
    },
    mild: {
      headCover: 'Cap',
      baseLayer: 'T-shirt',
      midLayer: 'None',
      outerLayer: 'None',
      bottoms: 'Hiking pants',
      shoes: 'Hiking shoes',
      socks: 'Light hiking',
      gloves: 'None',
      pack: 'Daypack (20L)',
      accessories: 'None',
    },
    warm: {
      headCover: 'Sun hat',
      baseLayer: 'T-shirt',
      midLayer: 'None',
      outerLayer: 'None',
      bottoms: 'Convertible pants',
      shoes: 'Trail runners',
      socks: 'Light hiking',
      gloves: 'None',
      pack: 'Daypack (20L)',
      accessories: 'None',
    },
    hot: {
      headCover: 'Sun hat',
      baseLayer: 'T-shirt',
      midLayer: 'None',
      outerLayer: 'None',
      bottoms: 'Shorts',
      shoes: 'Trail runners',
      socks: 'Light hiking',
      gloves: 'None',
      pack: 'Waist pack',
      accessories: 'None',
    },
  },

  // ============================================================
  // WALKING
  // ============================================================
  walking: {
    freezing: {
      headCover: 'Beanie',
      tops: 'Fleece',
      outerLayer: 'Winter coat',
      bottoms: 'Insulated pants',
      shoes: 'Boots',
      socks: 'Thick',
      gloves: 'Warm gloves',
      accessories: 'Scarf',
    },
    veryCold: {
      headCover: 'Beanie',
      tops: 'Fleece',
      outerLayer: 'Winter coat',
      bottoms: 'Fleece-lined leggings',
      shoes: 'Boots',
      socks: 'Thick',
      gloves: 'Warm gloves',
      accessories: 'Scarf',
    },
    cold: {
      headCover: 'Beanie',
      tops: 'Sweater',
      outerLayer: 'Down jacket',
      bottoms: 'Fleece-lined leggings',
      shoes: 'Boots',
      socks: 'Wool',
      gloves: 'Light gloves',
      accessories: 'None',
    },
    cool: {
      headCover: 'Ear warmers',
      tops: 'Long sleeve',
      outerLayer: 'Light jacket',
      bottoms: 'Casual pants',
      shoes: 'Walking shoes',
      socks: 'Regular',
      gloves: 'None',
      accessories: 'None',
    },
    mild: {
      headCover: 'None',
      tops: 'T-shirt',
      outerLayer: 'Light jacket',
      bottoms: 'Casual pants',
      shoes: 'Sneakers',
      socks: 'Regular',
      gloves: 'None',
      accessories: 'None',
    },
    warm: {
      headCover: 'Cap',
      tops: 'T-shirt',
      outerLayer: 'None',
      bottoms: 'Shorts',
      shoes: 'Sneakers',
      socks: 'No-show',
      gloves: 'None',
      accessories: 'None',
    },
    hot: {
      headCover: 'Sun hat',
      tops: 'T-shirt',
      outerLayer: 'None',
      bottoms: 'Shorts',
      shoes: 'Sandals',
      socks: 'No-show',
      gloves: 'None',
      accessories: 'None',
    },
  },

  // ============================================================
  // CYCLING
  // ============================================================
  cycling: {
    freezing: {
      helmet: 'Road helmet',
      tops: 'Thermal jersey',
      bottoms: 'Bib tights',
      shoes: 'Shoe covers',
      socks: 'Thermal socks',
      gloves: 'Lobster gloves',
      armWarmers: 'Arm + leg warmers',
      eyewear: 'Clear glasses',
      rainGear: 'None',
      accessories: 'Lights',
    },
    veryCold: {
      helmet: 'Road helmet',
      tops: 'Jersey + jacket',
      bottoms: 'Bib tights',
      shoes: 'Shoe covers',
      socks: 'Thermal socks',
      gloves: 'Lobster gloves',
      armWarmers: 'Arm + leg warmers',
      eyewear: 'Clear glasses',
      rainGear: 'None',
      accessories: 'Lights',
    },
    cold: {
      helmet: 'Road helmet',
      tops: 'Jersey + jacket',
      bottoms: 'Bib tights',
      shoes: 'Road shoes',
      socks: 'Wool socks',
      gloves: 'Thermal gloves',
      armWarmers: 'Leg warmers',
      eyewear: 'Photochromic',
      rainGear: 'None',
      accessories: 'None',
    },
    cool: {
      helmet: 'Road helmet',
      tops: 'Long sleeve jersey',
      bottoms: '3/4 bibs',
      shoes: 'Road shoes',
      socks: 'Cycling socks',
      gloves: 'Full finger light',
      armWarmers: 'Knee warmers',
      eyewear: 'Photochromic',
      rainGear: 'None',
      accessories: 'None',
    },
    mild: {
      helmet: 'Road helmet',
      tops: 'Short sleeve jersey',
      bottoms: 'Bib shorts',
      shoes: 'Road shoes',
      socks: 'Cycling socks',
      gloves: 'Fingerless',
      armWarmers: 'None',
      eyewear: 'Sunglasses',
      rainGear: 'None',
      accessories: 'None',
    },
    warm: {
      helmet: 'Road helmet',
      tops: 'Short sleeve jersey',
      bottoms: 'Bib shorts',
      shoes: 'Road shoes',
      socks: 'Cycling socks',
      gloves: 'None',
      armWarmers: 'None',
      eyewear: 'Sunglasses',
      rainGear: 'None',
      accessories: 'None',
    },
    hot: {
      helmet: 'Road helmet',
      tops: 'Sleeveless jersey',
      bottoms: 'Shorts',
      shoes: 'Road shoes',
      socks: 'No-show',
      gloves: 'None',
      armWarmers: 'None',
      eyewear: 'Sunglasses',
      rainGear: 'None',
      accessories: 'None',
    },
  },

  // ============================================================
  // SNOWSHOEING
  // ============================================================
  snowshoeing: {
    freezing: {
      headCover: 'Balaclava',
      baseLayer: 'Expedition weight',
      midLayer: 'Heavy puffy',
      outerLayer: 'Insulated jacket',
      bottoms: 'Bibs',
      boots: 'Pac boots',
      socks: 'Liner + wool',
      gloves: 'Liner + mittens',
      gaiters: 'Full gaiters',
      accessories: 'Poles + goggles',
    },
    veryCold: {
      headCover: 'Balaclava',
      baseLayer: 'Heavy merino',
      midLayer: 'Heavy puffy',
      outerLayer: 'Hardshell',
      bottoms: 'Insulated pants',
      boots: 'Winter boots',
      socks: 'Heavy wool',
      gloves: 'Heavy mittens',
      gaiters: 'Gaiters',
      accessories: 'Poles + goggles',
    },
    cold: {
      headCover: 'Beanie',
      baseLayer: 'Merino base',
      midLayer: 'Fleece',
      outerLayer: 'Softshell',
      bottoms: 'Softshell pants',
      boots: 'Winter boots',
      socks: 'Heavy wool',
      gloves: 'Insulated gloves',
      gaiters: 'Gaiters',
      accessories: 'Poles + sunglasses',
    },
    cool: {
      headCover: 'Fleece headband',
      baseLayer: 'Light synthetic',
      midLayer: 'Light fleece',
      outerLayer: 'Wind jacket',
      bottoms: 'Hiking pants',
      boots: 'Winter hiking boots',
      socks: 'Wool',
      gloves: 'Light gloves',
      gaiters: 'Low gaiters',
      accessories: 'Poles + sunglasses',
    },
    // Snowshoeing unlikely in mild/warm/hot, but provide sensible fallbacks
    mild: {
      headCover: 'Fleece headband',
      baseLayer: 'Light synthetic',
      midLayer: 'Light fleece',
      outerLayer: 'None',
      bottoms: 'Hiking pants',
      boots: 'Hiking boots',
      socks: 'Wool',
      gloves: 'None',
      gaiters: 'Low gaiters',
      accessories: 'Poles',
    },
    warm: {
      headCover: 'Fleece headband',
      baseLayer: 'Light synthetic',
      midLayer: 'None',
      outerLayer: 'None',
      bottoms: 'Hiking pants',
      boots: 'Hiking boots',
      socks: 'Wool',
      gloves: 'None',
      gaiters: 'None',
      accessories: 'Poles',
    },
    hot: {
      headCover: 'Fleece headband',
      baseLayer: 'Light synthetic',
      midLayer: 'None',
      outerLayer: 'None',
      bottoms: 'Hiking pants',
      boots: 'Hiking boots',
      socks: 'Wool',
      gloves: 'None',
      gaiters: 'None',
      accessories: 'Poles',
    },
  },

  // ============================================================
  // CROSS COUNTRY SKIING
  // ============================================================
  cross_country_skiing: {
    freezing: {
      headCover: 'Balaclava',
      baseLayer: 'Merino base',
      tops: 'Wind jacket + fleece',
      bottoms: 'Wind pants over tights',
      boots: 'Insulated boots',
      socks: 'Wool socks',
      gloves: 'Heavy mittens',
      eyewear: 'Goggles',
      accessories: 'Neck gaiter + hand warmers',
    },
    veryCold: {
      headCover: 'Beanie',
      baseLayer: 'Merino base',
      tops: 'XC jacket',
      bottoms: 'XC pants',
      boots: 'Classic boots',
      socks: 'Wool socks',
      gloves: 'Lobster mitts',
      eyewear: 'Goggles',
      accessories: 'Neck gaiter',
    },
    cold: {
      headCover: 'Light beanie',
      baseLayer: 'Merino base',
      tops: 'XC jacket',
      bottoms: 'XC pants',
      boots: 'Classic boots',
      socks: 'XC socks',
      gloves: 'XC gloves',
      eyewear: 'Sunglasses',
      accessories: 'Neck gaiter',
    },
    cool: {
      headCover: 'Headband',
      baseLayer: 'Light synthetic',
      tops: 'XC jacket',
      bottoms: 'XC pants',
      boots: 'Classic boots',
      socks: 'XC socks',
      gloves: 'Light gloves',
      eyewear: 'Sunglasses',
      accessories: 'None',
    },
    // XC Skiing unlikely in mild/warm/hot, but provide sensible fallbacks
    mild: {
      headCover: 'Headband',
      baseLayer: 'Light synthetic',
      tops: 'Soft shell',
      bottoms: 'Race suit tights',
      boots: 'Classic boots',
      socks: 'Thin socks',
      gloves: 'Light gloves',
      eyewear: 'Sunglasses',
      accessories: 'None',
    },
    warm: {
      headCover: 'Headband',
      baseLayer: 'Light synthetic',
      tops: 'Race suit top',
      bottoms: 'Race suit tights',
      boots: 'Classic boots',
      socks: 'Thin socks',
      gloves: 'None',
      eyewear: 'Sunglasses',
      accessories: 'None',
    },
    hot: {
      headCover: 'Headband',
      baseLayer: 'Light synthetic',
      tops: 'Race suit top',
      bottoms: 'Race suit tights',
      boots: 'Classic boots',
      socks: 'Thin socks',
      gloves: 'None',
      eyewear: 'Sunglasses',
      accessories: 'None',
    },
  },
};

/**
 * Weather condition modifiers that override base temperature recommendations
 */
export interface WeatherModifiers {
  isRaining: boolean;
  isSnowing: boolean;
  isWindy: boolean;
  isSunny: boolean;
  isDark: boolean;
}

/**
 * Get weather-based overrides for an activity
 * Returns partial clothing items that should override temperature-based defaults
 */
export function getWeatherOverrides(
  activity: ActivityType,
  modifiers: WeatherModifiers,
  tempRange: TempRange
): Partial<ClothingItems> {
  const overrides: Partial<ClothingItems> = {};

  // Rain overrides
  if (modifiers.isRaining) {
    switch (activity) {
      case 'running':
      case 'trail_running':
        overrides.rainGear = tempRange === 'freezing' || tempRange === 'veryCold' || tempRange === 'cold' 
          ? 'Waterproof jacket' 
          : 'Light rain jacket';
        break;
      case 'hiking':
        overrides.outerLayer = 'Rain jacket';
        overrides.bottoms = 'Rain pants';
        break;
      case 'walking':
        overrides.outerLayer = 'Rain jacket';
        overrides.accessories = 'Umbrella';
        break;
      case 'cycling':
        overrides.rainGear = 'Full rain kit';
        break;
    }
  }

  // Snow overrides (mainly for hiking/walking in unexpected snow)
  if (modifiers.isSnowing && (activity === 'hiking' || activity === 'walking')) {
    overrides.shoes = 'Waterproof boots';
  }

  // Wind overrides
  if (modifiers.isWindy) {
    switch (activity) {
      case 'running':
        if (tempRange === 'cool' || tempRange === 'mild') {
          overrides.tops = 'Long sleeve';
        }
        break;
      case 'trail_running':
        if (tempRange === 'cool' || tempRange === 'mild') {
          overrides.rainGear = 'Wind jacket';
        }
        break;
      case 'cycling':
        if (tempRange === 'mild') {
          overrides.tops = 'Jersey + vest';
        }
        break;
    }
  }

  // Sunny overrides (sunglasses/eyewear) - handled in accessory logic
  if (modifiers.isSunny) {
    switch (activity) {
      case 'running':
      case 'trail_running':
      case 'hiking':
      case 'walking':
        overrides.accessories = overrides.accessories 
          ? overrides.accessories 
          : 'Sunglasses';
        break;
      case 'cycling':
        overrides.eyewear = 'Sunglasses';
        break;
      case 'snowshoeing':
        // Keep poles, add sunglasses
        if (!overrides.accessories?.includes('goggles')) {
          overrides.accessories = 'Poles + sunglasses';
        }
        break;
      case 'cross_country_skiing':
        overrides.eyewear = 'Sunglasses';
        break;
    }
  }

  // Dark overrides (headlamp/lights)
  if (modifiers.isDark) {
    switch (activity) {
      case 'running':
        overrides.accessories = 'Headlamp + reflective vest';
        break;
      case 'trail_running':
        overrides.accessories = 'Headlamp';
        break;
      case 'hiking':
        overrides.accessories = 'Headlamp';
        break;
      case 'walking':
        // Keep existing or none
        break;
      case 'cycling':
        overrides.accessories = 'Lights + vest';
        overrides.eyewear = 'Clear glasses';
        break;
      case 'snowshoeing':
        overrides.accessories = 'Headlamp + poles';
        break;
      case 'cross_country_skiing':
        overrides.accessories = 'Headlamp';
        break;
    }
  }

  return overrides;
}



