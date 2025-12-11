// ゲームの基本設定
let canvas;
let ctx;

// ゲーム状態: 'title', 'playing', 'paused', 'gameover', 'clear'
let gameState = 'title';
let score = 0;
let lives = 3;
let maxLives = 5;
let shield = 0; // シールド値（0-100）
let maxShield = 100;
let level = 1;
let enemiesDefeated = 0; // 倒した敵の数
let itemsCollected = 0; // 集めたアイテムの数
let highScore = 0; // ハイスコア
let bossCount = 0; // ボス敵の残り数（レベル10までに出現するボス数）
let lastTime = 0;

// ハイスコアの読み込み
function loadHighScore() {
    const saved = localStorage.getItem('shootingGameHighScore');
    if (saved) {
        highScore = parseInt(saved, 10);
    }
}

// ハイスコアの保存
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('shootingGameHighScore', highScore.toString());
    }
}
let enemySpawnTimer = 0;
let shootTimer = 0;
let currentBulletType = 'normal';
let bulletCounts = {
    normal: Infinity,
    explosive: 3,
    laser: 2
};

// プレイヤー
const player = {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    speed: 5,
    baseSpeed: 5,
    color: '#00ff00'
};

// パワーアップの状態
const powerups = {
    rapidFire: { active: false, timer: 0, duration: 10000, pausedTime: 0 },
    multiShot: { active: false, timer: 0, duration: 15000, pausedTime: 0 },
    speedBoost: { active: false, timer: 0, duration: 10000, pausedTime: 0 },
    doubleScore: { active: false, timer: 0, duration: 20000, pausedTime: 0 }
};

// 一時停止関連
let pauseStartTime = 0;
let totalPausedTime = 0;

// 弾の配列
let bullets = [];

// 敵の配列
let enemies = [];

// アイテムの配列
let items = [];

// パーティクルの配列
let particles = [];

// 爆発の配列
let explosions = [];

// 演出エフェクト
let screenFlash = { active: false, timer: 0, duration: 50 }; // 画面フラッシュ（50ms = 0.05秒）
let playerBlink = { active: false, timer: 0, duration: 200 }; // プレイヤー点滅（200ms）
let rippleEffects = []; // 波紋エフェクト
let bossWarning = { active: false, timer: 0, duration: 2000, slideProgress: 0 }; // ボス警告テロップ
let bossPortrait = { active: false, timer: 0, duration: 3000, alpha: 0 }; // ボス立ち絵

// キー入力の状態
const keys = {
    left: false,
    right: false,
    space: false,
    '1': false,
    '2': false,
    '3': false
};

// パワーアップの種類
const PowerupType = {
    RAPID_FIRE: { color: '#ff0000', name: '連射速度アップ', emoji: '🔴' },
    MULTI_SHOT: { color: '#0000ff', name: 'マルチショット', emoji: '🔵' },
    SPEED_BOOST: { color: '#00ff00', name: '移動速度アップ', emoji: '🟢' },
    DOUBLE_SCORE: { color: '#ffff00', name: 'スコア2倍', emoji: '🟡' },
    HEALTH: { color: '#ffffff', name: 'ライフ回復', emoji: '⚪' }
};

// 敵の種類
const EnemyType = {
    NORMAL: {
        name: '通常敵',
        size: { min: 25, max: 35 },
        speed: { base: 2, levelMultiplier: 0.5 },
        color: '#ff0000',
        score: 10,
        health: 1,
        shape: 'square'
    },
    FAST: {
        name: '高速敵',
        size: { min: 20, max: 30 },
        speed: { base: 3.5, levelMultiplier: 0.7 },
        color: '#ff6600',
        score: 20,
        health: 1,
        shape: 'triangle'
    },
    MEDIUM: {
        name: '中型敵',
        size: { min: 35, max: 45 },
        speed: { base: 1.5, levelMultiplier: 0.4 },
        color: '#ff00ff',
        score: 30,
        health: 1,
        shape: 'square'
    },
    LARGE: {
        name: '大型敵',
        size: { min: 45, max: 60 },
        speed: { base: 1, levelMultiplier: 0.3 },
        color: '#9900ff',
        score: 50,
        health: 1,
        shape: 'square'
    },
    BOSS: {
        name: 'ボス敵',
        size: { min: 55, max: 70 },
        speed: { base: 0.8, levelMultiplier: 0.2 },
        color: '#cc0000',
        score: 100,
        health: 2,
        shape: 'square'
    }
};

// イベントリスナー
document.addEventListener('keydown', (e) => {
    // ESCキーでポーズ/再開
    if (e.key === 'Escape') {
        e.preventDefault();
        if (gameState === 'playing') {
            gameState = 'paused';
            pauseStartTime = Date.now();
            updateButtonVisibility();
        } else if (gameState === 'paused') {
            if (pauseStartTime > 0) {
                totalPausedTime += Date.now() - pauseStartTime;
                pauseStartTime = 0;
            }
            gameState = 'playing';
            updateButtonVisibility();
        }
        return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ') {
        e.preventDefault();
        keys.space = true;
    }
    if (e.key === '1') {
        currentBulletType = 'normal';
    }
    if (e.key === '2' && bulletCounts.explosive > 0) {
        currentBulletType = 'explosive';
    }
    if (e.key === '3' && bulletCounts.laser > 0) {
        currentBulletType = 'laser';
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === ' ') keys.space = false;
});

// マウスでプレイヤーを動かす（DOMContentLoaded内で設定）
// マウスクリックで弾を撃つ（DOMContentLoaded内で設定）

// パーティクルを生成
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.02,
            size: 2 + Math.random() * 3,
            color: color
        });
    }
}

// 爆発を生成
function createExplosion(x, y, radius) {
    explosions.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: radius,
        life: 1.0,
        decay: 0.05
    });

    // パーティクルも生成
    createParticles(x, y, '#ff6600', 30);
}

