// エフェクトシステム

import { CONFIG } from './config.js';

// 演出エフェクトの管理
export class EffectManager {
    constructor() {
        this.screenFlash = { active: false, timer: 0, duration: CONFIG.EFFECT.SCREEN_FLASH_DURATION };
        this.playerBlink = { active: false, timer: 0, duration: CONFIG.EFFECT.PLAYER_BLINK_DURATION };
        this.rippleEffects = [];
        this.bossWarning = { active: false, timer: 0, duration: CONFIG.EFFECT.BOSS_WARNING_DURATION, slideProgress: 0 };
        this.bossPortrait = { active: false, timer: 0, duration: CONFIG.EFFECT.BOSS_PORTRAIT_DURATION, alpha: 0 };
        this.powerupEffect = { active: false, timer: 0, duration: CONFIG.EFFECT.POWERUP_EFFECT_DURATION, particles: [] };
        this.levelUpGrace = { active: false, timer: 0, duration: CONFIG.LEVEL.GRACE_PERIOD };
    }

    // 画面フラッシュを開始
    triggerScreenFlash() {
        this.screenFlash.active = true;
        this.screenFlash.timer = Date.now();
    }

    // プレイヤー点滅を開始
    triggerPlayerBlink() {
        this.playerBlink.active = true;
        this.playerBlink.timer = Date.now();
    }

    // 波紋エフェクトを生成
    createRippleEffect(x, y) {
        this.rippleEffects.push({
            x: x,
            y: y,
            radius: 0,
            alpha: 1.0
        });
    }

    // ボス警告を開始
    triggerBossWarning() {
        this.bossWarning.active = true;
        this.bossWarning.timer = Date.now();
        this.bossWarning.slideProgress = 0;
        this.bossPortrait.active = true;
        this.bossPortrait.timer = Date.now();
        this.bossPortrait.alpha = 0;
    }

