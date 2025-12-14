// パワーアップシステム

import { CONFIG, PowerupType, MAX_BULLET_COUNTS } from './config.js';

export class PowerupSystem {
    constructor() {
        this.powerups = {
            rapidFire: { active: false, timer: 0, duration: CONFIG.POWERUP.RAPID_FIRE.duration, pausedTime: 0 },
            multiShot: { active: false, timer: 0, duration: CONFIG.POWERUP.MULTI_SHOT.duration, pausedTime: 0 },
            speedBoost: { active: false, timer: 0, duration: CONFIG.POWERUP.SPEED_BOOST.duration, pausedTime: 0 },
            doubleScore: { active: false, timer: 0, duration: CONFIG.POWERUP.DOUBLE_SCORE.duration, pausedTime: 0 }
        };
    }

    // パワーアップを適用
    applyPowerup(type, player, bulletCounts, lives, shield, maxShield, maxLives, onPowerupEffect) {
        // パワーアップエフェクトを開始
        if (onPowerupEffect) {
            onPowerupEffect(type.color);
        }

        if (type === PowerupType.RAPID_FIRE) {
            this.powerups.rapidFire.active = true;
            this.powerups.rapidFire.timer = Date.now();
        } else if (type === PowerupType.MULTI_SHOT) {
            this.powerups.multiShot.active = true;
            this.powerups.multiShot.timer = Date.now();
        } else if (type === PowerupType.SPEED_BOOST) {
            this.powerups.speedBoost.active = true;
            this.powerups.speedBoost.timer = Date.now();
            player.speed = player.baseSpeed * CONFIG.POWERUP.SPEED_BOOST.speedMultiplier;
        } else if (type === PowerupType.DOUBLE_SCORE) {
            this.powerups.doubleScore.active = true;
            this.powerups.doubleScore.timer = Date.now();
        } else if (type === PowerupType.HEALTH) {
            return { lives: Math.min(maxLives, lives + 1) };
        } else if (type === PowerupType.EXPLOSIVE_AMMO) {
            bulletCounts.explosive = Math.min(MAX_BULLET_COUNTS.explosive, bulletCounts.explosive + 1);
        } else if (type === PowerupType.LASER_AMMO) {
            bulletCounts.laser = Math.min(MAX_BULLET_COUNTS.laser, bulletCounts.laser + 1);
        } else if (type === PowerupType.SHIELD_REGEN) {
            // シールド回復（50回復）
            const oldShield = shield;
            const newShield = Math.min(maxShield, shield + 50);
            // 満タンになった場合はボーナススコア
            let bonusScore = 0;
            if (oldShield < maxShield && newShield >= maxShield) {
                bonusScore = 100; // 満タンボーナス
            }
            return { shield: newShield, bonusScore: bonusScore };
        }

        return {};
    }

    // パワーアップの更新
    update(totalPausedTime, player) {
        const now = Date.now();
        const adjustedNow = now - totalPausedTime;

        if (this.powerups.rapidFire.active) {
            const elapsed = adjustedNow - this.powerups.rapidFire.timer;
            if (elapsed > this.powerups.rapidFire.duration) {
                this.powerups.rapidFire.active = false;
            }
        }
        if (this.powerups.multiShot.active) {
            const elapsed = adjustedNow - this.powerups.multiShot.timer;
            if (elapsed > this.powerups.multiShot.duration) {
                this.powerups.multiShot.active = false;
            }
        }
        if (this.powerups.speedBoost.active) {
            const elapsed = adjustedNow - this.powerups.speedBoost.timer;
            if (elapsed > this.powerups.speedBoost.duration) {
                this.powerups.speedBoost.active = false;
                player.speed = player.baseSpeed;
            }
        }
        if (this.powerups.doubleScore.active) {
            const elapsed = adjustedNow - this.powerups.doubleScore.timer;
            if (elapsed > this.powerups.doubleScore.duration) {
                this.powerups.doubleScore.active = false;
            }
        }
    }

    // 発射レートを取得
    getFireRate() {
        return this.powerups.rapidFire.active ? 100 : 200;
    }

    // マルチショットが有効か
    isMultiShotActive() {
        return this.powerups.multiShot.active;
    }

    // パワーアップ状態を取得
    getPowerups() {
        return this.powerups;
    }

    // リセット
    reset(player) {
        Object.keys(this.powerups).forEach(key => {
            this.powerups[key].active = false;
            this.powerups[key].timer = 0;
            this.powerups[key].pausedTime = 0;
        });
        player.speed = player.baseSpeed;
    }
}

