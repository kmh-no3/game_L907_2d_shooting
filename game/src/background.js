// 背景・パーティクルシステム

import { CONFIG, getBackgroundColor } from './config.js';

let backgroundParticles = [];
let backgroundScrollY = 0;
let backgroundPatternOffset = 0;

// 背景パーティクルを初期化
export function initBackgroundParticles(canvas, level) {
    backgroundParticles = [];
    const particleCount = CONFIG.BACKGROUND.PARTICLE_COUNT_BASE + level * CONFIG.BACKGROUND.PARTICLE_COUNT_PER_LEVEL;

    for (let i = 0; i < particleCount; i++) {
        const type = Math.random() < CONFIG.BACKGROUND.METEOR_CHANCE ? 'meteor' : 'star';
        backgroundParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: type === 'meteor' ? 2 + Math.random() * 3 : 0.5 + Math.random() * 1,
            size: type === 'meteor' ? 3 + Math.random() * 4 : 1 + Math.random() * 2,
            color: '#ffffff',
            alpha: 0.3 + Math.random() * 0.7,
            type: type,
            angle: type === 'meteor' ? Math.PI / 4 + (Math.random() - 0.5) * 0.3 : 0,
            trail: type === 'meteor' ? [] : null
        });
    }
}

// 背景パーティクルを更新
export function updateBackgroundParticles(canvas, deltaTime) {
    if (!canvas) return;

    backgroundParticles = backgroundParticles.filter(particle => {
        if (particle.type === 'meteor') {
            // 流星の処理
            particle.x += Math.cos(particle.angle) * particle.speed;
            particle.y += Math.sin(particle.angle) * particle.speed;

            // トレイルを追加
            if (particle.trail) {
                particle.trail.push({ x: particle.x, y: particle.y, alpha: 1.0 });
                if (particle.trail.length > 10) {
                    particle.trail.shift();
                }
                // トレイルのアルファを減衰
                particle.trail.forEach((point, index) => {
                    point.alpha = (index + 1) / particle.trail.length * 0.5;
                });
            }

            // 画面外に出たら再配置
            if (particle.x < -particle.size || particle.x > canvas.width + particle.size ||
                particle.y < -particle.size || particle.y > canvas.height + particle.size) {
                particle.x = Math.random() * canvas.width;
                particle.y = -particle.size;
            }
        } else {
            // 星の処理（ゆっくり下にスクロール）
            particle.y += particle.speed;
            if (particle.y > canvas.height) {
                particle.y = -particle.size;
                particle.x = Math.random() * canvas.width;
            }
        }

        return true;
    });

    // 背景スクロール位置を更新
    backgroundScrollY += 0.5;
    if (backgroundScrollY > canvas.height) {
        backgroundScrollY = 0;
    }

    // 背景パターンのオフセットを更新
    backgroundPatternOffset += 0.1;
}

// 背景を描画
export function drawBackground(canvas, ctx, level) {
    if (!canvas || !ctx) return;

    const bgColor = getBackgroundColor(level);

    // グラデーション背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, bgColor.gradient[0]);
    gradient.addColorStop(1, bgColor.gradient[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // スクロールする背景パターン（レベルに応じて変化）
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + level * 0.02})`;
    ctx.lineWidth = 1;

    // グリッドパターン（レベルが高いほど濃く）
    if (level >= 3) {
        const gridSize = 50;
        const offsetY = backgroundScrollY % gridSize;
        for (let y = -gridSize; y < canvas.height + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y + offsetY);
            ctx.lineTo(canvas.width, y + offsetY);
            ctx.stroke();
        }
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
    }

    // 背景パーティクルを描画
    backgroundParticles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;

        if (particle.type === 'meteor') {
            // 流星の描画
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            // トレイルの描画
            if (particle.trail && particle.trail.length > 1) {
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < particle.trail.length - 1; i++) {
                    const point = particle.trail[i];
                    const nextPoint = particle.trail[i + 1];
                    ctx.globalAlpha = point.alpha * particle.alpha;
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                    ctx.lineTo(nextPoint.x, nextPoint.y);
                    ctx.stroke();
                }
            }
        } else {
            // 星の描画
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);

            // 星の輝き（大きい星のみ）
            if (particle.size > 1.5) {
                ctx.globalAlpha = particle.alpha * 0.5;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });

    ctx.globalAlpha = 1.0;
}