// 弾を撃つ
function shoot() {
    const now = Date.now();
    const fireRate = powerups.rapidFire.active ? 100 : 200;
    if (now - shootTimer < fireRate) return;
    shootTimer = now;

    // 弾の種類に応じた制限チェック
    if (currentBulletType === 'explosive' && bulletCounts.explosive <= 0) {
        currentBulletType = 'normal';
    }
    if (currentBulletType === 'laser' && bulletCounts.laser <= 0) {
        currentBulletType = 'normal';
    }

    if (powerups.multiShot.active && currentBulletType === 'normal') {
        // マルチショット: 3方向（通常弾のみ）
        const angles = [-Math.PI / 2, -Math.PI / 2 - 0.3, -Math.PI / 2 + 0.3];
        angles.forEach(angle => {
            bullets.push({
                x: player.x + player.width / 2,
                y: player.y,
                width: 4,
                height: 10,
                speed: 7,
                angle: angle,
                type: 'normal',
                color: '#ffff00'
            });
        });
    } else if (currentBulletType === 'normal') {
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 7,
            angle: -Math.PI / 2,
            type: 'normal',
            color: '#ffff00'
        });
    } else if (currentBulletType === 'explosive' && bulletCounts.explosive > 0) {
        bulletCounts.explosive--;
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y,
            width: 6,
            height: 12,
            speed: 6,
            angle: -Math.PI / 2,
            type: 'explosive',
            color: '#ff6600',
            radius: 50
        });
    } else if (currentBulletType === 'laser' && bulletCounts.laser > 0) {
        bulletCounts.laser--;
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y,
            width: 8,
            height: canvas.height,
            speed: 0,
            type: 'laser',
            color: '#00ffff',
            life: 0.5
        });
    }
}

// 敵を生成
function spawnEnemy() {
    // 敵の種類をランダムに選択（レベルに応じて出現率を調整）
    const enemyTypes = Object.keys(EnemyType);
    let selectedType;

    // レベルに応じて出現率を調整
    const rand = Math.random();
    if (level >= 7 && rand < 0.1) {
        // レベル7以上で10%の確率でボス出現
        selectedType = EnemyType.BOSS;
        // ボス登場演出
        bossWarning.active = true;
        bossWarning.timer = Date.now();
        bossWarning.slideProgress = 0;
        bossPortrait.active = true;
        bossPortrait.timer = Date.now();
        bossPortrait.alpha = 0;
    } else if (level >= 5 && rand < 0.2) {
        // レベル5以上で20%の確率で大型敵出現
        selectedType = EnemyType.LARGE;
    } else if (level >= 3 && rand < 0.3) {
        // レベル3以上で30%の確率で中型敵出現
        selectedType = EnemyType.MEDIUM;
    } else if (rand < 0.4) {
        // 40%の確率で高速敵出現
        selectedType = EnemyType.FAST;
    } else {
        // それ以外は通常敵
        selectedType = EnemyType.NORMAL;
    }

    const sizeRange = selectedType.size;
    const enemySize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
    const speed = selectedType.speed.base + level * selectedType.speed.levelMultiplier;

    enemies.push({
        x: Math.random() * (canvas.width - enemySize),
        y: -enemySize,
        width: enemySize,
        height: enemySize,
        speed: speed,
        color: selectedType.color,
        health: selectedType.health,
        maxHealth: selectedType.health,
        type: selectedType,
        shape: selectedType.shape
    });
}

// アイテムを生成
function spawnItem(x, y) {
    const types = Object.keys(PowerupType);
    const type = PowerupType[types[Math.floor(Math.random() * types.length)]];

    items.push({
        x: x,
        y: y,
        width: 20,
        height: 20,
        speed: 2,
        type: type,
        rotation: 0
    });
}

// 衝突判定
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

// 距離計算
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// パワーアップを適用
function applyPowerup(type) {
    if (type === PowerupType.RAPID_FIRE) {
        powerups.rapidFire.active = true;
        powerups.rapidFire.timer = Date.now();
    } else if (type === PowerupType.MULTI_SHOT) {
        powerups.multiShot.active = true;
        powerups.multiShot.timer = Date.now();
    } else if (type === PowerupType.SPEED_BOOST) {
        powerups.speedBoost.active = true;
        powerups.speedBoost.timer = Date.now();
        player.speed = player.baseSpeed * 1.5;
    } else if (type === PowerupType.DOUBLE_SCORE) {
        powerups.doubleScore.active = true;
        powerups.doubleScore.timer = Date.now();
    } else if (type === PowerupType.HEALTH) {
        lives = Math.min(5, lives + 1);
    }
}

// パワーアップの更新
function updatePowerups() {
    const now = Date.now();
    const adjustedNow = now - totalPausedTime;

    if (powerups.rapidFire.active) {
        const elapsed = adjustedNow - powerups.rapidFire.timer;
        if (elapsed > powerups.rapidFire.duration) {
            powerups.rapidFire.active = false;
        }
    }
    if (powerups.multiShot.active) {
        const elapsed = adjustedNow - powerups.multiShot.timer;
        if (elapsed > powerups.multiShot.duration) {
            powerups.multiShot.active = false;
        }
    }
    if (powerups.speedBoost.active) {
        const elapsed = adjustedNow - powerups.speedBoost.timer;
        if (elapsed > powerups.speedBoost.duration) {
            powerups.speedBoost.active = false;
            player.speed = player.baseSpeed;
        }
    }
    if (powerups.doubleScore.active) {
        const elapsed = adjustedNow - powerups.doubleScore.timer;
        if (elapsed > powerups.doubleScore.duration) {
            powerups.doubleScore.active = false;
        }
    }
}

