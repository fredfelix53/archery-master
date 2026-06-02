/* ===== Archery Master — Shop & IAP ===== */
(function() {
  'use strict';

  let shopContainer = null;
  let activeTab = 'coins';

  function fmtPrice(p) { return '€' + p.toFixed(2); }

  function createShopPanel() {
    if (shopContainer) { shopContainer.style.display = 'block'; showTab(activeTab); return; }
    shopContainer = document.createElement('div');
    shopContainer.id = 'shop-panel';
    shopContainer.innerHTML = `
      <div class="shop-overlay"></div>
      <div class="shop-window">
        <button class="shop-close">&times;</button>
        <h2 class="shop-title">🏹 Archery Shop</h2>
        <div class="shop-balance-bar">
          <span class="balance-item"><span class="coin-icon">🪙</span> <span id="shop-coins">0</span></span>
          <span class="balance-item"><span class="gem-icon">💎</span> <span id="shop-gems">0</span></span>
        </div>
        <div class="shop-tabs">
          <button class="shop-tab" data-tab="coins">🛒 Shop</button>
          <button class="shop-tab" data-tab="upgrades">⚡ Upgrades</button>
          <button class="shop-tab" data-tab="premium">👑 Premium</button>
        </div>
        <div class="shop-content" id="shop-content"></div>
      </div>
    `;
    document.body.appendChild(shopContainer);
    shopContainer.querySelector('.shop-close').addEventListener('click', closeShop);
    shopContainer.querySelector('.shop-overlay').addEventListener('click', closeShop);
    shopContainer.querySelectorAll('.shop-tab').forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
    showTab('upgrades');
    updateBalances();
  }
  function closeShop() { if (shopContainer) shopContainer.style.display = 'none'; }
  function showTab(tabId) {
    activeTab = tabId;
    if (!shopContainer) return;
    shopContainer.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    const c = shopContainer.querySelector('#shop-content');
    if (tabId === 'coins') renderCoinShop(c);
    else if (tabId === 'upgrades') renderUpgradeStation(c);
    else if (tabId === 'premium') renderPremiumShop(c);
    updateBalances();
  }
  function updateBalances() {
    const c = shopContainer?.querySelector('#shop-coins');
    const g = shopContainer?.querySelector('#shop-gems');
    if (c) c.textContent = ProgressionSystem.getCoinBalance();
    if (g) g.textContent = ProgressionSystem.getGemBalance();
  }

  function renderCoinShop(container) {
    const cat = ProgressionSystem.getCatalog();
    const st = ProgressionSystem.getState();
    let html = '<div class="shop-section"><h3>🏹 Bow Styles</h3><div class="shop-grid">';
    for (const b of cat.bowStyles) {
      const owned = st.ownedBowStyles.includes(b.id);
      const active = st.activeBowStyle === b.id;
      html += `<div class="shop-item ${owned ? 'owned' : ''} ${active ? 'active' : ''}" data-type="bowStyle" data-id="${b.id}" data-price="${b.price}">
        <div class="item-name">${b.name}</div><div class="item-desc">${b.desc}</div>
        ${owned ? (active ? '<span class="item-status">✓ Active</span>' : '<button class="btn-equip">Equip</button>') : `<button class="btn-buy">🪙 ${b.price}</button>`}
      </div>`;
    }
    html += '</div></div><div class="shop-section"><h3>➡️ Arrow Effects</h3><div class="shop-grid">';
    for (const a of cat.arrowEffects) {
      const owned = st.ownedArrowEffects.includes(a.id);
      const active = st.activeArrowEffect === a.id;
      html += `<div class="shop-item ${owned ? 'owned' : ''} ${active ? 'active' : ''}" data-type="arrowEffect" data-id="${a.id}" data-price="${a.price}">
        <div class="item-name">${a.name}</div><div class="item-desc">${a.desc}</div>
        ${owned ? (active ? '<span class="item-status">✓ Active</span>' : '<button class="btn-equip">Equip</button>') : `<button class="btn-buy">🪙 ${a.price}</button>`}
      </div>`;
    }
    html += '</div></div><div class="shop-section"><h3>🎯 Target Themes</h3><div class="shop-grid">';
    for (const t of cat.targetThemes) {
      const owned = st.ownedTargetThemes.includes(t.id);
      const active = st.activeTargetTheme === t.id;
      html += `<div class="shop-item ${owned ? 'owned' : ''} ${active ? 'active' : ''}" data-type="targetTheme" data-id="${t.id}" data-price="${t.price}">
        <div class="item-name">${t.name}</div><div class="item-desc">${t.desc}</div>
        ${owned ? (active ? '<span class="item-status">✓ Active</span>' : '<button class="btn-equip">Equip</button>') : `<button class="btn-buy">🪙 ${t.price}</button>`}
      </div>`;
    }
    html += '</div></div>';
    container.innerHTML = html;
    container.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', (e) => { const it = e.target.closest('.shop-item'); handleCoinPurchase(it.dataset.type, it.dataset.id, parseInt(it.dataset.price)); });
    });
    container.querySelectorAll('.btn-equip').forEach(btn => {
      btn.addEventListener('click', (e) => { const it = e.target.closest('.shop-item'); handleEquip(it.dataset.type, it.dataset.id); });
    });
  }

  function handleCoinPurchase(type, id, price) {
    const st = ProgressionSystem.getState();
    const map = { bowStyle: 'ownedBowStyles', arrowEffect: 'ownedArrowEffects', targetTheme: 'ownedTargetThemes' };
    const amap = { bowStyle: 'activeBowStyle', arrowEffect: 'activeArrowEffect', targetTheme: 'activeTargetTheme' };
    if (map[type] && st[map[type]].includes(id)) { handleEquip(type, id); return; }
    if (!ProgressionSystem.spendCoins(price)) { showNotification('Not enough coins!'); return; }
    if (map[type]) { st[map[type]].push(id); st[amap[type]] = id; ProgressionSystem.save(); }
    showNotification('Purchased! ✨');
    showTab('coins');
  }

  function handleEquip(type, id) {
    const st = ProgressionSystem.getState();
    const map = { bowStyle: 'ownedBowStyles', arrowEffect: 'ownedArrowEffects', targetTheme: 'ownedTargetThemes' };
    const amap = { bowStyle: 'activeBowStyle', arrowEffect: 'activeArrowEffect', targetTheme: 'activeTargetTheme' };
    if (!st[map[type]].includes(id)) return;
    st[amap[type]] = id; ProgressionSystem.save(); showTab('coins');
    showNotification(`${type} applied! ✅`);
  }

  function renderUpgradeStation(container) {
    const tiers = ProgressionSystem.getUpgradeTiers();
    const st = ProgressionSystem.getState();
    const b = ProgressionSystem.getActiveBonuses();
    let html = '<div class="shop-section"><h3>⚡ Upgrade Station</h3><p class="shop-subtitle">Permanent archery upgrades</p>';
    html += `<div class="bonus-summary">
      <span>🎯 Accuracy: <strong>+${Math.round(b.accuracy * 100)}%</strong></span>
      <span>💯 Score: <strong>${b.scoreMult.toFixed(2)}x</strong></span>
      <span>💨 Wind Resist: <strong>${Math.round(b.windResist * 100)}%</strong></span>
      <span>🎯 Aim Guide: <strong>+${b.aimGuide}</strong></span>
      <span>➡️ Extra Arrows: <strong>+${b.extraArrows}</span>
    </div>`;
    html += `<div class="upgrade-balance"><span>🪙 ${st.coins.toLocaleString()}</span><span>💎 ${st.gems}</span></div>`;
    for (const [cat, tier] of Object.entries(tiers)) {
      const cl = st.upgrades[cat] || 0;
      const nd = tier.levels[cl + 1];
      const maxed = cl >= tier.maxLevel;
      const costs = maxed ? null : ProgressionSystem.getUpgradeCost(cat, cl);
      html += `<div class="upgrade-card" data-cat="${cat}"><div class="upgrade-header">
        <span class="upgrade-icon">${tier.icon}</span><span class="upgrade-name">${tier.name}</span>
        <span class="upgrade-level">Lv.${cl} → ${cl + 1}</span></div>
        <div class="upgrade-visual"><div class="upgrade-bar"><div class="upgrade-fill" style="width:${(cl/tier.maxLevel)*100}%"></div></div>
        <div class="upgrade-dots">`;
      for (let i = 0; i <= tier.maxLevel; i++) html += `<span class="upgrade-dot ${i <= cl ? 'filled' : ''} ${i === cl+1 ? 'next' : ''}">${i}</span>`;
      html += `</div></div>`;
      if (tier.levels[cl]) html += `<div class="upgrade-current">Current: <strong>${tier.levels[cl].name}</strong></div>`;
      if (nd) html += `<div class="upgrade-next">Next: <strong>${nd.name}</strong></div>`;
      if (maxed) html += `<div class="upgrade-maxed">⭐ MAX LEVEL ⭐</div>`;
      else if (costs) html += `<div class="upgrade-actions">
        <button class="btn-upgrade coin-upgrade ${st.coins >= costs.coins ? '' : 'disabled'}" data-cat="${cat}" data-currency="coins">🪙 ${costs.coins.toLocaleString()}</button>
        <button class="btn-upgrade gem-upgrade ${st.gems >= costs.gems ? '' : 'disabled'}" data-cat="${cat}" data-currency="gems">💎 ${costs.gems}</button>
      </div>`;
      html += `</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll('.btn-upgrade:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.target.closest('.upgrade-card').dataset.cat;
        const curr = btn.dataset.currency;
        const r = ProgressionSystem.upgradeItem(cat, curr === 'gems');
        if (r.success) { showNotification(`⬆️ ${cat} to Lv.${r.newLevel}!`); renderUpgradeStation(container); updateBalances(); }
        else showNotification(`Not enough ${curr}!`);
      });
    });
  }

  function renderPremiumShop(container) {
    const st = ProgressionSystem.getState();
    let html = '<div class="shop-section"><h3>👑 Premium Shop</h3>';
    html += '<h4>🚫 Ads</h4><div class="shop-grid">';
    html += `<div class="shop-item premium-item ${st.adFree ? 'owned' : ''}">
      <div class="item-name">Remove Ads</div>
      <div class="item-desc">Permanently remove all ads</div>
      ${st.adFree ? '<span class="item-status">✓ Purchased</span>' : `<button class="btn-buy premium-btn iap-btn" data-id="remove_ads" data-price="2.99">€2.99</button>`}
    </div></div></div>`;
    container.innerHTML = html;
    container.querySelectorAll('.iap-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('Purchase Remove Ads for €2.99? (Simulated)')) {
          ProgressionSystem.purchasePremiumItem(id);
          showNotification('✅ Purchased!'); renderPremiumShop(container); updateBalances();
        }
      });
    });
  }

  function showNotification(msg) {
    const el = document.getElementById('notification') || (() => { const n = document.createElement('div'); n.id = 'notification'; document.body.appendChild(n); return n; })();
    el.textContent = msg; el.className = 'show';
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.className = '', 2500);
  }

  window.ShopUI = { open: createShopPanel, close: closeShop, showTab, updateBalances };
})();
