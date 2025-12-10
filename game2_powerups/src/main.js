// ゲームの基本設定
let canvas;
let ctx;

// ゲーム状態
let gameState = 'waiting';
let score = 0;
let lives = 3;
let level = 1;
let lastTime = 0;
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
    rapidFire: { active: false, timer: 0, duration: 10000 },
    multiShot: { active: false, timer: 0, duration: 15000 },
    speedBoost: { active: false, timer: 0, duration: 10000 },
    doubleScore: { active: false, timer: 0, duration: 20000 }
};

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

// イベントリスナー
document.addEventListener('keydown', (e) => {
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
    const enemySize = 30 + Math.random() * 20;
    enemies.push({
        x: Math.random() * (canvas.width - enemySize),
        y: -enemySize,
        width: enemySize,
        height: enemySize,
        speed: 2 + level * 0.5,
        color: '#ff0000',
        health: 1
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

    if (powerups.rapidFire.active && now - powerups.rapidFire.timer > powerups.rapidFire.duration) {
        powerups.rapidFire.active = false;
    }
    if (powerups.multiShot.active && now - powerups.multiShot.timer > powerups.multiShot.duration) {
        powerups.multiShot.active = false;
    }
    if (powerups.speedBoost.active && now - powerups.speedBoost.timer > powerups.speedBoost.duration) {
        powerups.speedBoost.active = false;
        player.speed = player.baseSpeed;
    }
    if (powerups.doubleScore.active && now - powerups.doubleScore.timer > powerups.doubleScore.duration) {
        powerups.doubleScore.active = false;
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
            lives--;
            if (lives <= 0) {
                gameState = 'gameover';
                updateButtonVisibility();
            }
            createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0000', 15);
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
                    const baseScore = 10;
                    const finalScore = powerups.doubleScore.active ? baseScore * 2 : baseScore;
                    score += finalScore;
                    enemy.health--;
                    if (enemy.health <= 0) {
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0000', 20);
                        // アイテムをドロップ（30%の確率）
                        if (Math.random() < 0.3) {
                            spawnItem(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        }
                        enemies.splice(enemyIndex, 1);
                        if (score > 0 && score % 500 === 0) {
                            level++;
                            // 特殊弾を補充
                            bulletCounts.explosive = Math.min(5, bulletCounts.explosive + 1);
                            bulletCounts.laser = Math.min(3, bulletCounts.laser + 1);
                        }
                    }
                }
            }
        } else {
            // 通常弾・爆発弾の処理
            for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
                const enemy = enemies[enemyIndex];
                if (checkCollision(bullet, enemy)) {
                    const baseScore = 10;
                    const finalScore = powerups.doubleScore.active ? baseScore * 2 : baseScore;
                    score += finalScore;
                    bulletHit = true;
                    enemy.health--;

                    if (bullet.type === 'explosive') {
                        // 爆発弾の処理
                        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, bullet.radius);

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
                                        createParticles(otherEnemy.x + otherEnemy.width / 2, otherEnemy.y + otherEnemy.height / 2, '#ff0000', 15);
                                        const otherBaseScore = 10;
                                        const otherFinalScore = powerups.doubleScore.active ? otherBaseScore * 2 : otherBaseScore;
                                        score += otherFinalScore;
                                        enemies.splice(otherIndex, 1);
                                        // インデックスを調整（削除した要素より前のインデックスを調整）
                                        if (otherIndex < enemyIndex) {
                                            enemyIndex--;
                                        }
                                        // アイテムをドロップ（30%の確率）
                                        if (Math.random() < 0.3) {
                                            spawnItem(otherEnemy.x + otherEnemy.width / 2, otherEnemy.y + otherEnemy.height / 2);
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0000', 10);
                    }

                    if (enemy.health <= 0) {
                        // アイテムをドロップ（30%の確率）
                        if (Math.random() < 0.3) {
                            spawnItem(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        }
                        enemies.splice(enemyIndex, 1);
                        if (score > 0 && score % 500 === 0) {
                            level++;
                            bulletCounts.explosive = Math.min(5, bulletCounts.explosive + 1);
                            bulletCounts.laser = Math.min(3, bulletCounts.laser + 1);
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
}

// 描画処理
function draw() {
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

    if (gameState === 'waiting') {
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('2Dシューティング', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText('スタートボタンを押して開始', canvas.width / 2, canvas.height / 2 + 20);
    } else if (gameState === 'gameover') {
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ゲームオーバー', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText(`スコア: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    } else {
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

        // プレイヤーの描画
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // プレイヤーの目
        ctx.fillStyle = '#fff';
        ctx.fillRect(player.x + 8, player.y + 8, 8, 8);
        ctx.fillRect(player.x + 24, player.y + 8, 8, 8);

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
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

            // 敵の目
            ctx.fillStyle = '#fff';
            ctx.fillRect(enemy.x + enemy.width * 0.2, enemy.y + enemy.height * 0.2, enemy.width * 0.2, enemy.height * 0.2);
            ctx.fillRect(enemy.x + enemy.width * 0.6, enemy.y + enemy.height * 0.2, enemy.width * 0.2, enemy.height * 0.2);
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
    }
}

// ボタンの表示状態を更新
function updateButtonVisibility() {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');

    if (gameState === 'waiting') {
        // 待機中: スタートボタンを表示
        startBtn.style.display = 'block';
        startBtn.textContent = 'スタート';
        pauseBtn.style.display = 'none';
    } else if (gameState === 'playing') {
        // プレイ中: リスタートボタンを非表示、一時停止ボタンを表示
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'block';
        pauseBtn.disabled = false;
        pauseBtn.textContent = '一時停止';
    } else if (gameState === 'paused') {
        // 一時停止中: リスタートボタンを表示
        startBtn.style.display = 'block';
        startBtn.textContent = 'リスタート';
        pauseBtn.style.display = 'block';
        pauseBtn.textContent = '再開';
    } else if (gameState === 'gameover') {
        // ゲームオーバー: リスタートボタンを表示
        startBtn.style.display = 'block';
        startBtn.textContent = 'リスタート';
        pauseBtn.style.display = 'none';
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

    if (powerups.rapidFire.active) {
        const timeLeft = Math.ceil((powerups.rapidFire.duration - (Date.now() - powerups.rapidFire.timer)) / 1000);
        const div = document.createElement('div');
        div.className = 'powerup-item active';
        div.textContent = `${PowerupType.RAPID_FIRE.emoji} ${timeLeft}秒`;
        powerupList.appendChild(div);
    }
    if (powerups.multiShot.active) {
        const timeLeft = Math.ceil((powerups.multiShot.duration - (Date.now() - powerups.multiShot.timer)) / 1000);
        const div = document.createElement('div');
        div.className = 'powerup-item active';
        div.textContent = `${PowerupType.MULTI_SHOT.emoji} ${timeLeft}秒`;
        powerupList.appendChild(div);
    }
    if (powerups.speedBoost.active) {
        const timeLeft = Math.ceil((powerups.speedBoost.duration - (Date.now() - powerups.speedBoost.timer)) / 1000);
        const div = document.createElement('div');
        div.className = 'powerup-item active';
        div.textContent = `${PowerupType.SPEED_BOOST.emoji} ${timeLeft}秒`;
        powerupList.appendChild(div);
    }
    if (powerups.doubleScore.active) {
        const timeLeft = Math.ceil((powerups.doubleScore.duration - (Date.now() - powerups.doubleScore.timer)) / 1000);
        const div = document.createElement('div');
        div.className = 'powerup-item active';
        div.textContent = `${PowerupType.DOUBLE_SCORE.emoji} ${timeLeft}秒`;
        powerupList.appendChild(div);
    }

    // ボタンの表示状態を更新
    updateButtonVisibility();
}

// DOM読み込み完了後に初期化
function initializeGame() {
    // キャンバスの初期化
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // キャンバスサイズの設定
    canvas.width = 800;
    canvas.height = 600;

    // プレイヤーの初期位置を設定
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;

    // マウスでプレイヤーを動かす
    canvas.addEventListener('mousemove', (e) => {
        if (gameState === 'playing') {
            const rect = canvas.getBoundingClientRect();
            player.x = e.clientX - rect.left - player.width / 2;
            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
        }
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
        if (gameState === 'waiting' || gameState === 'gameover' || gameState === 'paused') {
            gameState = 'playing';
            score = 0;
            lives = 3;
            level = 1;
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
            player.y = canvas.height - 50;
            player.speed = player.baseSpeed;
            // パワーアップをリセット
            Object.keys(powerups).forEach(key => {
                powerups[key].active = false;
                powerups[key].timer = 0;
            });
            updateUI();
        }
    });

    // 一時停止
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.addEventListener('click', () => {
        if (gameState === 'playing') {
            gameState = 'paused';
        } else if (gameState === 'paused') {
            gameState = 'playing';
        }
        updateButtonVisibility();
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
    requestAnimationFrame(gameLoop);
}

// DOM読み込み完了を待つ（モジュールスクリプトは既にDOMが読み込まれている可能性がある）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    // DOMは既に読み込まれている
    initializeGame();
}
