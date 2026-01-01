/**
 * Tests for activity-specific temperature defaults
 * 
 * Verifies that each activity returns correct clothing recommendations
 * for each temperature range (extremeCold through hot).
 */

import { describe, it, expect } from 'vitest';
import { ACTIVITY_TEMP_DEFAULTS, getTempRange, getWeatherOverrides, type TempRange } from '../data/activityDefaults';
import { getFallbackRecommendation } from '../services/recommendationEngine';
import type { WeatherData, ActivityType } from '../types';

// Helper to create mock weather data at a specific temperature
function createWeatherData(tempF: number, overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    temperature: tempF,
    feelsLike: tempF,
    humidity: 50,
    pressure: 30,
    precipitation: 0,
    uvIndex: 5,
    windSpeed: 5,
    cloudCover: 50,
    description: 'clear sky',
    icon: '01d',
    location: 'Test Location',
    timestamp: new Date(),
    sunrise: new Date(new Date().setHours(6, 30, 0, 0)),
    sunset: new Date(new Date().setHours(18, 30, 0, 0)),
    ...overrides,
  };
}

// Test temperatures for each range (middle of range)
const TEMP_SAMPLES: Record<TempRange, number> = {
  extremeCold: 0,    // < 5°F
  freezing: 10,      // 5-14°F
  veryCold: 20,      // 15-24°F
  cold: 32,          // 25-39°F
  cool: 47,          // 40-54°F
  mild: 60,          // 55-64°F
  warm: 70,          // 65-74°F
  hot: 85,           // 75°F+
};

const ALL_ACTIVITIES: ActivityType[] = [
  'running',
  'trail_running',
  'hiking',
  'walking',
  'cycling',
  'snowshoeing',
  'cross_country_skiing',
];

const ALL_TEMP_RANGES: TempRange[] = [
  'extremeCold',
  'freezing',
  'veryCold',
  'cold',
  'cool',
  'mild',
  'warm',
  'hot',
];

describe('Temperature Range Detection', () => {
  it('should correctly identify extremeCold range (< 5°F)', () => {
    expect(getTempRange(4)).toBe('extremeCold');
    expect(getTempRange(0)).toBe('extremeCold');
    expect(getTempRange(-20)).toBe('extremeCold');
  });

  it('should correctly identify freezing range (5-14°F)', () => {
    expect(getTempRange(5)).toBe('freezing');
    expect(getTempRange(10)).toBe('freezing');
    expect(getTempRange(14)).toBe('freezing');
    expect(getTempRange(4.9)).toBe('extremeCold'); // Just below threshold
  });

  it('should correctly identify veryCold range (15-24°F)', () => {
    expect(getTempRange(15)).toBe('veryCold');
    expect(getTempRange(20)).toBe('veryCold');
    expect(getTempRange(24)).toBe('veryCold');
  });

  it('should correctly identify cold range (25-39°F)', () => {
    expect(getTempRange(25)).toBe('cold');
    expect(getTempRange(32)).toBe('cold');
    expect(getTempRange(39)).toBe('cold');
  });

  it('should correctly identify cool range (40-54°F)', () => {
    expect(getTempRange(40)).toBe('cool');
    expect(getTempRange(47)).toBe('cool');
    expect(getTempRange(54)).toBe('cool');
  });

  it('should correctly identify mild range (55-64°F)', () => {
    expect(getTempRange(55)).toBe('mild');
    expect(getTempRange(60)).toBe('mild');
    expect(getTempRange(64)).toBe('mild');
  });

  it('should correctly identify warm range (65-74°F)', () => {
    expect(getTempRange(65)).toBe('warm');
    expect(getTempRange(70)).toBe('warm');
    expect(getTempRange(74)).toBe('warm');
  });

  it('should correctly identify hot range (75°F+)', () => {
    expect(getTempRange(75)).toBe('hot');
    expect(getTempRange(85)).toBe('hot');
    expect(getTempRange(100)).toBe('hot');
  });
});