// ゲームループ
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    if (gameState === 'playing') {
        update(deltaTime);
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// 更新処理
function update(deltaTime) {
    updatePowerups();

    // プレイヤーの移動
    if (keys.left) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (keys.right) {
        player.x = Math.min(canvas.width - player.width, player.x + player.speed);
    }

    // 弾を撃つ
    if (keys.space) {
        shoot();
    }

    // 敵の生成
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer > 2000 - level * 100) {
        enemySpawnTimer = 0;
        spawnEnemy();
    }

    // 弾の更新
    bullets = bullets.filter(bullet => {
        if (bullet.type === 'laser') {
            bullet.life -= 0.02;
            return bullet.life > 0;
        } else {
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            return bullet.y > -bullet.height && bullet.x > -bullet.width && bullet.x < canvas.width + bullet.width;
        }
    });

    // 敵の更新
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;

        // プレイヤーとの衝突
        if (checkCollision(enemy, player)) {
            // 被弾演出：画面フラッシュとプレイヤー点滅
            screenFlash.active = true;
            screenFlash.timer = Date.now();
            playerBlink.active = true;
            playerBlink.timer = Date.now();

            // シールドがある場合はシールドを優先的に減らす
            if (shield > 0) {
                shield = Math.max(0, shield - 30);
            } else {
                lives--;
                if (lives <= 0) {
                    gameState = 'gameover';
                    saveHighScore();
                    updateButtonVisibility();
                }
            }
            createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 15);
            return false;
        }

        // 画面外に出たら削除
        if (enemy.y > canvas.height) {
            return false;
        }

        return true;
    });

    // アイテムの更新
    items = items.filter(item => {
        item.y += item.speed;
        item.rotation += 0.1;

        // プレイヤーとの衝突
        if (checkCollision(item, player)) {
            itemsCollected++;
            applyPowerup(item.type);
            return false;
        }

        // 画面外に出たら削除
        if (item.y > canvas.height) {
            return false;
        }

        return true;
    });

    // 弾と敵の衝突判定（逆順ループでspliceの問題を回避）
    for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        const bullet = bullets[bulletIndex];
        let bulletHit = false;

        if (bullet.type === 'laser') {
            // レーザーは全敵に当たる（逆順ループで処理）
            for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
                const enemy = enemies[enemyIndex];
                if (enemy.x + enemy.width / 2 >= bullet.x - bullet.width / 2 &&
                    enemy.x + enemy.width / 2 <= bullet.x + bullet.width / 2 &&
                    enemy.y < bullet.y + bullet.height) {
                    const baseScore = enemy.type ? enemy.type.score : 10;
                    const finalScore = powerups.doubleScore.active ? baseScore * 2 : baseScore;
                    score += finalScore;
                    enemy.health--;
                    if (enemy.health <= 0) {
                        enemiesDefeated++;
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 20);
                        // アイテムをドロップ（30%の確率、ボス敵は50%）
                        const dropRate = enemy.type === EnemyType.BOSS ? 0.5 : 0.3;
                        if (Math.random() < dropRate) {
                            spawnItem(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        }
                        enemies.splice(enemyIndex, 1);
                        // ボス敵を倒した場合はカウントを増やす
                        if (enemy.type === EnemyType.BOSS) {
                            bossCount++;
                        }
                        if (score > 0 && score % 500 === 0) {
                            level++;
                            // 特殊弾を補充
                            bulletCounts.explosive = Math.min(5, bulletCounts.explosive + 1);
                            bulletCounts.laser = Math.min(3, bulletCounts.laser + 1);
                            // クリア条件: レベル10到達
                            if (level >= 10) {
                                gameState = 'clear';
                                saveHighScore();
                                updateButtonVisibility();
                            }
                        }
                    }
                }
            }
        } else {
            // 通常弾・爆発弾の処理
            for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
                const enemy = enemies[enemyIndex];
                if (checkCollision(bullet, enemy)) {
                    const baseScore = enemy.type ? enemy.type.score : 10;
                    const finalScore = powerups.doubleScore.active ? baseScore * 2 : baseScore;
                    score += finalScore;
                    bulletHit = true;
                    enemy.health--;

                    if (bullet.type === 'explosive') {
                        // 爆発弾の処理
                        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, bullet.radius);
                        // 波紋エフェクトを追加
                        createRippleEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

                        // 範囲内の敵もダメージ（逆順ループで処理）
                        for (let otherIndex = enemies.length - 1; otherIndex >= 0; otherIndex--) {
                            if (otherIndex !== enemyIndex) {
                                const otherEnemy = enemies[otherIndex];
                                const dist = distance(
                                    enemy.x + enemy.width / 2,
                                    enemy.y + enemy.height / 2,
                                    otherEnemy.x + otherEnemy.width / 2,
                                    otherEnemy.y + otherEnemy.height / 2
                                );
                                if (dist < bullet.radius) {
                                    otherEnemy.health--;
                                    if (otherEnemy.health <= 0) {
                                        enemiesDefeated++;
                                        createParticles(otherEnemy.x + otherEnemy.width / 2, otherEnemy.y + otherEnemy.height / 2, otherEnemy.color, 15);
                                        const otherBaseScore = otherEnemy.type ? otherEnemy.type.score : 10;
                                        const otherFinalScore = powerups.doubleScore.active ? otherBaseScore * 2 : otherBaseScore;
                                        score += otherFinalScore;
                                        enemies.splice(otherIndex, 1);
                                        // インデックスを調整（削除した要素より前のインデックスを調整）
                                        if (otherIndex < enemyIndex) {
                                            enemyIndex--;
                                        }
                                        // アイテムをドロップ（30%の確率、ボス敵は50%）
                                        const dropRate = otherEnemy.type === EnemyType.BOSS ? 0.5 : 0.3;
                                        if (Math.random() < dropRate) {
                                            spawnItem(otherEnemy.x + otherEnemy.width / 2, otherEnemy.y + otherEnemy.height / 2);
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 10);
                    }

                    if (enemy.health <= 0) {
                        enemiesDefeated++;
                        // アイテムをドロップ（30%の確率、ボス敵は50%）
                        const dropRate = enemy.type === EnemyType.BOSS ? 0.5 : 0.3;
                        if (Math.random() < dropRate) {
                            spawnItem(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        }
                        enemies.splice(enemyIndex, 1);
                        if (score > 0 && score % 500 === 0) {
                            level++;
                            bulletCounts.explosive = Math.min(5, bulletCounts.explosive + 1);
                            bulletCounts.laser = Math.min(3, bulletCounts.laser + 1);
                            // クリア条件: レベル10到達
                            if (level >= 10) {
                                gameState = 'clear';
                                updateButtonVisibility();
                            }
                        }
                    }
                    break; // 1つの弾は1つの敵にしか当たらない（爆発弾は範囲内の敵も処理済み）
                }
            }

            if (bulletHit) {
                bullets.splice(bulletIndex, 1);
            }
        }
    }

    // パーティクルの更新
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= particle.decay;
        particle.vy += 0.1; // 重力
        return particle.life > 0;
    });

    // 爆発の更新
    explosions = explosions.filter(explosion => {
        explosion.radius += 5;
        explosion.life -= explosion.decay;
        return explosion.life > 0 && explosion.radius < explosion.maxRadius;
    });

    // 演出エフェクトの更新
    updateEffects();
}