    // パワーアップエフェクトを開始
    triggerPowerupEffect(player, color) {
        this.powerupEffect.active = true;
        this.powerupEffect.timer = Date.now();
        this.powerupEffect.particles = [];

        // プレイヤー周りにパーティクルを生成
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 2 + Math.random() * 3;
            this.powerupEffect.particles.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: color,
                alpha: 0.8 + Math.random() * 0.2
            });
        }
    }

    // レベルアップ猶予期間を開始
    triggerLevelUpGrace() {
        this.levelUpGrace.active = true;
        this.levelUpGrace.timer = Date.now();
    }

    // エフェクトを更新
    update() {
        const now = Date.now();

        // 画面フラッシュの更新
        if (this.screenFlash.active) {
            if (now - this.screenFlash.timer > this.screenFlash.duration) {
                this.screenFlash.active = false;
            }
        }

        // プレイヤー点滅の更新
        if (this.playerBlink.active) {
            if (now - this.playerBlink.timer > this.playerBlink.duration) {
                this.playerBlink.active = false;
            }
        }

        // 波紋エフェクトの更新
        this.rippleEffects = this.rippleEffects.filter(ripple => {
            ripple.radius += 3;
            ripple.alpha -= 0.02;
            return ripple.alpha > 0 && ripple.radius < 1000; // 適切な最大値に調整
        });

        // ボス警告テロップの更新
        if (this.bossWarning.active) {
            const elapsed = now - this.bossWarning.timer;
            if (elapsed < this.bossWarning.duration) {
                if (elapsed < 500) {
                    this.bossWarning.slideProgress = elapsed / 500;
                } else if (elapsed < 1500) {
                    this.bossWarning.slideProgress = 1;
                } else {
                    this.bossWarning.slideProgress = 1 - (elapsed - 1500) / 500;
                }
            } else {
                this.bossWarning.active = false;
            }
        }

        // ボス立ち絵の更新
        if (this.bossPortrait.active) {
            const elapsed = now - this.bossPortrait.timer;
            if (elapsed < 1000) {
                this.bossPortrait.alpha = elapsed / 1000;
            } else if (elapsed < 2000) {
                this.bossPortrait.alpha = 1;
            } else if (elapsed < 3000) {
                this.bossPortrait.alpha = 1 - (elapsed - 2000) / 1000;
            } else {
                this.bossPortrait.active = false;
            }
        }

        // パワーアップエフェクトの更新
        if (this.powerupEffect.active) {
            const elapsed = now - this.powerupEffect.timer;
            if (elapsed > this.powerupEffect.duration) {
                this.powerupEffect.active = false;
                this.powerupEffect.particles = [];
            } else {
                this.powerupEffect.particles.forEach(particle => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    particle.vx *= 0.98;
                    particle.vy *= 0.98;
                    particle.alpha *= 0.98;
                });
            }
        }

        // レベルアップ猶予期間の更新
        if (this.levelUpGrace.active) {
            const elapsed = now - this.levelUpGrace.timer;
            if (elapsed > this.levelUpGrace.duration) {
                this.levelUpGrace.active = false;
            }
        }
    }

    // エフェクトを描画
    draw(canvas, ctx, player, level) {
        // 波紋エフェクトの描画
        this.rippleEffects.forEach(ripple => {
            ctx.strokeStyle = `rgba(100, 200, 255, ${ripple.alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        // ボス警告テロップの描画
        if (this.bossWarning.active && this.bossWarning.slideProgress > 0) {
            const textWidth = 400;
            const textHeight = 60;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2 - 100;

            const leftX = centerX - textWidth / 2 - (1 - this.bossWarning.slideProgress) * canvas.width / 2;
            const rightX = centerX + textWidth / 2 + (1 - this.bossWarning.slideProgress) * canvas.width / 2;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(leftX, centerY - textHeight / 2, rightX - leftX, textHeight);

            ctx.fillStyle = '#ff0000';
            ctx.font = `bold ${48}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('WARNING', centerX, centerY + 15);
        }

        // ボス立ち絵の描画
        if (this.bossPortrait.active && this.bossPortrait.alpha > 0) {
            ctx.globalAlpha = this.bossPortrait.alpha * 0.3;
            ctx.fillStyle = '#ff0000';
            const portraitSize = 200;
            const portraitX = canvas.width / 2 - portraitSize / 2;
            const portraitY = canvas.height / 2 - portraitSize / 2;
            ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
            ctx.globalAlpha = 1.0;
        }

        // レベルアップ猶予期間のメッセージ表示
        if (this.levelUpGrace.active) {
            const elapsed = Date.now() - this.levelUpGrace.timer;
            const progress = Math.min(1, elapsed / this.levelUpGrace.duration);
            const alpha = 1 - Math.abs(progress - 0.5) * 2;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);

            ctx.fillStyle = '#00ff00';
            ctx.font = `bold ${Math.max(24, canvas.width / 20)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`LEVEL ${level}`, canvas.width / 2, canvas.height / 2);

            ctx.fillStyle = '#ffff00';
            ctx.font = `${Math.max(16, canvas.width / 30)}px Arial`;
            const timeLeft = Math.ceil((this.levelUpGrace.duration - elapsed) / 1000);
            ctx.fillText(`準備時間: ${timeLeft}秒`, canvas.width / 2, canvas.height / 2 + 30);

            ctx.globalAlpha = 1.0;
        }

        // 画面フラッシュの描画（最前面）
        if (this.screenFlash.active) {
            const elapsed = Date.now() - this.screenFlash.timer;
            const flashAlpha = Math.max(0, 1 - elapsed / this.screenFlash.duration);
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.25})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // パワーアップエフェクトの描画
        if (this.powerupEffect.active) {
            const elapsed = Date.now() - this.powerupEffect.timer;
            const progress = Math.min(1, elapsed / this.powerupEffect.duration);
            const alpha = 1 - progress;

            this.powerupEffect.particles.forEach(particle => {
                ctx.globalAlpha = particle.alpha * alpha;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });

            const glowSize = 60 + Math.sin(progress * Math.PI * 4) * 10;
            const gradient = ctx.createRadialGradient(
                player.x + player.width / 2,
                player.y + player.height / 2,
                0,
                player.x + player.width / 2,
                player.y + player.height / 2,
                glowSize
            );
            gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha * 0.6})`);
            gradient.addColorStop(0.5, `rgba(255, 200, 0, ${alpha * 0.3})`);
            gradient.addColorStop(1, `rgba(255, 200, 0, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(player.x + player.width / 2, player.y + player.height / 2, glowSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1.0;
        }
    }

    // プレイヤーの点滅アルファを取得
    getPlayerBlinkAlpha() {
        if (!this.playerBlink.active) return 1.0;
        return Math.floor((Date.now() - this.playerBlink.timer) / 100) % 2 === 0 ? 1.0 : 0.5;
    }

    // リセット
    reset() {
        this.screenFlash.active = false;
        this.playerBlink.active = false;
        this.rippleEffects = [];
        this.bossWarning.active = false;
        this.bossPortrait.active = false;
        this.powerupEffect.active = false;
        this.powerupEffect.particles = [];
        this.levelUpGrace.active = false;
        this.levelUpGrace.timer = 0;
    }
}