describe('Activity Defaults Configuration', () => {
  it('should have defaults defined for all 7 activities', () => {
    ALL_ACTIVITIES.forEach(activity => {
      expect(ACTIVITY_TEMP_DEFAULTS[activity]).toBeDefined();
    });
  });

  it('should have all 8 temperature ranges for each activity', () => {
    ALL_ACTIVITIES.forEach(activity => {
      ALL_TEMP_RANGES.forEach(range => {
        expect(ACTIVITY_TEMP_DEFAULTS[activity][range]).toBeDefined();
      });
    });
  });
});

describe('Running Defaults', () => {
  const activity: ActivityType = 'running';

  it('should recommend balaclava and heavy mittens in extremeCold weather', () => {
    const defaults = ACTIVITY_TEMP_DEFAULTS[activity].extremeCold;
    expect(defaults.headCover).toBe('Balaclava');
    expect(defaults.gloves).toBe('Heavy mittens');
    expect(defaults.tops).toBe('Base layer + jacket');
    expect(defaults.bottoms).toBe('Tights');
    expect(defaults.accessories).toBe('Neck gaiter');
  });

  it('should recommend balaclava and heavy gloves in freezing weather', () => {
    const defaults = ACTIVITY_TEMP_DEFAULTS[activity].freezing;
    expect(defaults.headCover).toBe('Balaclava');
    expect(defaults.gloves).toBe('Heavy gloves');
    expect(defaults.tops).toBe('Base layer + jacket');
    expect(defaults.bottoms).toBe('Tights');
  });

  it('should recommend beanie in very cold weather', () => {
    const defaults = ACTIVITY_TEMP_DEFAULTS[activity].veryCold;
    expect(defaults.headCover).toBe('Beanie');
    expect(defaults.gloves).toBe('Heavy gloves');
  });

  it('should recommend light gloves in cold weather', () => {
    const defaults = ACTIVITY_TEMP_DEFAULTS[activity].cold;
    expect(defaults.gloves).toBe('Light gloves');
  });

  it('should recommend no gloves in cool weather', () => {
    const defaults = ACTIVITY_TEMP_DEFAULTS[activity].cool;
    expect(defaults.gloves).toBe('None');
    expect(defaults.headCover).toBe('Headband');
  });

  it('should recommend t-shirt and shorts in mild weather', () => {
    const defaults = ACTIVITY_TEMP_DEFAULTS[activity].mild;
    expect(defaults.tops).toBe('T-shirt');
    expect(defaults.bottoms).toBe('Shorts');
    expect(defaults.headCover).toBe('None');
  });

  it('should recommend singlet and short shorts in hot weather', () => {
    const defaults = ACTIVITY_TEMP_DEFAULTS[activity].hot;
    expect(defaults.tops).toBe('Singlet');
    expect(defaults.bottoms).toBe('Short shorts');
  });
});

describe('Trail Running Defaults', () => {
  const activity: ActivityType = 'trail_running';

  it('should include hydration in all temperature ranges', () => {
    ALL_TEMP_RANGES.forEach(range => {
      const defaults = ACTIVITY_TEMP_DEFAULTS[activity][range];
      expect(defaults.hydration).toBeDefined();
    });
  });

  it('should recommend trail shoes', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.shoes).toBe('Trail shoes');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].hot.shoes).toBe('Light trail shoes');
  });

  it('should recommend wind jacket in extremeCold/freezing/very cold', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].extremeCold.rainGear).toBe('Wind jacket');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.rainGear).toBe('Wind jacket');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].veryCold.rainGear).toBe('Wind jacket');
  });
});

describe('Hiking Defaults (Layering System)', () => {
  const activity: ActivityType = 'hiking';

  it('should use layering system (base, mid, outer)', () => {
    const freezing = ACTIVITY_TEMP_DEFAULTS[activity].freezing;
    expect(freezing.baseLayer).toBe('Merino base');
    expect(freezing.midLayer).toBe('Heavy puffy');
    expect(freezing.outerLayer).toBe('Insulated jacket');
  });

  it('should recommend waterproof boots in freezing weather', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.shoes).toBe('Waterproof boots');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].veryCold.shoes).toBe('Waterproof boots');
  });

  it('should recommend trekking poles in cold conditions', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].veryCold.accessories).toBe('Trekking poles');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.accessories).toBe('Trekking poles');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cool.accessories).toBe('Trekking poles');
  });

  it('should recommend smaller pack in warm weather', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.pack).toBe('Daypack (30L)');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].warm.pack).toBe('Daypack (20L)');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].hot.pack).toBe('Waist pack');
  });
});

