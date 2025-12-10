// ゲームの基本設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// キャンバスサイズの設定
canvas.width = 800;
canvas.height = 600;

// ゲーム状態
let gameState = 'waiting'; // waiting, playing, paused, gameover
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
    color: '#00ff00'
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

// 弾を撃つ
function shoot() {
    const now = Date.now();
    if (now - shootTimer < 200) return; // 連射制限
    shootTimer = now;

    bullets.push({
        x: player.x + player.width / 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: 7,
        color: '#ffff00'
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

    // 弾の更新
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
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

    // レベルアップで敵の生成速度を上げる
    if (enemies.length === 0 && score > 0 && score % 500 === 0) {
        level++;
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
        ctx.fillText('スタートボタンを押して開始', canvas.width / 2, canvas.height / 2 + 20);
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
            ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
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