// 演出エフェクトの更新
function updateEffects() {
    const now = Date.now();

    // 画面フラッシュの更新
    if (screenFlash.active) {
        if (now - screenFlash.timer > screenFlash.duration) {
            screenFlash.active = false;
        }
    }

    // プレイヤー点滅の更新
    if (playerBlink.active) {
        if (now - playerBlink.timer > playerBlink.duration) {
            playerBlink.active = false;
        }
    }

    // 波紋エフェクトの更新
    rippleEffects = rippleEffects.filter(ripple => {
        ripple.radius += 3;
        ripple.alpha -= 0.02;
        return ripple.alpha > 0 && ripple.radius < Math.max(canvas.width, canvas.height) * 1.5;
    });

    // ボス警告テロップの更新
    if (bossWarning.active) {
        const elapsed = now - bossWarning.timer;
        if (elapsed < bossWarning.duration) {
            // スライドイン（最初の500ms）
            if (elapsed < 500) {
                bossWarning.slideProgress = elapsed / 500;
            } else if (elapsed < 1500) {
                bossWarning.slideProgress = 1;
            } else {
                // スライドアウト（最後の500ms）
                bossWarning.slideProgress = 1 - (elapsed - 1500) / 500;
            }
        } else {
            bossWarning.active = false;
        }
    }

    // ボス立ち絵の更新
    if (bossPortrait.active) {
        const elapsed = now - bossPortrait.timer;
        if (elapsed < 1000) {
            // フェードイン（最初の1秒）
            bossPortrait.alpha = elapsed / 1000;
        } else if (elapsed < 2000) {
            // 表示（1秒間）
            bossPortrait.alpha = 1;
        } else if (elapsed < 3000) {
            // フェードアウト（最後の1秒）
            bossPortrait.alpha = 1 - (elapsed - 2000) / 1000;
        } else {
            bossPortrait.active = false;
        }
    }
}

// 波紋エフェクトを生成
function createRippleEffect(x, y) {
    rippleEffects.push({
        x: x,
        y: y,
        radius: 0,
        alpha: 1.0
    });
}

