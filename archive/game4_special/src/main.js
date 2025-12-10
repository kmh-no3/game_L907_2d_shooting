// ゲームの基本設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// キャンバスサイズの設定
canvas.width = 800;
canvas.height = 600;

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
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speed: 5,
    color: '#00ff00'
};

// 弾の配列
let bullets = [];

// 敵の配列
let enemies = [];

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
    if (now - shootTimer < 200) return;

    // 弾の種類に応じた制限チェック
    if (currentBulletType === 'explosive' && bulletCounts.explosive <= 0) {
        currentBulletType = 'normal';
    }
    if (currentBulletType === 'laser' && bulletCounts.laser <= 0) {
        currentBulletType = 'normal';
    }

    if (currentBulletType === 'normal') {
        shootTimer = now;
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 7,
            type: 'normal',
            color: '#ffff00'
        });
    } else if (currentBulletType === 'explosive' && bulletCounts.explosive > 0) {
        shootTimer = now;
        bulletCounts.explosive--;
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y,
            width: 6,
            height: 12,
            speed: 6,
            type: 'explosive',
            color: '#ff6600',
            radius: 50
        });
    } else if (currentBulletType === 'laser' && bulletCounts.laser > 0) {
        shootTimer = now;
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

    // レーザーの更新
    bullets = bullets.filter(bullet => {
        if (bullet.type === 'laser') {
            bullet.life -= 0.02;
            return bullet.life > 0;
        } else {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
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
                    score += 10;
                    enemy.health--;
                    if (enemy.health <= 0) {
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0000', 20);
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
                    score += 10;
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
                                        score += 10;
                                        enemies.splice(otherIndex, 1);
                                        // インデックスを調整（削除した要素より前のインデックスを調整）
                                        if (otherIndex < enemyIndex) {
                                            enemyIndex--;
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0000', 10);
                    }

                    if (enemy.health <= 0) {
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
        ctx.fillText('特殊効果版', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('スタートボタンを押して開始', canvas.width / 2, canvas.height / 2 + 50);
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
                ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
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
}

// ゲーム開始
document.getElementById('start-btn').addEventListener('click', () => {
    if (gameState === 'waiting' || gameState === 'gameover') {
        gameState = 'playing';
        score = 0;
        lives = 3;
        level = 1;
        bullets = [];
        enemies = [];
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
        document.getElementById('start-btn').textContent = 'リスタート';
        document.getElementById('pause-btn').disabled = false;
        updateUI();
    }
});

// 一時停止
document.getElementById('pause-btn').addEventListener('click', () => {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pause-btn').textContent = '再開';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pause-btn').textContent = '一時停止';
    }
});

// ヘルプダイアログ
document.getElementById('show-help').addEventListener('click', () => {
    document.getElementById('help-dialog').showModal();
});

document.getElementById('close-help').addEventListener('click', () => {
    document.getElementById('help-dialog').close();
});

// UI更新の定期実行
setInterval(updateUI, 100);

// ゲームループ開始
requestAnimationFrame(gameLoop);