describe('Walking Defaults (Casual Clothing)', () => {
  const activity: ActivityType = 'walking';

  it('should recommend winter coat in freezing/very cold', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.outerLayer).toBe('Winter coat');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].veryCold.outerLayer).toBe('Winter coat');
  });

  it('should recommend boots in cold weather', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.shoes).toBe('Boots');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.shoes).toBe('Boots');
  });

  it('should recommend sandals in hot weather', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].hot.shoes).toBe('Sandals');
  });

  it('should include scarf as accessory in freezing/very cold', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.accessories).toBe('Scarf');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].veryCold.accessories).toBe('Scarf');
  });
});

describe('Cycling Defaults', () => {
  const activity: ActivityType = 'cycling';

  it('should always include helmet', () => {
    ALL_TEMP_RANGES.forEach(range => {
      expect(ACTIVITY_TEMP_DEFAULTS[activity][range].helmet).toBe('Road helmet');
    });
  });

  it('should recommend lobster gloves in freezing/very cold', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.gloves).toBe('Lobster gloves');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].veryCold.gloves).toBe('Lobster gloves');
  });

  it('should recommend shoe covers in freezing/very cold', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.shoes).toBe('Shoe covers');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].veryCold.shoes).toBe('Shoe covers');
  });

  it('should recommend bib tights in cold weather', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.bottoms).toBe('Bib tights');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.bottoms).toBe('Bib tights');
  });

  it('should recommend lights in freezing/very cold', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.accessories).toBe('Lights');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].veryCold.accessories).toBe('Lights');
  });

  it('should have appropriate eyewear for conditions', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.eyewear).toBe('Clear glasses');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.eyewear).toBe('Photochromic');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].warm.eyewear).toBe('Sunglasses');
  });
});

describe('Snowshoeing Defaults', () => {
  const activity: ActivityType = 'snowshoeing';

  it('should recommend pac boots in freezing weather', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.boots).toBe('Pac boots');
  });

  it('should recommend expedition weight base layer in freezing', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.baseLayer).toBe('Expedition weight');
  });

  it('should recommend gaiters in cold conditions', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.gaiters).toBe('Full gaiters');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.gaiters).toBe('Gaiters');
  });

  it('should recommend poles + goggles in very cold', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.accessories).toBe('Poles + goggles');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].veryCold.accessories).toBe('Poles + goggles');
  });

  it('should switch to sunglasses in cold (not freezing)', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.accessories).toBe('Poles + sunglasses');
  });
});

describe('Cross Country Skiing Defaults', () => {
  const activity: ActivityType = 'cross_country_skiing';

  it('should recommend XC-specific clothing', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.tops).toBe('XC jacket');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.bottoms).toBe('XC pants');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.gloves).toBe('XC gloves');
  });

  it('should recommend classic boots', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.boots).toBe('Classic boots');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cool.boots).toBe('Classic boots');
  });

  it('should recommend goggles in very cold weather', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].freezing.eyewear).toBe('Goggles');
    expect(ACTIVITY_TEMP_DEFAULTS[activity].veryCold.eyewear).toBe('Goggles');
  });

  it('should recommend neck gaiter in cold conditions', () => {
    expect(ACTIVITY_TEMP_DEFAULTS[activity].cold.accessories).toBe('Neck gaiter');
  });
});