// 描画処理
function draw() {
    if (!canvas || !ctx) return; // canvasとctxが初期化されていない場合は何もしない

    try {
        // 背景をクリア
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 星の背景
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % canvas.width;
            const y = (i * 53 + Date.now() * 0.01) % canvas.height;
            ctx.fillRect(x, y, 2, 2);
        }

        // フォントサイズをCanvasサイズに応じて調整
        const baseFontSize = Math.max(20, canvas.width / 25);
        const titleFontSize = Math.max(36, canvas.width / 12);
        const subtitleFontSize = Math.max(16, canvas.width / 30);

        if (gameState === 'title') {
            // タイトル画面
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${titleFontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('2Dシューティング', canvas.width / 2, canvas.height * 0.25);

            ctx.font = `${baseFontSize}px Arial`;
            ctx.fillText('パワーアップアイテムと特殊弾で敵を倒そう！', canvas.width / 2, canvas.height * 0.35);

            // 操作説明
            ctx.font = `${subtitleFontSize}px Arial`;
            ctx.fillStyle = '#aaa';
            ctx.fillText('【操作方法】', canvas.width / 2, canvas.height * 0.5);
            ctx.fillText('移動: マウス / 矢印キー / A/Dキー', canvas.width / 2, canvas.height * 0.55);
            ctx.fillText('攻撃: スペースキー / クリック / タッチ', canvas.width / 2, canvas.height * 0.6);
            ctx.fillText('ポーズ: ESCキー', canvas.width / 2, canvas.height * 0.65);
            ctx.fillText('特殊弾: 1(通常) / 2(爆発) / 3(レーザー)', canvas.width / 2, canvas.height * 0.7);

            ctx.fillStyle = '#ffff00';
            ctx.font = `${baseFontSize}px Arial`;
            ctx.fillText('スタートボタンを押して開始', canvas.width / 2, canvas.height * 0.85);
        } else if (gameState === 'paused') {
            // ポーズ画面
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#fff';
            ctx.font = `bold ${titleFontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('一時停止', canvas.width / 2, canvas.height / 2 - 30);

            ctx.font = `${baseFontSize}px Arial`;
            ctx.fillText('ESCキーで再開', canvas.width / 2, canvas.height / 2 + 20);
        } else if (gameState === 'gameover') {
            // ゲームオーバー画面
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ff0000';
            ctx.font = `bold ${titleFontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('ゲームオーバー', canvas.width / 2, canvas.height * 0.2);

            ctx.fillStyle = '#fff';
            ctx.font = `${baseFontSize}px Arial`;
            ctx.fillText(`最終スコア: ${score}`, canvas.width / 2, canvas.height * 0.35);
            ctx.fillText(`到達レベル: ${level}`, canvas.width / 2, canvas.height * 0.42);
            ctx.fillText(`倒した敵: ${enemiesDefeated}体`, canvas.width / 2, canvas.height * 0.49);
            ctx.fillText(`集めたアイテム: ${itemsCollected}個`, canvas.width / 2, canvas.height * 0.56);

            ctx.fillStyle = '#ffff00';
            ctx.font = `${baseFontSize}px Arial`;
            ctx.fillText('スタートボタンで再プレイ', canvas.width / 2, canvas.height * 0.75);
        } else if (gameState === 'clear') {
            // クリア画面
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00ff00';
            ctx.font = `bold ${titleFontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('クリア！', canvas.width / 2, canvas.height * 0.2);

            ctx.fillStyle = '#fff';
            ctx.font = `${baseFontSize}px Arial`;
            ctx.fillText(`最終スコア: ${score}`, canvas.width / 2, canvas.height * 0.35);
            ctx.fillText(`到達レベル: ${level}`, canvas.width / 2, canvas.height * 0.42);
            ctx.fillText(`倒した敵: ${enemiesDefeated}体`, canvas.width / 2, canvas.height * 0.49);
            ctx.fillText(`集めたアイテム: ${itemsCollected}個`, canvas.width / 2, canvas.height * 0.56);

            ctx.fillStyle = '#ffff00';
            ctx.font = `${baseFontSize}px Arial`;
            ctx.fillText('スタートボタンで再プレイ', canvas.width / 2, canvas.height * 0.75);
        } else if (gameState === 'playing') {
            // 爆発の描画
            explosions.forEach(explosion => {
                const alpha = explosion.life;
                ctx.strokeStyle = `rgba(255, 102, 0, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(explosion.x, explosion.y, explosion.radius * 0.7, 0, Math.PI * 2);
                ctx.fill();
            });

            // パーティクルの描画
            particles.forEach(particle => {
                ctx.globalAlpha = particle.life;
                ctx.fillStyle = particle.color;
                ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
            });
            ctx.globalAlpha = 1.0;

            // プレイヤーの描画（点滅処理）
            const blinkAlpha = playerBlink.active ?
                (Math.floor((Date.now() - playerBlink.timer) / 50) % 2 === 0 ? 1.0 : 0.3) : 1.0;
            ctx.globalAlpha = blinkAlpha;
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);

            // プレイヤーの目
            ctx.fillStyle = '#fff';
            ctx.fillRect(player.x + 8, player.y + 8, 8, 8);
            ctx.fillRect(player.x + 24, player.y + 8, 8, 8);
            ctx.globalAlpha = 1.0;

            // 弾の描画
            bullets.forEach(bullet => {
                if (bullet.type === 'laser') {
                    // レーザーの描画
                    ctx.strokeStyle = bullet.color;
                    ctx.lineWidth = bullet.width;
                    ctx.globalAlpha = bullet.life;
                    ctx.beginPath();
                    ctx.moveTo(bullet.x, bullet.y);
                    ctx.lineTo(bullet.x, 0);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.fillStyle = bullet.color;
                    ctx.save();
                    ctx.translate(bullet.x, bullet.y);
                    ctx.rotate(bullet.angle + Math.PI / 2);
                    ctx.fillRect(-bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
                    ctx.restore();
                }
            });

            // 敵の描画
            enemies.forEach(enemy => {
                ctx.save();
                ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

                // 敵の種類に応じて描画
                if (enemy.shape === 'triangle') {
                    // 三角形（高速敵）
                    ctx.fillStyle = enemy.color;
                    ctx.beginPath();
                    ctx.moveTo(0, -enemy.height / 2);
                    ctx.lineTo(-enemy.width / 2, enemy.height / 2);
                    ctx.lineTo(enemy.width / 2, enemy.height / 2);
                    ctx.closePath();
                    ctx.fill();

                    // 目
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(-enemy.width * 0.15, -enemy.height * 0.1, enemy.width * 0.15, enemy.height * 0.15);
                    ctx.fillRect(enemy.width * 0.05, -enemy.height * 0.1, enemy.width * 0.15, enemy.height * 0.15);
                } else {
                    // 四角形（通常敵、中型敵、大型敵、ボス敵）
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);

                    // ボス敵の場合は枠線を追加
                    if (enemy.type === EnemyType.BOSS) {
                        ctx.strokeStyle = '#ffff00';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
                    }

                    // 目
                    ctx.fillStyle = '#fff';
                    const eyeSize = enemy.width * 0.2;
                    ctx.fillRect(-enemy.width * 0.3, -enemy.height * 0.2, eyeSize, eyeSize);
                    ctx.fillRect(enemy.width * 0.1, -enemy.height * 0.2, eyeSize, eyeSize);

                    // ボス敵の場合はHPバーを表示
                    if (enemy.type === EnemyType.BOSS && enemy.maxHealth > 1) {
                        const barWidth = enemy.width * 0.8;
                        const barHeight = 4;
                        const barX = -barWidth / 2;
                        const barY = -enemy.height / 2 - 8;

                        // HPバーの背景
                        ctx.fillStyle = '#333';
                        ctx.fillRect(barX, barY, barWidth, barHeight);

                        // HPバー
                        const hpRatio = enemy.health / enemy.maxHealth;
                        ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.25 ? '#ffff00' : '#ff0000';
                        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
                    }
                }

                ctx.restore();
            });

            // アイテムの描画
            items.forEach(item => {
                ctx.save();
                ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
                ctx.rotate(item.rotation);
                ctx.fillStyle = item.type.color;
                ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
                ctx.restore();
            });

            // 波紋エフェクトの描画
            rippleEffects.forEach(ripple => {
                ctx.strokeStyle = `rgba(100, 200, 255, ${ripple.alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.stroke();
            });

            // ボス警告テロップの描画
            if (bossWarning.active && bossWarning.slideProgress > 0) {
                const textWidth = 400;
                const textHeight = 60;
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2 - 100;

                // 左右からスライドイン
                const leftX = centerX - textWidth / 2 - (1 - bossWarning.slideProgress) * canvas.width / 2;
                const rightX = centerX + textWidth / 2 + (1 - bossWarning.slideProgress) * canvas.width / 2;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(leftX, centerY - textHeight / 2, rightX - leftX, textHeight);

                ctx.fillStyle = '#ff0000';
                ctx.font = `bold ${48}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('WARNING', centerX, centerY + 15);
            }

            // ボス立ち絵の描画
            if (bossPortrait.active && bossPortrait.alpha > 0) {
                ctx.globalAlpha = bossPortrait.alpha * 0.3; // 薄く表示
                ctx.fillStyle = '#ff0000';
                const portraitSize = 200;
                const portraitX = canvas.width / 2 - portraitSize / 2;
                const portraitY = canvas.height / 2 - portraitSize / 2;
                // 簡易的なボス立ち絵（大きな四角形）
                ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
                ctx.globalAlpha = 1.0;
            }

            // UI要素の描画
            drawUI();

            // 画面フラッシュの描画（最前面）
            if (screenFlash.active) {
                const elapsed = Date.now() - screenFlash.timer;
                const flashAlpha = Math.max(0, 1 - elapsed / screenFlash.duration);
                ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    } catch (error) {
        console.error('描画エラー:', error);
    }
}

// UI要素の描画
function drawUI() {
    if (!canvas || !ctx) return; // canvasとctxが初期化されていない場合は何もしない

    try {
        const uiPadding = 10;
        const barWidth = 200;
        const barHeight = 20;
        const fontSize = 14;

        // 左上: HPバー
        const hpX = uiPadding;
        const hpY = uiPadding;
        drawHealthBar(hpX, hpY, barWidth, barHeight, lives, maxLives, 'HP', '#ff0000');

        // 左上: シールドゲージ（HPバーの下）
        const shieldX = uiPadding;
        const shieldY = hpY + barHeight + 5;
        drawShieldBar(shieldX, shieldY, barWidth, barHeight, shield, maxShield);

        // 右上: スコア
        const scoreX = canvas.width - uiPadding;
        const scoreY = uiPadding;
        drawScore(scoreX, scoreY, fontSize);

        // 右上: ハイスコア（スコアの下）
        const highScoreX = canvas.width - uiPadding;
        const highScoreY = scoreY + fontSize + 5;
        drawHighScore(highScoreX, highScoreY, fontSize);
    } catch (error) {
        console.error('UI描画エラー:', error);
    }
}

// HPバーの描画
function drawHealthBar(x, y, width, height, current, max, label, color) {
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, width, height);

    // HPバー
    const ratio = Math.max(0, Math.min(1, current / max));
    const barWidth = width * ratio;

    // グラデーション
    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    if (ratio > 0.6) {
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(1, '#00cc00');
    } else if (ratio > 0.3) {
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(1, '#ffcc00');
    } else {
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#cc0000');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, height);

    // 枠線
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // ラベルと数値
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${12}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`${label}: ${current}/${max}`, x + 5, y + 15);
}

// シールドゲージの描画
function drawShieldBar(x, y, width, height, current, max) {
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, width, height);

    // シールドバー
    const ratio = Math.max(0, Math.min(1, current / max));
    const barWidth = width * ratio;

    if (barWidth > 0) {
        // グラデーション（青系）
        const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
        gradient.addColorStop(0, '#00aaff');
        gradient.addColorStop(1, '#0066ff');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, height);

        // シールドエフェクト（アニメーション）
        if (current > 0) {
            const time = Date.now() * 0.005;
            ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + Math.sin(time) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, height);
        }
    }

    // 枠線
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // ラベルと数値
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${12}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`SHIELD: ${Math.floor(current)}/${max}`, x + 5, y + 15);
}

