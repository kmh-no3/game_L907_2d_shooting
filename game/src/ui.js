// UI描画システム

import { CONFIG, PowerupType } from './config.js';

// UI要素の描画
export function drawUI(canvas, ctx, gameState, {
    lives,
    maxLives,
    shield,
    maxShield,
    level,
    score,
    highScore,
    combo,
    lastComboTime,
    comboTimeout,
    bulletCounts,
    powerups,
    pauseStartTime,
    totalPausedTime
}) {
    if (!canvas || !ctx) return;

    try {
        const uiPadding = 10;
        const barWidth = 200;
        const barHeight = 20;
        const fontSize = 14;
        const smallFontSize = 12;

        // 左上: HPバー
        const hpX = uiPadding;
        const hpY = uiPadding;
        drawHealthBar(ctx, hpX, hpY, barWidth, barHeight, lives, maxLives, 'HP', '#ff0000');

        // 左上: シールドゲージ（HPバーの下）
        const shieldX = uiPadding;
        const shieldY = hpY + barHeight + 5;
        drawShieldBar(ctx, shieldX, shieldY, barWidth, barHeight, shield, maxShield);

        // 左上: レベル表示（シールドの下）
        const levelY = shieldY + barHeight + 8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(uiPadding, levelY, 120, 20);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${smallFontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(`LEVEL: ${level}`, uiPadding + 5, levelY + 15);

        // 右上: スコア
        const scoreX = canvas.width - uiPadding;
        const scoreY = uiPadding;
        drawScore(ctx, scoreX, scoreY, fontSize, score);

        // 右上: ハイスコア（スコアの下）
        const highScoreX = canvas.width - uiPadding;
        const highScoreY = scoreY + fontSize + 5;
        drawHighScore(ctx, highScoreX, highScoreY, fontSize, highScore);

        // 右上: コンボ表示（ハイスコアの下）
        const comboX = canvas.width - uiPadding;
        const comboY = highScoreY + fontSize + 5;
        drawCombo(ctx, comboX, comboY, fontSize, combo, lastComboTime, comboTimeout);

        // 左下: 特殊弾情報（プレイヤーの上、邪魔にならない位置）
        const ammoBoxY = canvas.height - 100;
        drawAmmoInfo(ctx, uiPadding, ammoBoxY, fontSize, bulletCounts);

        // 右下: パワーアップ情報
        const powerupBoxX = canvas.width - 180;
        const powerupBoxY = ammoBoxY;
        drawPowerupInfo(ctx, powerupBoxX, powerupBoxY, fontSize, powerups, gameState, pauseStartTime, totalPausedTime);
    } catch (error) {
        console.error('UI描画エラー:', error);
    }
}

// 特殊弾情報の描画
function drawAmmoInfo(ctx, x, y, fontSize, bulletCounts) {
    const boxWidth = 170;
    const boxHeight = 80;
    const smallFontSize = fontSize - 2;

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // タイトル
    ctx.fillStyle = '#00ffff';
    ctx.font = `bold ${smallFontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('特殊弾', x + 5, y + 18);

    // 通常弾
    ctx.fillStyle = '#ffff00';
    ctx.font = `${smallFontSize}px Arial`;
    ctx.fillText('通常: ∞', x + 5, y + 35);

    // 爆発弾
    const explosiveText = `爆発: ${bulletCounts.explosive === Infinity ? '∞' : bulletCounts.explosive}`;
    ctx.fillStyle = bulletCounts.explosive > 0 ? '#ff6600' : '#888';
    ctx.fillText(explosiveText, x + 5, y + 52);

    // レーザー
    const laserText = `レーザー: ${bulletCounts.laser === Infinity ? '∞' : bulletCounts.laser}`;
    ctx.fillStyle = bulletCounts.laser > 0 ? '#00ffff' : '#888';
    ctx.fillText(laserText, x + 5, y + 69);
}

// パワーアップ情報の描画
function drawPowerupInfo(ctx, x, y, fontSize, powerups, gameState, pauseStartTime, totalPausedTime) {
    const boxWidth = 170;
    const smallFontSize = fontSize - 2;
    let activeCount = 0;

    // アクティブなパワーアップをカウント
    if (powerups.rapidFire.active) activeCount++;
    if (powerups.multiShot.active) activeCount++;
    if (powerups.speedBoost.active) activeCount++;
    if (powerups.doubleScore.active) activeCount++;

    const boxHeight = Math.max(40, 25 + activeCount * 18);

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // タイトル
    ctx.fillStyle = '#ffff00';
    ctx.font = `bold ${smallFontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('パワーアップ', x + 5, y + 18);

    // 一時停止中の時間を考慮した現在時刻
    let adjustedNow;
    if (gameState === 'paused' && pauseStartTime > 0) {
        adjustedNow = pauseStartTime - totalPausedTime;
    } else {
        adjustedNow = Date.now() - totalPausedTime;
    }

    let textY = y + 35;
    if (powerups.rapidFire.active) {
        const elapsed = adjustedNow - powerups.rapidFire.timer;
        const timeLeft = Math.max(0, Math.ceil((powerups.rapidFire.duration - elapsed) / 1000));
        ctx.fillStyle = PowerupType.RAPID_FIRE.color;
        ctx.font = `${smallFontSize}px Arial`;
        ctx.fillText(`${PowerupType.RAPID_FIRE.emoji} ${timeLeft}秒`, x + 5, textY);
        textY += 18;
    }
    if (powerups.multiShot.active) {
        const elapsed = adjustedNow - powerups.multiShot.timer;
        const timeLeft = Math.max(0, Math.ceil((powerups.multiShot.duration - elapsed) / 1000));
        ctx.fillStyle = PowerupType.MULTI_SHOT.color;
        ctx.font = `${smallFontSize}px Arial`;
        ctx.fillText(`${PowerupType.MULTI_SHOT.emoji} ${timeLeft}秒`, x + 5, textY);
        textY += 18;
    }
    if (powerups.speedBoost.active) {
        const elapsed = adjustedNow - powerups.speedBoost.timer;
        const timeLeft = Math.max(0, Math.ceil((powerups.speedBoost.duration - elapsed) / 1000));
        ctx.fillStyle = PowerupType.SPEED_BOOST.color;
        ctx.font = `${smallFontSize}px Arial`;
        ctx.fillText(`${PowerupType.SPEED_BOOST.emoji} ${timeLeft}秒`, x + 5, textY);
        textY += 18;
    }
    if (powerups.doubleScore.active) {
        const elapsed = adjustedNow - powerups.doubleScore.timer;
        const timeLeft = Math.max(0, Math.ceil((powerups.doubleScore.duration - elapsed) / 1000));
        ctx.fillStyle = PowerupType.DOUBLE_SCORE.color;
        ctx.font = `${smallFontSize}px Arial`;
        ctx.fillText(`${PowerupType.DOUBLE_SCORE.emoji} ${timeLeft}秒`, x + 5, textY);
        textY += 18;
    }

    // パワーアップが無い場合
    if (activeCount === 0) {
        ctx.fillStyle = '#888';
        ctx.font = `${smallFontSize}px Arial`;
        ctx.fillText('なし', x + 5, textY);
    }
}

// HPバーの描画
function drawHealthBar(ctx, x, y, width, height, current, max, label, color) {
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
function drawShieldBar(ctx, x, y, width, height, current, max) {
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
function drawScore(ctx, x, y, fontSize, score) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, x, y);
}

// ハイスコアの描画
function drawHighScore(ctx, x, y, fontSize, highScore) {
    ctx.fillStyle = '#ffff00';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText(`HIGH: ${highScore.toLocaleString()}`, x, y);
}

// コンボの描画
function drawCombo(ctx, x, y, fontSize, combo, lastComboTime, comboTimeout) {
    if (combo > 0) {
        // コンボ数に応じて色を変更
        let comboColor = '#ffff00';
        if (combo >= 50) {
            comboColor = '#ff00ff';
        } else if (combo >= 30) {
            comboColor = '#ff6600';
        } else if (combo >= 20) {
            comboColor = '#ff0000';
        } else if (combo >= 10) {
            comboColor = '#00ff00';
        }

        // コンボ倍率も表示
        const multiplier = getComboMultiplier(combo);
        ctx.fillStyle = comboColor;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'right';
        ctx.fillText(`COMBO: ${combo} (x${multiplier.toFixed(2)})`, x, y);

        // コンボタイムアウトまでの時間を表示
        if (lastComboTime > 0) {
            const timeLeft = Math.max(0, comboTimeout - (Date.now() - lastComboTime));
            const timeLeftSec = (timeLeft / 1000).toFixed(1);
            ctx.fillStyle = '#aaa';
            ctx.font = `${fontSize - 2}px Arial`;
            ctx.fillText(`${timeLeftSec}s`, x, y + fontSize + 2);
        }
    }
}

// コンボ倍率を取得
function getComboMultiplier(combo) {
    if (combo <= 0) return 1;
    return Math.min(CONFIG.COMBO.MAX_MULTIPLIER, 1 + combo * 0.05);
}