describe('Weather Overrides', () => {
  it('should add rain gear when raining for running', () => {
    const overrides = getWeatherOverrides('running', {
      isRaining: true,
      isSnowing: false,
      isWindy: false,
      isSunny: false,
      isDark: false,
    }, 'cold');
    expect(overrides.rainGear).toBe('Waterproof jacket');
  });

  it('should add light rain jacket in warm rain', () => {
    const overrides = getWeatherOverrides('running', {
      isRaining: true,
      isSnowing: false,
      isWindy: false,
      isSunny: false,
      isDark: false,
    }, 'warm');
    expect(overrides.rainGear).toBe('Light rain jacket');
  });

  it('should add waterproof boots for hiking in snow', () => {
    const overrides = getWeatherOverrides('hiking', {
      isRaining: false,
      isSnowing: true,
      isWindy: false,
      isSunny: false,
      isDark: false,
    }, 'cold');
    expect(overrides.shoes).toBe('Waterproof boots');
  });

  it('should add umbrella for walking in rain', () => {
    const overrides = getWeatherOverrides('walking', {
      isRaining: true,
      isSnowing: false,
      isWindy: false,
      isSunny: false,
      isDark: false,
    }, 'mild');
    expect(overrides.accessories).toBe('Umbrella');
  });

  it('should add headlamp for running in dark', () => {
    const overrides = getWeatherOverrides('running', {
      isRaining: false,
      isSnowing: false,
      isWindy: false,
      isSunny: false,
      isDark: true,
    }, 'mild');
    expect(overrides.accessories).toBe('Headlamp + reflective vest');
  });

  it('should add lights for cycling in dark', () => {
    const overrides = getWeatherOverrides('cycling', {
      isRaining: false,
      isSnowing: false,
      isWindy: false,
      isSunny: false,
      isDark: true,
    }, 'mild');
    expect(overrides.accessories).toBe('Lights + vest');
    expect(overrides.eyewear).toBe('Clear glasses');
  });

  it('should add sunglasses when sunny', () => {
    const overrides = getWeatherOverrides('running', {
      isRaining: false,
      isSnowing: false,
      isWindy: false,
      isSunny: true,
      isDark: false,
    }, 'mild');
    expect(overrides.accessories).toBe('Sunglasses');
  });

  it('should add wind jacket for trail running in wind', () => {
    const overrides = getWeatherOverrides('trail_running', {
      isRaining: false,
      isSnowing: false,
      isWindy: true,
      isSunny: false,
      isDark: false,
    }, 'cool');
    expect(overrides.rainGear).toBe('Wind jacket');
  });
});

describe('Fallback Recommendation Integration', () => {
  ALL_ACTIVITIES.forEach(activity => {
    describe(`${activity}`, () => {
      ALL_TEMP_RANGES.forEach(range => {
        it(`should return valid recommendations for ${range} weather`, () => {
          const temp = TEMP_SAMPLES[range];
          const weather = createWeatherData(temp);
          const recommendation = getFallbackRecommendation(weather, [], activity);
          
          // Should return a valid object with clothing items
          expect(recommendation).toBeDefined();
          expect(typeof recommendation).toBe('object');
          
          // Should have at least some clothing defined
          const hasClothing = Object.values(recommendation).some(v => v && v !== 'None');
          expect(hasClothing).toBe(true);
        });
      });
    });
  });
});

describe('Cycling Shoes and Socks Integration', () => {
  it('should apply shoe covers in extremeCold or freezing weather for cycling', () => {
    const weatherExtreme = createWeatherData(0); // extremeCold
    const recExtreme = getFallbackRecommendation(weatherExtreme, [], 'cycling');
    expect(recExtreme.shoes).toBe('Shoe covers');
    
    const weatherFreezing = createWeatherData(5); // freezing
    const recFreezing = getFallbackRecommendation(weatherFreezing, [], 'cycling');
    expect(recFreezing.shoes).toBe('Shoe covers');
  });

  it('should apply wool socks in cold weather for cycling', () => {
    const weather = createWeatherData(32); // cold
    const recommendation = getFallbackRecommendation(weather, [], 'cycling');
    expect(recommendation.shoes).toBe('Road shoes');
    expect(recommendation.socks).toBe('Wool socks');
  });

  it('should apply cycling socks in mild weather for cycling', () => {
    const weather = createWeatherData(60); // mild
    const recommendation = getFallbackRecommendation(weather, [], 'cycling');
    expect(recommendation.shoes).toBe('Road shoes');
    expect(recommendation.socks).toBe('Cycling socks');
  });

  it('should apply no-show socks in hot weather for cycling', () => {
    const weather = createWeatherData(85); // hot
    const recommendation = getFallbackRecommendation(weather, [], 'cycling');
    expect(recommendation.shoes).toBe('Road shoes');
    expect(recommendation.socks).toBe('No-show');
  });
});

