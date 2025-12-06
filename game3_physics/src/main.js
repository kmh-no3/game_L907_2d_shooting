// ゲームの基本設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// キャンバスサイズの設定
canvas.width = 800;
canvas.height = 600;

// 物理定数
const GRAVITY = 0.2;
const FRICTION = 0.98;
const RESTITUTION = 0.7; // 反発係数

// ゲーム状態
let gameState = 'waiting';
let score = 0;
let lives = 3;
let level = 1;
let lastTime = 0;
let enemySpawnTimer = 0;
let shootTimer = 0;

// プレイヤー
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speed: 5,
    color: '#00ff00',
    vx: 0,
    vy: 0
};

// 弾の配列
let bullets = [];

// 敵の配列
let enemies = [];

// キー入力の状態
const keys = {
    left: false,
    right: false,
    space: false
};

// イベントリスナー
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ') {
        e.preventDefault();
        keys.space = true;
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
        const targetX = e.clientX - rect.left - player.width / 2;
        player.vx = (targetX - player.x) * 0.1;
    }
});

// マウスクリックで弾を撃つ
canvas.addEventListener('click', () => {
    if (gameState === 'playing') {
        shoot();
    }
});

// 弾を撃つ
function shoot() {
    const now = Date.now();
    if (now - shootTimer < 200) return;
    shootTimer = now;

    bullets.push({
        x: player.x + player.width / 2,
        y: player.y,
        width: 4,
        height: 10,
        vx: (Math.random() - 0.5) * 2, // ランダムな横方向の速度
        vy: -7 - Math.random() * 2,
        color: '#ffff00',
        mass: 1
    });
}

// 敵を生成
function spawnEnemy() {
    const enemySize = 30 + Math.random() * 20;
    enemies.push({
        x: Math.random() * (canvas.width - enemySize),
        y: -enemySize,
        width: enemySize,
        height: enemySize,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + level * 0.5,
        color: '#ff0000',
        health: 1,
        mass: enemySize / 10
    });
}

// 衝突判定
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

// 衝突応答（物理演算）
function resolveCollision(obj1, obj2) {
    const dx = (obj1.x + obj1.width / 2) - (obj2.x + obj2.width / 2);
    const dy = (obj1.y + obj1.height / 2) - (obj2.y + obj2.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    const nx = dx / distance;
    const ny = dy / distance;

    // 相対速度
    const dvx = obj1.vx - obj2.vx;
    const dvy = obj1.vy - obj2.vy;

    // 衝突方向の相対速度
    const dvn = dvx * nx + dvy * ny;

    // 反発
    const impulse = 2 * dvn / (obj1.mass + obj2.mass);

    obj1.vx -= impulse * obj2.mass * nx * RESTITUTION;
    obj1.vy -= impulse * obj2.mass * ny * RESTITUTION;
    obj2.vx += impulse * obj1.mass * nx * RESTITUTION;
    obj2.vy += impulse * obj1.mass * ny * RESTITUTION;
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
    // プレイヤーの移動（物理ベース）
    if (keys.left) {
        player.vx = -player.speed;
    } else if (keys.right) {
        player.vx = player.speed;
    } else {
        player.vx *= FRICTION;
    }

    player.x += player.vx;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

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

    // 弾の更新（物理演算）
    bullets = bullets.filter(bullet => {
        // 重力の適用
        bullet.vy += GRAVITY;

        // 速度の適用
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // 摩擦
        bullet.vx *= FRICTION;

        // 画面外チェック
        return bullet.y < canvas.height + 50 &&
            bullet.x > -50 &&
            bullet.x < canvas.width + 50;
    });

    // 敵の更新（物理演算）
    enemies = enemies.filter(enemy => {
        // 重力の適用
        enemy.vy += GRAVITY * 0.5;

        // 速度の適用
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // 摩擦
        enemy.vx *= FRICTION;

        // 画面端で反発
        if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
            enemy.vx *= -RESTITUTION;
            enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
        }

        // プレイヤーとの衝突
        if (checkCollision(enemy, player)) {
            lives--;
            if (lives <= 0) {
                gameState = 'gameover';
            }
            return false;
        }

        // 画面外に出たら削除
        if (enemy.y > canvas.height + 50) {
            return false;
        }

        return true;
    });

    // 敵同士の衝突判定
    for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            if (checkCollision(enemies[i], enemies[j])) {
                resolveCollision(enemies[i], enemies[j]);
            }
        }
    }

    // 弾と敵の衝突判定（逆順ループでspliceの問題を回避）
    for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        const bullet = bullets[bulletIndex];
        let bulletHit = false;

        for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
            const enemy = enemies[enemyIndex];
            if (checkCollision(bullet, enemy)) {
                score += 10;
                bulletHit = true;
                enemy.health--;
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    // レベルアップ判定
                    if (score > 0 && score % 500 === 0) {
                        level++;
                    }
                }
                break; // 1つの弾は1つの敵にしか当たらない
            }
        }

        if (bulletHit) {
            bullets.splice(bulletIndex, 1);
        }
    }
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
        ctx.fillText('物理エンジン版', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('スタートボタンを押して開始', canvas.width / 2, canvas.height / 2 + 50);
    } else if (gameState === 'gameover') {
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ゲームオーバー', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText(`スコア: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    } else {
        // プレイヤーの描画
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // プレイヤーの目
        ctx.fillStyle = '#fff';
        ctx.fillRect(player.x + 8, player.y + 8, 8, 8);
        ctx.fillRect(player.x + 24, player.y + 8, 8, 8);

        // 弾の描画
        bullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
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
        enemySpawnTimer = 0;
        player.x = canvas.width / 2 - player.width / 2;
        player.vx = 0;
        player.vy = 0;
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

