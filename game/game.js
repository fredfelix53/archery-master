function showToast(msg) {
  var el = document.getElementById('system-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'system-toast';
    el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#fff;padding:12px 24px;border-radius:14px;font-size:15px;z-index:9999;text-align:center;opacity:0;transition:opacity 0.3s;pointer-events:none;max-width:80%;border:1px solid rgba(255,255,255,0.1);';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(function() { el.style.opacity = '0'; }, 3000);
}

/* ===== Archery Master — Game Engine ===== */
(function() {
  'use strict';

  let canvas, ctx;
  let gameActive = false;
  let gameOver = false;
  let round = 1;
  let level = 1;
  let arrowsLeft = 10;
  let arrowsPerRound = 10;
  let roundScore = 0;
  let totalScore = 0;
  let bullseyes = 0;
  let shotsFired = 0;
  let windStrength = 0;
  let targetX = 0;
  let targetY = 0;
  let targetRadius = 60;
  let arrow = null;
  let isAiming = false;
  let aimAngle = -45;
  let aimPower = 0.5;
  let dragStartX = 0;
  let dragStartY = 0;
  let floatingTexts = [];
  let particles = null;
  let animationId = null;

  const CANVAS_W = 400;
  const CANVAS_H = 500;
  const BOW_X = 60;
  const BOW_Y = 420;

  function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    loadProgression();
    startLevel(1);
  }

  function loadProgression() {
    if (window.ProgressionSystem) {
      ProgressionSystem.load();


  // ─── Framework Modules Init ───────────────────
  if (window.StoreRotator) StoreRotator.init();
  if (window.RetentionSystem) RetentionSystem.init();
  if (window.AdsManager) AdsManager.init();
  if (window.ChallengesSystem) ChallengesSystem.init();
  if (window.CollectiblesSystem) CollectiblesSystem.init();
  if (window.TutorialSystem) {
    TutorialSystem.init({ gameTitle: 'Game' });
    if (TutorialSystem.shouldShow()) {
      setTimeout(() => TutorialSystem.start(function() {
        if (window.showToast) showToast('Tutorial complete! Good luck!');
      }), 500);
    }
  }
  // ─── End Framework Init ───────────────────────
      updateHUD();
    }
  }

  function startLevel(lvl) {
    level = lvl;
    round = 1;
    totalScore = 0;
    bullseyes = 0;
    arrowsLeft = 10;
    arrow = null;
    gameActive = true;
    gameOver = false;
    floatingTexts = [];
    particles = new window.ParticleSystem();

    const bonuses = window.ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
    arrowsLeft += bonuses.extraArrows || 0;
    arrowsPerRound = arrowsLeft;
    targetRadius = Math.max(35, 60 - level * 2);
    roundScore = 0;

    spawnTarget();
    generateWind();
    document.getElementById('game-over-overlay')?.classList.remove('visible');
    updateUI();
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
  }

  function spawnTarget() {
    const dist = 150 + level * 15;
    targetX = CANVAS_W - 100 + Math.random() * 60;
    targetY = 100 + Math.random() * (200 - level * 10);
  }

  function generateWind() {
    windStrength = (Math.random() - 0.5) * (2 + level * 0.5);
    const bonuses = window.ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
    windStrength *= (1 - (bonuses.windResist || 0));
  }

  function getScoreForHit(hitX, hitY) {
    const dx = hitX - targetX;
    const dy = hitY - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < targetRadius * 0.1) return 10; // bullseye
    if (dist < targetRadius * 0.3) return 8;
    if (dist < targetRadius * 0.5) return 5;
    if (dist < targetRadius * 0.7) return 3;
    if (dist < targetRadius * 0.9) return 2;
    if (dist < targetRadius * 1.2) return 1;
    return 0; // miss
  }

  // ─── Aiming ────────────────────────────────────────
  function startAim(clientX, clientY) {
    if (!gameActive || gameOver || arrow || arrowsLeft <= 0) return;
    isAiming = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    dragStartX = (clientX - rect.left) * scaleX;
    dragStartY = (clientY - rect.top) * scaleY;
  }

  function moveAim(clientX, clientY) {
    if (!isAiming) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (clientX - rect.left) * scaleX;
    const my = (clientY - rect.top) * scaleY;

    const dx = mx - BOW_X;
    const dy = my - BOW_Y;
    aimAngle = Math.atan2(-dy, dx) * (180 / Math.PI);
    aimAngle = Math.max(-80, Math.min(-5, aimAngle));
    const dist = Math.sqrt(dx * dx + dy * dy);
    aimPower = Math.min(1, dist / 300);
  }

  function releaseAim() {
    if (!isAiming || !gameActive || gameOver || arrowsLeft <= 0) return;
    isAiming = false;

    const bonuses = window.ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
    const accuracyBonus = bonuses.accuracy || 0;

    // Add slight random inaccuracy based on distance and level
    const inaccuracy = (Math.random() - 0.5) * (5 - accuracyBonus * 10) * (1 + level * 0.1);
    const finalAngle = aimAngle + inaccuracy;

    const speed = 8 + aimPower * 6;
    arrow = {
      x: BOW_X,
      y: BOW_Y,
      vx: Math.cos(finalAngle * Math.PI / 180) * speed,
      vy: -Math.sin(finalAngle * Math.PI / 180) * speed,
      angle: finalAngle,
      flying: true,
      trail: [],
    };

    arrowsLeft--;
  }

  // ─── Arrow Physics ─────────────────────────────────
  function updateArrow() {
    if (!arrow || !arrow.flying) return;

    const GRAVITY = 0.08;
    arrow.vx += windStrength * 0.02;
    arrow.vy += GRAVITY;
    arrow.x += arrow.vx;
    arrow.y += arrow.vy;

    arrow.trail.push({ x: arrow.x, y: arrow.y });
    if (arrow.trail.length > 20) arrow.trail.shift();

    // Check if arrow went off screen or hit target
    if (arrow.x > CANVAS_W || arrow.x < 0 || arrow.y > CANVAS_H || arrow.y < -50) {
      arrow.flying = false;
      arrow = null;
      if (arrowsLeft <= 0) {
        endRound();
      } else {
        generateWind();
      }
      updateUI();
      return;
    }

    // Check target hit
    const dx = arrow.x - targetX;
    const dy = arrow.y - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < targetRadius * 1.2) {
      arrow.flying = false;
      const score = getScoreForHit(arrow.x, arrow.y);
      if (score > 0) {
        const bonuses = window.ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
        const finalScore = Math.floor(score * (bonuses.scoreMult || 1));
        roundScore += finalScore;
        totalScore += finalScore;
        if (score >= 10) bullseyes++;
        if (particles) particles.emit(arrow.x, arrow.y, score >= 10 ? '#ffd700' : '#00ff88', 15);
        floatingTexts.push(new window.FloatingText(arrow.x, arrow.y - 20, `+${finalScore}`, score >= 10 ? '#ffd700' : '#4cd137', 24));
        if (score >= 10) {
          floatingTexts.push(new window.FloatingText(arrow.x, arrow.y - 45, '🎯 BULLSEYE!', '#ffd700', 18));
        }
      } else {
        floatingTexts.push(new window.FloatingText(arrow.x, arrow.y - 20, 'MISS!', '#ff4444', 18));
      }
      // Reset after brief pause
      setTimeout(() => {
        arrow = null;
        if (arrowsLeft > 0) {
          generateWind();
          updateUI();
        } else {
          endRound();
        }
      }, 600);
      updateUI();
    }
  }

  // ─── Round & Level Management ──────────────────────
  function endRound() {
    if (round >= 3) {
      // Level complete
      gameActive = false;
      showLevelComplete();
    } else {
      round++;
      arrowsLeft = arrowsPerRound;
      arrow = null;
      spawnTarget();
      generateWind();
      updateUI();
      showNotification(`Round ${round}/3`);
    }
  }

  function showLevelComplete() {
    document.getElementById('level-overlay').classList.add('visible');
    document.getElementById('level-score').textContent = totalScore;
    document.getElementById('level-number').textContent = level;
    const nextBtn = document.getElementById('next-level-btn');
    if (totalScore >= 30 + level * 5) {
      nextBtn.style.display = 'inline-flex';
      document.getElementById('level-result').textContent = '⭐ PASSED! ⭐';
    } else {
      nextBtn.style.display = 'none';
      document.getElementById('level-result').textContent = 'Try again! Need ' + (30 + level * 5) + ' pts';
    }

    // End of game for progression
    if (window.ProgressionSystem) {
      ProgressionSystem.endOfGame({
        score: totalScore,
        bullseyes,
        level,
        windScore: totalScore,
        flawless: false,
      });
      const unlocked = ProgressionSystem.checkAchievements();

  // ─── Framework Module Hooks ───────────────────
  if (window.RetentionSystem) {
    RetentionSystem.onGameEnd(score);
    RetentionSystem.submitScore('Player', score);
  }
  if (window.ChallengesSystem) {
    ChallengesSystem.reportProgress('score', score);
    ChallengesSystem.reportProgress('games', 1);
  }
  if (window.CollectiblesSystem) {
    CollectiblesSystem.incrementTracker('totalGames');
    CollectiblesSystem.setTracker('highestScore', score);
    CollectiblesSystem.checkUnlocks();
  }
  if (window.AdsManager) {
    setTimeout(function() { AdsManager.tryShowInterstitial(); }, 2000);
  }
  // ─── End Framework Hooks ─────────────────────
      if (unlocked.length > 0) setTimeout(() => showAchievementPopup(unlocked), 800);
      setTimeout(() => checkDailyBonus(), 1200);
    }
    if (particles) setTimeout(() => particles.emitLevelUp(), 400);
  }

  function showGameOver() {
    // Used when player fails a level
  }

  // ─── Render ────────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Sky background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    skyGrad.addColorStop(0, '#0a1628');
    skyGrad.addColorStop(0.5, '#1a2a4a');
    skyGrad.addColorStop(1, '#2a3a2a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Ground
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, CANVAS_H - 60, CANVAS_W, 60);
    ctx.fillStyle = '#2a4a2a';
    ctx.fillRect(0, CANVAS_H - 60, CANVAS_W, 4);

    // Wind indicator
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    let windDir = windStrength > 0 ? '→' : '←';
    let windColor = Math.abs(windStrength) > 2 ? '#ff6b6b' : Math.abs(windStrength) > 1 ? '#ffd93d' : '#6bcbff';
    ctx.fillStyle = windColor;
    ctx.fillText(`${windDir} Wind: ${Math.abs(windStrength).toFixed(1)}`, 10, 24);

    // Target
    drawTarget(ctx, targetX, targetY, targetRadius);

    // Aiming line
    if (isAiming) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const len = 150 + aimPower * 100;
      ctx.beginPath();
      ctx.moveTo(BOW_X, BOW_Y);
      ctx.lineTo(BOW_X + Math.cos(aimAngle * Math.PI / 180) * len, BOW_Y - Math.sin(aimAngle * Math.PI / 180) * len);
      ctx.stroke();
      ctx.restore();

      // Power indicator
      ctx.fillStyle = `hsl(${120 - aimPower * 120}, 100%, 50%)`;
      ctx.fillRect(10, CANVAS_H - 40, aimPower * 120, 10);
    }

    // Bow
    drawBow(ctx, BOW_X, BOW_Y, aimAngle);

    // Arrow
    if (arrow) {
      drawArrow(ctx, arrow);

      // Trail
      ctx.save();
      for (let i = 0; i < arrow.trail.length; i++) {
        const alpha = i / arrow.trail.length * 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(arrow.trail[i].x, arrow.trail[i].y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Shots left
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Arrows: ${'🏹'.repeat(Math.max(0, arrowsLeft))}`, CANVAS_W - 10, 24);

    // Particles
    if (particles) {
      particles.update();
      particles.draw(ctx);
    }

    // Floating texts
    floatingTexts = floatingTexts.filter(ft => ft.update());
    for (const ft of floatingTexts) ft.draw(ctx);
  }

  function drawTarget(ctx, x, y, r) {
    const rings = [
      { radius: r * 0.1, color: '#ffd700', score: 10 }, // bullseye
      { radius: r * 0.3, color: '#ff4444', score: 8 },
      { radius: r * 0.5, color: '#ffffff', score: 5 },
      { radius: r * 0.7, color: '#ff4444', score: 3 },
      { radius: r * 0.9, color: '#ffffff', score: 2 },
      { radius: r * 1.0, color: '#333333', score: 1 },
    ];

    for (const ring of rings) {
      ctx.save();
      ctx.shadowColor = ring.color;
      ctx.shadowBlur = ring.radius === r * 0.1 ? 15 : 3;
      ctx.beginPath();
      ctx.arc(x, y, ring.radius, 0, Math.PI * 2);
      ctx.fillStyle = ring.color;
      ctx.fill();
      ctx.restore();
    }

    // Crosshair
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.15);
    ctx.lineTo(x, y + r * 0.15);
    ctx.moveTo(x - r * 0.15, y);
    ctx.lineTo(x + r * 0.15, y);
    ctx.stroke();

    // Score label at center
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10', x, y);
  }

  function drawBow(ctx, bx, by, angle) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle * Math.PI / 180);

    // Bow arc
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 40, -0.8, 0.8);
    ctx.stroke();

    // String
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(40 * Math.cos(0.8), 40 * Math.sin(0.8));
    ctx.moveTo(0, 0);
    ctx.lineTo(40 * Math.cos(-0.8), 40 * Math.sin(-0.8));
    ctx.stroke();

    // Bow handle
    ctx.fillStyle = '#6B3410';
    ctx.fillRect(-4, -6, 8, 12);

    ctx.restore();
  }

  function drawArrow(ctx, arr) {
    ctx.save();
    ctx.translate(arr.x, arr.y);
    ctx.rotate(Math.atan2(arr.vy, arr.vx) + Math.PI / 2);

    // Arrow effect trail
    const st = window.ProgressionSystem ? ProgressionSystem.getState() : {};
    const effect = st.activeArrowEffect || 'normal';
    const colors = { normal: '#ffd700', fire: '#ff4500', ice: '#00bfff', lightning: '#ffff00', ghost: 'rgba(200,200,255,0.5)' };
    const color = colors[effect] || '#ffd700';

    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Arrowhead
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-4, -8);
    ctx.lineTo(4, -8);
    ctx.closePath();
    ctx.fill();

    // Fletching
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-5, 16);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(5, 16);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ─── Game Loop ─────────────────────────────────────
  function gameLoop() {
    if (!gameActive && gameOver) return;
    if (arrow && arrow.flying) updateArrow();
    render();
    animationId = requestAnimationFrame(gameLoop);
  }

  // ─── UI ────────────────────────────────────────────
  function updateUI() {
    document.getElementById('score-value').textContent = totalScore;
    document.getElementById('round-display').textContent = `Round ${round}/3`;
    document.getElementById('arrows-display').textContent = '🏹 '.repeat(Math.max(0, arrowsLeft));
    document.getElementById('level-display').textContent = `Lv.${level}`;
  }

  function updateHUD() {
    if (!window.ProgressionSystem) return;
    const st = ProgressionSystem.getState();
    const c = document.getElementById('hud-coins');
    const g = document.getElementById('hud-gems');
    const l = document.getElementById('hud-level');
    if (c) c.textContent = st.coins;
    if (g) g.textContent = st.gems;
    if (l) l.textContent = st.level;
  }

  function showAchievementPopup(achievements) {
    achievements.forEach((ach, i) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'achievement-popup show';
        div.innerHTML = `<div class="ach-icon">${ach.icon}</div><div class="ach-title">🏅 Unlocked!</div><div class="ach-name">${ach.name}</div><div class="ach-desc">${ach.desc}</div><div class="ach-reward">+${ach.reward.coins} 🪙${ach.reward.gems ? ' +'+ach.reward.gems+' 💎' : ''}</div>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
      }, i * 700);
    });
  }

  function checkDailyBonus() {
    if (!window.ProgressionSystem) return;
    const r = ProgressionSystem.claimDailyBonus();
    if (!r) return;
    const d = document.createElement('div');
    d.className = 'daily-bonus-popup show';
    d.innerHTML = `<h3>📅 Daily Bonus!</h3><div class="streak-fire">${'🔥'.repeat(Math.min(r.streak,7))}</div><div class="reward-row">🪙 +${r.coins}${r.gems ? ' 💎 +'+r.gems : ''}</div><div>Day ${r.streak}</div><button class="game-btn btn-primary" style="margin-top:10px" onclick="this.closest('.daily-bonus-popup').remove()">OK</button>`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 5000);
  }

  function showAchievementsList() {
    if (!window.ProgressionSystem) return;
    const st = ProgressionSystem.getState();
    const achievements = ProgressionSystem.getAchievements();
    const unlocked = Object.keys(st.achievements).length;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal-box" style="min-width:300px;"><h3 style="text-align:center;color:var(--accent-gold);">🏆 Achievements</h3><div style="text-align:center;font-size:14px;color:var(--text-secondary);margin:8px 0;">${unlocked}/${achievements.length}</div><div style="max-height:400px;overflow-y:auto;">${achievements.map(a => {
      const done = !!st.achievements[a.id];
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${done ? 'rgba(76,209,55,0.05)' : 'transparent'};border-radius:8px;margin-bottom:4px;">
        <span style="font-size:20px;">${done ? a.icon : '🔒'}</span>
        <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${a.name}</div><div style="font-size:11px;color:var(--text-secondary);">${a.desc}</div></div>
        ${done ? '✅' : `<span style="font-size:11px;color:var(--accent-gold);">🪙${a.reward.coins}${a.reward.gems ? ' 💎'+a.reward.gems : ''}</span>`}
      </div>`;
    }).join('')}</div><button class="game-btn btn-restart" style="margin:10px auto 0;display:block;" onclick="this.closest('.modal-overlay').remove()">Close</button></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }

  function showNotification(msg) {
    const el = document.getElementById('notification') || (() => { const n = document.createElement('div'); n.id = 'notification'; document.body.appendChild(n); return n; })();
    el.textContent = msg; el.className = 'show';
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.className = '', 2500);
  }

  // ─── Controls ─────────────────────────────────────
  function initControls() {
    canvas.addEventListener('mousedown', (e) => startAim(e.clientX, e.clientY));
    canvas.addEventListener('mousemove', (e) => moveAim(e.clientX, e.clientY));
    canvas.addEventListener('mouseup', () => releaseAim());

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      startAim(t.clientX, t.clientY);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      moveAim(t.clientX, t.clientY);
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      releaseAim();
    }, { passive: false });
  }

  // ─── Boot ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('restart-btn')?.addEventListener('click', () => startLevel(1));
    document.getElementById('restart-btn2')?.addEventListener('click', () => startLevel(1));
    document.getElementById('next-level-btn')?.addEventListener('click', () => {
      document.getElementById('level-overlay').classList.remove('visible');
      startLevel(level + 1);
    });
    document.getElementById('shop-btn')?.addEventListener('click', () => { if (window.ShopUI) ShopUI.open(); });
    document.getElementById('button-shop')?.addEventListener('click', () => { if (window.ShopUI) ShopUI.open(); });
    document.getElementById('button-ach')?.addEventListener('click', showAchievementsList);
    document.getElementById('button-upgrade')?.addEventListener('click', () => { if (window.ShopUI) { ShopUI.open(); ShopUI.showTab('upgrades'); } });
    initControls();
    setInterval(() => { if (window.ProgressionSystem) updateHUD(); }, 3000);
    init();
  });
})();