// スコアの描画
function drawScore(x, y, fontSize) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, x, y);
}

// ハイスコアの描画
function drawHighScore(x, y, fontSize) {
    ctx.fillStyle = '#ffff00';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText(`HIGH: ${highScore.toLocaleString()}`, x, y);
}

// 残機アイコンの描画
function drawLivesIcons(x, y) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${12}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('LIVES:', x, y);

    const iconSize = 20;
    const iconSpacing = 25;

    for (let i = 0; i < maxLives; i++) {
        const iconX = x + 60 + i * iconSpacing;
        const iconY = y - iconSize;

        if (i < lives) {
            // 残機がある場合（緑色）
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.moveTo(iconX, iconY);
            ctx.lineTo(iconX + iconSize / 2, iconY + iconSize);
            ctx.lineTo(iconX - iconSize / 2, iconY + iconSize);
            ctx.closePath();
            ctx.fill();

            // 枠線
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            // 残機がない場合（グレー）
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(iconX, iconY);
            ctx.lineTo(iconX + iconSize / 2, iconY + iconSize);
            ctx.lineTo(iconX - iconSize / 2, iconY + iconSize);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// ボス残数アイコンの描画
function drawBossIcons(x, y) {
    // ボス残数を計算（レベル10までに出現するボス数）
    const totalBosses = Math.floor((10 - level) / 3) + (level >= 7 ? 1 : 0);
    const remainingBosses = Math.max(0, totalBosses - bossCount);

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${12}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('BOSS:', x, y);

    const iconSize = 20;
    const iconSpacing = 25;

    for (let i = 0; i < 3; i++) {
        const iconX = x + 50 + i * iconSpacing;
        const iconY = y - iconSize;

        if (i < remainingBosses) {
            // ボスが残っている場合（赤色）
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(iconX - iconSize / 2, iconY, iconSize, iconSize);

            // 枠線（黄色）
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(iconX - iconSize / 2, iconY, iconSize, iconSize);
        } else {
            // ボスを倒した場合（グレー）
            ctx.fillStyle = '#333';
            ctx.fillRect(iconX - iconSize / 2, iconY, iconSize, iconSize);
        }
    }
}

// ボタンの表示状態を更新
function updateButtonVisibility() {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const backToTitleBtn = document.getElementById('back-to-title-btn');

    if (gameState === 'title') {
        // タイトル画面: スタートボタンを表示
        startBtn.style.display = 'block';
        startBtn.textContent = 'スタート';
        pauseBtn.style.display = 'none';
        backToTitleBtn.style.display = 'none';
    } else if (gameState === 'playing') {
        // プレイ中: リスタートボタンを非表示、一時停止ボタンを表示
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'block';
        pauseBtn.disabled = false;
        pauseBtn.textContent = '一時停止';
        backToTitleBtn.style.display = 'none';
    } else if (gameState === 'paused') {
        // 一時停止中: 再開ボタンとタイトルに戻るボタンを表示
        startBtn.style.display = 'block';
        startBtn.textContent = '再開';
        pauseBtn.style.display = 'none';
        backToTitleBtn.style.display = 'block';
        backToTitleBtn.textContent = 'タイトルに戻る';
    } else if (gameState === 'gameover' || gameState === 'clear') {
        // ゲームオーバー/クリア: リスタートボタンを表示
        startBtn.style.display = 'block';
        startBtn.textContent = '再プレイ';
        pauseBtn.style.display = 'none';
        backToTitleBtn.style.display = 'none';
    }
}

// UI更新
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
    document.getElementById('normal-count').textContent = bulletCounts.normal === Infinity ? '∞' : bulletCounts.normal;
    document.getElementById('explosive-count').textContent = bulletCounts.explosive;
    document.getElementById('laser-count').textContent = bulletCounts.laser;

    // パワーアップ状態の表示
    const powerupList = document.getElementById('powerup-list');
    powerupList.innerHTML = '';

    // 一時停止中の時間を考慮した現在時刻
    let adjustedNow;
    if (gameState === 'paused' && pauseStartTime > 0) {
        // 一時停止中は、一時停止開始時点の時刻を使用
        adjustedNow = pauseStartTime - totalPausedTime;
    } else {
        // プレイ中は、現在時刻から累積一時停止時間を引く
        adjustedNow = Date.now() - totalPausedTime;
    }

    if (powerups.rapidFire.active) {
        const elapsed = adjustedNow - powerups.rapidFire.timer;
        const timeLeft = Math.max(0, Math.ceil((powerups.rapidFire.duration - elapsed) / 1000));
        const div = document.createElement('div');
        div.className = 'powerup-item active';
        div.textContent = `${PowerupType.RAPID_FIRE.emoji} ${timeLeft}秒`;
        powerupList.appendChild(div);
    }
    if (powerups.multiShot.active) {
        const elapsed = adjustedNow - powerups.multiShot.timer;
        const timeLeft = Math.max(0, Math.ceil((powerups.multiShot.duration - elapsed) / 1000));
        const div = document.createElement('div');
        div.className = 'powerup-item active';
        div.textContent = `${PowerupType.MULTI_SHOT.emoji} ${timeLeft}秒`;
        powerupList.appendChild(div);
    }
    if (powerups.speedBoost.active) {
        const elapsed = adjustedNow - powerups.speedBoost.timer;
        const timeLeft = Math.max(0, Math.ceil((powerups.speedBoost.duration - elapsed) / 1000));
        const div = document.createElement('div');
        div.className = 'powerup-item active';
        div.textContent = `${PowerupType.SPEED_BOOST.emoji} ${timeLeft}秒`;
        powerupList.appendChild(div);
    }
    if (powerups.doubleScore.active) {
        const elapsed = adjustedNow - powerups.doubleScore.timer;
        const timeLeft = Math.max(0, Math.ceil((powerups.doubleScore.duration - elapsed) / 1000));
        const div = document.createElement('div');
        div.className = 'powerup-item active';
        div.textContent = `${PowerupType.DOUBLE_SCORE.emoji} ${timeLeft}秒`;
        powerupList.appendChild(div);
    }

    // ボタンの表示状態を更新
    updateButtonVisibility();
}

// Canvasサイズを調整する関数
function resizeCanvas() {
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth - 20; // padding分を考慮

    // 利用可能な高さを計算（画面サイズに応じて調整）
    // スマホの場合は画面の50%、PCの場合は60%
    const isMobile = window.innerWidth <= 768;
    const heightRatio = isMobile ? 0.5 : 0.6;
    const availableHeight = window.innerHeight * heightRatio;

    // アスペクト比を維持（4:3）
    const aspectRatio = 4 / 3;
    let newWidth = containerWidth;
    let newHeight = newWidth / aspectRatio;

    // 高さが制限を超える場合は高さ基準で調整
    if (newHeight > availableHeight) {
        newHeight = availableHeight;
        newWidth = newHeight * aspectRatio;
    }

    // 最小サイズの制限
    const minWidth = isMobile ? 280 : 300;
    const minHeight = isMobile ? 210 : 225;
    if (newWidth < minWidth) {
        newWidth = minWidth;
        newHeight = minWidth / aspectRatio;
    }
    if (newHeight < minHeight) {
        newHeight = minHeight;
        newWidth = minHeight * aspectRatio;
    }

    // Canvasのサイズを設定
    canvas.width = newWidth;
    canvas.height = newHeight;

    // CSSで表示サイズも調整
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';

    // プレイヤーの位置を調整（画面外に出ないように）
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
    // プレイヤーが画面外に出ないように制限（アイコンエリアを避ける）
    const minPlayerY = canvas.height - 80; // アイコンエリア(35px) + マージン(45px)
    if (player.y + player.height > canvas.height - 35) {
        player.y = canvas.height - 35 - player.height;
    }
    if (player.y < 0) {
        player.y = 0;
    }
}

// タッチ位置を取得する関数
function getTouchPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    } else {
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
}