describe('Edge Cases', () => {
  it('should handle extremely cold temperatures', () => {
    const weather = createWeatherData(-40);
    const recommendation = getFallbackRecommendation(weather, [], 'running');
    expect(recommendation).toBeDefined();
  });

  it('should handle extremely hot temperatures', () => {
    const weather = createWeatherData(110);
    const recommendation = getFallbackRecommendation(weather, [], 'running');
    expect(recommendation).toBeDefined();
  });

  it('should handle boundary temperatures correctly', () => {
    // Test at exact boundaries
    expect(getTempRange(15)).toBe('veryCold'); // Should be veryCold, not freezing
    expect(getTempRange(14.9)).toBe('freezing');
    expect(getTempRange(5)).toBe('freezing'); // Should be freezing, not extremeCold
    expect(getTempRange(4.9)).toBe('extremeCold');
    expect(getTempRange(25)).toBe('cold');
    expect(getTempRange(24.9)).toBe('veryCold');
  });
});

describe('Safety Checks - No Inappropriate Clothing', () => {
  it('should not recommend shorts in extremeCold or freezing weather for any activity', () => {
    ALL_ACTIVITIES.forEach(activity => {
      ['extremeCold', 'freezing'].forEach(range => {
        const defaults = ACTIVITY_TEMP_DEFAULTS[activity][range as TempRange];
        const bottoms = (defaults.bottoms || '').toLowerCase();
        expect(bottoms).not.toContain('shorts');
        expect(bottoms).not.toContain('short');
      });
    });
  });

  it('should not recommend t-shirts in extremeCold or freezing weather', () => {
    ALL_ACTIVITIES.forEach(activity => {
      ['extremeCold', 'freezing'].forEach(range => {
        const defaults = ACTIVITY_TEMP_DEFAULTS[activity][range as TempRange];
        const tops = (defaults.tops || defaults.baseLayer || '').toLowerCase();
        expect(tops).not.toBe('t-shirt');
        expect(tops).not.toBe('singlet');
      });
    });
  });

  it('should not recommend sandals in cold weather', () => {
    ['freezing', 'veryCold', 'cold', 'cool'].forEach(range => {
      ALL_ACTIVITIES.forEach(activity => {
        const defaults = ACTIVITY_TEMP_DEFAULTS[activity][range as TempRange];
        const shoes = (defaults.shoes || defaults.boots || '').toLowerCase();
        expect(shoes).not.toContain('sandal');
      });
    });
  });

  it('should recommend gloves in extremeCold or freezing weather', () => {
    ALL_ACTIVITIES.forEach(activity => {
      ['extremeCold', 'freezing'].forEach(range => {
        const defaults = ACTIVITY_TEMP_DEFAULTS[activity][range as TempRange];
        const gloves = defaults.gloves || '';
        expect(gloves).not.toBe('None');
        expect(gloves.length).toBeGreaterThan(0);
      });
    });
  });

  it('should recommend head cover in extremeCold or freezing weather', () => {
    ALL_ACTIVITIES.forEach(activity => {
      ['extremeCold', 'freezing'].forEach(range => {
        const defaults = ACTIVITY_TEMP_DEFAULTS[activity][range as TempRange];
        // Cycling uses 'helmet' instead of 'headCover'
        const headCover = defaults.headCover || defaults.helmet || '';
        expect(headCover).not.toBe('None');
        expect(headCover.length).toBeGreaterThan(0);
      });
    });
  });
});

