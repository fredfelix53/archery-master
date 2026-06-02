/* ===== Archery Master — Full Progression System ===== */
(function() {
  'use strict';

  const SAVE_KEY = 'archery_progress';
  const DAILY_KEY = 'archery_daily';

  const UPGRADE_TIERS = {
    weapon: {
      name: 'Bow', icon: '🏹', maxLevel: 5, baseCost: 1000, costMultiplier: 2, gemCost: 50,
      levels: [
        { level: 0, name: 'Wooden Bow',     bonus: { accuracy: 0, scoreMult: 1.0 },  gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Longbow',        bonus: { accuracy: 0.05, scoreMult: 1.1 }, gemReq: 50,  coinsReq: 1000 },
        { level: 2, name: 'Recurve Bow',    bonus: { accuracy: 0.1, scoreMult: 1.2 },  gemReq: 80,  coinsReq: 2000 },
        { level: 3, name: 'Compound Bow',   bonus: { accuracy: 0.15, scoreMult: 1.35 }, gemReq: 120, coinsReq: 4000 },
        { level: 4, name: 'Olympic Elite',  bonus: { accuracy: 0.2, scoreMult: 1.5 },   gemReq: 200, coinsReq: 8000 },
        { level: 5, name: '🏹 Phoenix',    bonus: { accuracy: 0.3, scoreMult: 2.0 },    gemReq: 500, coinsReq: 20000 },
      ]
    },
    case: {
      name: 'Arrow', icon: '➡️', maxLevel: 5, baseCost: 800, costMultiplier: 2, gemCost: 50,
      levels: [
        { level: 0, name: 'Stone Tip',     bonus: { windResist: 0, aimGuide: 0 },      gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Iron Arrow',    bonus: { windResist: 0.1, aimGuide: 0 },    gemReq: 40,  coinsReq: 800 },
        { level: 2, name: 'Steel Arrow',   bonus: { windResist: 0.2, aimGuide: 0 },    gemReq: 70,  coinsReq: 1600 },
        { level: 3, name: 'Carbon Fiber',  bonus: { windResist: 0.3, aimGuide: 5 },    gemReq: 100, coinsReq: 3200 },
        { level: 4, name: 'Aerodynamic',   bonus: { windResist: 0.4, aimGuide: 8 },    gemReq: 180, coinsReq: 6400 },
        { level: 5, name: '➡️ Phantom',   bonus: { windResist: 0.5, aimGuide: 12 },   gemReq: 400, coinsReq: 16000 },
      ]
    },
    outfit: {
      name: 'Quiver', icon: '🎒', maxLevel: 5, baseCost: 600, costMultiplier: 2, gemCost: 40,
      levels: [
        { level: 0, name: 'Small Quiver',  bonus: { extraArrows: 0, roundBonus: 0 },    gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Medium Quiver', bonus: { extraArrows: 1, roundBonus: 0 },    gemReq: 30,  coinsReq: 600 },
        { level: 2, name: 'Large Quiver',  bonus: { extraArrows: 2, roundBonus: 1 },    gemReq: 60,  coinsReq: 1200 },
        { level: 3, name: 'Quiver Pack',   bonus: { extraArrows: 3, roundBonus: 1 },    gemReq: 90,  coinsReq: 2400 },
        { level: 4, name: 'Tactical Pack', bonus: { extraArrows: 4, roundBonus: 2 },    gemReq: 150, coinsReq: 4800 },
        { level: 5, name: '🎒 Infinity',  bonus: { extraArrows: 5, roundBonus: 3 },    gemReq: 350, coinsReq: 12000 },
      ]
    }
  };

  const CATALOG = {
    bowStyles: [
      { id: 'classic',  name: 'Classic Wood',  price: 0,    desc: 'Traditional wooden bow' },
      { id: 'dark',     name: 'Shadow Hunter', price: 600,  desc: 'Sleek dark finish' },
      { id: 'golden',   name: 'Golden Eagle',  price: 1500, desc: 'Gold-accented bow' },
      { id: 'crystal',  name: 'Crystal Bow',   price: 3000, desc: 'Translucent crystal' },
      { id: 'neon',     name: 'Neon Striker',  price: 5000, desc: 'Glowing neon edges' },
    ],
    arrowEffects: [
      { id: 'normal',   name: 'Standard',     price: 0,    desc: 'Normal arrow trail' },
      { id: 'fire',     name: 'Flaming Arrow', price: 800,  desc: 'Fire trail effect' },
      { id: 'ice',      name: 'Ice Arrow',    price: 1200, desc: 'Frost trail effect' },
      { id: 'lightning',name: 'Lightning',    price: 2500, desc: 'Electric arc trail' },
      { id: 'ghost',    name: 'Ghost Arrow',  price: 4000, desc: 'Translucent phantom' },
    ],
    targetThemes: [
      { id: 'classic',  name: 'Classic Red',  price: 0,    desc: 'Standard red/white target' },
      { id: 'forest',   name: 'Forest Green', price: 500,  desc: 'Green woodland theme' },
      { id: 'desert',   name: 'Desert Sands', price: 1000, desc: 'Sandstone colors' },
      { id: 'medieval', name: 'Medieval',     price: 2000, desc: 'Old parchment style' },
      { id: 'neon',     name: 'Neon Target',  price: 4000, desc: 'Glowing neon rings' },
    ],
    powerupPacks: [
      { id: 'windShield', name: 'Wind Shield', price: 400,  desc: 'No wind for 3 shots' },
      { id: 'focus',      name: 'Focus Aid',   price: 600,  desc: 'Perfect accuracy next shot' },
      { id: 'double',     name: 'Double Shot', price: 800,  desc: '2 arrows at once' },
    ],
  };

  const ACHIEVEMENTS = [
    { id: 'first_play',   name: 'First Shot',        desc: 'Play your first game',               reward: { coins: 50, gems: 0 },  icon: '🎯' },
    { id: 'score_50',     name: 'Sharpshooter',      desc: 'Score 50 in one round',              reward: { coins: 100, gems: 0 }, icon: '🎯' },
    { id: 'score_100',    name: 'Hundred Club',      desc: 'Score 100 in one round',             reward: { coins: 300, gems: 5 }, icon: '💯' },
    { id: 'score_150',    name: 'Perfect Round',     desc: 'Score 150 in one round',             reward: { coins: 500, gems: 10 },icon: '🏆' },
    { id: 'bullseye_1',   name: 'First Bullseye',    desc: 'Hit a bullseye',                     reward: { coins: 100, gems: 0 }, icon: '🎯' },
    { id: 'bullseye_5',   name: 'Bullseye Master',   desc: 'Hit 5 bullseyes total',              reward: { coins: 500, gems: 10 },icon: '💯' },
    { id: 'bullseye_10',  name: 'Bullseye Legend',   desc: 'Hit 10 bullseyes total',             reward: { coins: 1000, gems: 20 },icon: '🌟' },
    { id: 'level_2',      name: 'Intermediate',      desc: 'Clear level 2',                      reward: { coins: 200, gems: 5 }, icon: '📈' },
    { id: 'level_5',      name: 'Expert Archer',     desc: 'Clear level 5',                      reward: { coins: 800, gems: 15 },icon: '⭐' },
    { id: 'level_10',     name: 'Master Archer',     desc: 'Clear level 10',                     reward: { coins: 2000, gems: 30 },icon: '👑' },
    { id: 'wind_clear',   name: 'Wind Dancer',       desc: 'Score 80+ with strong wind',         reward: { coins: 500, gems: 10 },icon: '💨' },
    { id: 'no_miss',      name: 'Flawless',          desc: 'Perfect round, no miss',             reward: { coins: 1000, gems: 20 },icon: '✨' },
    { id: 'weapon_5',     name: 'Bow Master',        desc: 'Max Bow upgrade',                    reward: { coins: 2000, gems: 50 },icon: '🏹' },
    { id: 'case_5',       name: 'Arrow Sage',        desc: 'Max Arrow upgrade',                  reward: { coins: 2000, gems: 50 },icon: '➡️' },
    { id: 'outfit_5',     name: 'Quiver King',       desc: 'Max Quiver upgrade',                 reward: { coins: 2000, gems: 50 },icon: '🎒' },
  ];
  ACHIEVEMENTS.forEach(a => { a.check = genCheck(a); });

  function genCheck(ach) {
    const id = ach.id;
    return function(p) {
      if (id === 'first_play') return p.totalPlays >= 1;
      if (id === 'score_50') return p.bestScore >= 50;
      if (id === 'score_100') return p.bestScore >= 100;
      if (id === 'score_150') return p.bestScore >= 150;
      if (id === 'bullseye_1') return p.totalBullseyes >= 1;
      if (id === 'bullseye_5') return p.totalBullseyes >= 5;
      if (id === 'bullseye_10') return p.totalBullseyes >= 10;
      if (id === 'level_2') return p.highestLevel >= 2;
      if (id === 'level_5') return p.highestLevel >= 5;
      if (id === 'level_10') return p.highestLevel >= 10;
      if (id === 'wind_clear') return p.bestWindScore >= 80;
      if (id === 'no_miss') return p.flawlessRounds >= 1;
      if (id === 'weapon_5') return (p.upgrades?.weapon || 0) >= 5;
      if (id === 'case_5') return (p.upgrades?.case || 0) >= 5;
      if (id === 'outfit_5') return (p.upgrades?.outfit || 0) >= 5;
      return false;
    };
  }

  function defaultState() {
    return {
      coins: 100, gems: 0, totalGems: 0, xp: 0, level: 1,
      bestScore: 0, totalBullseyes: 0, highestLevel: 1, bestWindScore: 0, flawlessRounds: 0,
      totalPlays: 0, bestStreak: 0,
      upgrades: { weapon: 0, case: 0, outfit: 0 },
      ownedBowStyles: ['classic'],
      ownedArrowEffects: ['normal'],
      ownedTargetThemes: ['classic'],
      activeBowStyle: 'classic',
      activeArrowEffect: 'normal',
      activeTargetTheme: 'classic',
      powerups: { windShield: 2, focus: 2, double: 2 },
      inventory: {},
      achievements: {},
      lastSaveDate: null,
      subscriptions: {},
    };
  }

  let state = null;

  function save() {
    state.lastSaveDate = new Date().toISOString();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        state = { ...defaultState(), ...JSON.parse(raw) };
        if (!state.upgrades) state.upgrades = { weapon: 0, case: 0, outfit: 0 };
        if (!state.inventory) state.inventory = {};
        save(); return true;
      }
    } catch(e) {}
    reset(); return false;
  }
  function reset() { state = defaultState(); save(); }
  function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.2, lvl - 1)); }
  function addXp(amount) {
    if (!state) return;
    state.xp += amount;
    let leveled = false;
    while (state.xp >= xpForLevel(state.level)) { state.xp -= xpForLevel(state.level); state.level++; leveled = true; }
    save(); return leveled;
  }
  function addCoins(amount) { if (!state) return 0; state.coins += amount; save(); return state.coins; }
  function spendCoins(amount) { if (!state || state.coins < amount) return false; state.coins -= amount; save(); return true; }
  function addGems(amount) { if (!state) return 0; state.gems += amount; state.totalGems += amount; save(); return state.gems; }
  function spendGems(amount) { if (!state || state.gems < amount) return false; state.gems -= amount; save(); return true; }

  function getUpgradeCost(category, currentLevel) {
    const tier = UPGRADE_TIERS[category];
    if (!tier) return null;
    const lvlData = tier.levels.find(l => l.level === currentLevel + 1);
    if (!lvlData) return null;
    return { coins: lvlData.coinsReq, gems: lvlData.gemReq };
  }
  function upgradeItem(category, useGems) {
    if (!state) return { success: false, reason: 'no_state' };
    const tier = UPGRADE_TIERS[category];
    const current = state.upgrades[category] || 0;
    if (current >= tier.maxLevel) return { success: false, reason: 'max_level' };
    const costs = getUpgradeCost(category, current);
    if (!costs) return { success: false, reason: 'no_level_data' };
    if (useGems) { if (state.gems < costs.gems) return { success: false, reason: 'not_enough_gems' }; spendGems(costs.gems); }
    else { if (state.coins < costs.coins) return { success: false, reason: 'not_enough_coins' }; spendCoins(costs.coins); }
    state.upgrades[category]++; save(); return { success: true, newLevel: state.upgrades[category] };
  }

  function getActiveBonuses() {
    if (!state) return { accuracy: 0, scoreMult: 1, windResist: 0, aimGuide: 0, extraArrows: 0, roundBonus: 0 };
    const b = { accuracy: 0, scoreMult: 1, windResist: 0, aimGuide: 0, extraArrows: 0, roundBonus: 0 };
    const w = state.upgrades.weapon || 0; const wd = UPGRADE_TIERS.weapon.levels[w];
    if (wd) { b.accuracy = wd.bonus.accuracy; b.scoreMult = wd.bonus.scoreMult; }
    const c = state.upgrades.case || 0; const cd = UPGRADE_TIERS.case.levels[c];
    if (cd) { b.windResist = cd.bonus.windResist; b.aimGuide = cd.bonus.aimGuide; }
    const o = state.upgrades.outfit || 0; const od = UPGRADE_TIERS.outfit.levels[o];
    if (od) { b.extraArrows = od.bonus.extraArrows; b.roundBonus = od.bonus.roundBonus; }
    return b;
  }

  function checkAchievements() {
    if (!state) return [];
    const unlocked = [];
    for (const ach of ACHIEVEMENTS) {
      if (state.achievements[ach.id]) continue;
      if (ach.check(state)) { state.achievements[ach.id] = true; addCoins(ach.reward.coins); if (ach.reward.gems) addGems(ach.reward.gems); unlocked.push(ach); }
    }
    if (unlocked.length > 0) save();
    return unlocked;
  }

  function claimDailyBonus() {
    if (!state) return null;
    const now = new Date(), today = now.toDateString();
    try {
      const last = localStorage.getItem(DAILY_KEY);
      if (last === today) return null;
      const yest = new Date(now); yest.setDate(yest.getDate() - 1);
      let streak = last === yest.toDateString() ? (state.dailyStreak || 0) + 1 : 1;
      state.dailyStreak = streak;
      if (streak > state.bestStreak) state.bestStreak = streak;
      const coins = Math.min(100 + (streak - 1) * 20, 1000);
      const gems = streak >= 7 ? 5 : streak >= 3 ? 2 : 0;
      addCoins(coins); if (gems) addGems(gems);
      localStorage.setItem(DAILY_KEY, today); save();
      return { streak, coins, gems };
    } catch(e) { return null; }
  }

  function endOfGame(result) {
    if (!state) return;
    state.totalPlays++;
    if (result.score > state.bestScore) state.bestScore = result.score;
    if (result.bullseyes > 0) state.totalBullseyes += result.bullseyes;
    if (result.level > state.highestLevel) state.highestLevel = result.level;
    if (result.windScore > state.bestWindScore) state.bestWindScore = result.windScore;
    if (result.flawless) state.flawlessRounds++;
    const xpGain = Math.floor(result.score * 2) + result.bullseyes * 10 + 20;
    addXp(xpGain);
    const coinGain = Math.floor(result.score * 1.5) + result.bullseyes * 5 + 5;
    addCoins(coinGain);
    save();
  }

  function purchasePremiumItem(itemId) {
    if (!state) return false;
    if (itemId === 'remove_ads') {
      state.adFree = true;
      if (!state.inventory) state.inventory = {};
      state.inventory.remove_ads = true;
      save();
      if (window.AdsManager && typeof AdsManager.onAdsRemoved === 'function') {
        AdsManager.onAdsRemoved();
      }
      return true;
    }
    return false;
  }

  window.ProgressionSystem = {
    load, save, reset, addCoins, spendCoins, addGems, spendGems, addXp, xpForLevel,
    upgradeItem, getUpgradeCost, getActiveBonuses, getUpgradeTiers, UPGRADE_TIERS,
    getCatalog, CATALOG, getAchievements, ACHIEVEMENTS,
    checkAchievements, endOfGame, claimDailyBonus, purchasePremiumItem, getState, defaultState,
    getCoinBalance: () => state ? state.coins : 0,
    getGemBalance: () => state ? state.gems : 0,
  };
})();