// DOM読み込み完了後に初期化
function initializeGame() {
    // ハイスコアの読み込み
    loadHighScore();

    // キャンバスの初期化
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 初期サイズの設定
    resizeCanvas();

    // プレイヤーの初期位置を設定（アイコンエリアを避けて上に配置）
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 80; // アイコンエリア(35px) + マージン(5px)を考慮

    // リサイズイベント
    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    // マウスでプレイヤーを動かす
    canvas.addEventListener('mousemove', (e) => {
        if (gameState === 'playing') {
            const pos = getTouchPosition(e);
            player.x = pos.x - player.width / 2;
            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
        }
    });

    // タッチでプレイヤーを動かす
    let touchStartTime = 0;
    let touchStartX = 0;
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState === 'playing') {
            const pos = getTouchPosition(e);
            touchStartTime = Date.now();
            touchStartX = pos.x;
            player.x = pos.x - player.width / 2;
            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
            // タッチ開始時に弾を撃つ
            shoot();
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (gameState === 'playing') {
            const pos = getTouchPosition(e);
            player.x = pos.x - player.width / 2;
            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
            // 移動中も連射（一定間隔で）
            const timeSinceStart = Date.now() - touchStartTime;
            if (timeSinceStart > 200) { // 200msごとに撃つ
                shoot();
                touchStartTime = Date.now();
            }
        }
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
    });

    // マウスクリックで弾を撃つ
    canvas.addEventListener('click', () => {
        if (gameState === 'playing') {
            shoot();
        }
    });

    // ゲーム開始・リスタート
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
        if (gameState === 'title' || gameState === 'gameover' || gameState === 'clear') {
            // ゲームを開始
            gameState = 'playing';
            score = 0;
            lives = 3;
            level = 1;
            shield = 0;
            enemiesDefeated = 0;
            itemsCollected = 0;
            bossCount = 0;
            bullets = [];
            enemies = [];
            items = [];
            particles = [];
            explosions = [];
            enemySpawnTimer = 0;
            currentBulletType = 'normal';
            bulletCounts = {
                normal: Infinity,
                explosive: 3,
                laser: 2
            };
            player.x = canvas.width / 2 - player.width / 2;
            player.y = canvas.height - 80; // アイコンエリアを避けて上に配置
            player.speed = player.baseSpeed;
            // パワーアップをリセット
            Object.keys(powerups).forEach(key => {
                powerups[key].active = false;
                powerups[key].timer = 0;
                powerups[key].pausedTime = 0;
            });
            // 一時停止関連をリセット
            pauseStartTime = 0;
            totalPausedTime = 0;
            updateUI();
        } else if (gameState === 'paused') {
            // ポーズから再開
            if (pauseStartTime > 0) {
                totalPausedTime += Date.now() - pauseStartTime;
                pauseStartTime = 0;
            }
            gameState = 'playing';
            updateButtonVisibility();
        }
    });

    // 一時停止
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.addEventListener('click', () => {
        if (gameState === 'playing') {
            gameState = 'paused';
            pauseStartTime = Date.now();
            updateButtonVisibility();
        }
    });

    // タイトルに戻る
    const backToTitleBtn = document.getElementById('back-to-title-btn');
    backToTitleBtn.addEventListener('click', () => {
        if (gameState === 'paused') {
            // タイトル画面に戻る
            gameState = 'title';
            // ゲームをリセット
            score = 0;
            lives = 3;
            level = 1;
            shield = 0;
            enemiesDefeated = 0;
            itemsCollected = 0;
            bossCount = 0;
            bullets = [];
            enemies = [];
            items = [];
            particles = [];
            explosions = [];
            enemySpawnTimer = 0;
            currentBulletType = 'normal';
            bulletCounts = {
                normal: Infinity,
                explosive: 3,
                laser: 2
            };
            player.x = canvas.width / 2 - player.width / 2;
            player.y = canvas.height - 80; // アイコンエリアを避けて上に配置
            player.speed = player.baseSpeed;
            // パワーアップをリセット
            Object.keys(powerups).forEach(key => {
                powerups[key].active = false;
                powerups[key].timer = 0;
                powerups[key].pausedTime = 0;
            });
            // 一時停止関連をリセット
            pauseStartTime = 0;
            totalPausedTime = 0;
            // 演出エフェクトをリセット
            screenFlash.active = false;
            playerBlink.active = false;
            rippleEffects = [];
            bossWarning.active = false;
            bossPortrait.active = false;
            updateButtonVisibility();
            updateUI();
        }
    });

    // ヘルプダイアログ
    document.getElementById('show-help').addEventListener('click', () => {
        document.getElementById('help-dialog').showModal();
    });

    document.getElementById('close-help').addEventListener('click', () => {
        document.getElementById('help-dialog').close();
    });

    // 初期状態のボタン表示を設定
    updateButtonVisibility();

    // UI更新の定期実行
    setInterval(updateUI, 100);

    // ゲームループ開始
    try {
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('ゲームループ開始エラー:', error);
    }
}

// DOM読み込み完了を待つ（モジュールスクリプトは既にDOMが読み込まれている可能性がある）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    // DOMは既に読み込まれている
    initializeGame();
}
