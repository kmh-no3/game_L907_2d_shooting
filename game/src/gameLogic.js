// ゲームロジック（衝突判定、スコア計算、コンボシステム等）

import { CONFIG, EnemyType } from './config.js';
import { checkCollision, distance } from './utils.js';
import { playSound } from './audio.js';

// コンボシステム
export class ComboSystem {
    constructor() {
        this.combo = 0;
        this.lastComboTime = 0;
        this.comboTimeout = CONFIG.COMBO.TIMEOUT;
    }

    increase() {
        this.combo++;
        this.lastComboTime = Date.now();
        // コンボが10の倍数の場合はボーナススコア
        if (this.combo % CONFIG.COMBO.BONUS_INTERVAL === 0) {
            return this.combo * 10; // コンボボーナス
        }
        return 0;
    }

    update() {
        if (this.combo > 0 && this.lastComboTime > 0) {
            const timeSinceLastKill = Date.now() - this.lastComboTime;
            if (timeSinceLastKill > this.comboTimeout) {
                this.combo = 0;
                this.lastComboTime = 0;
            }
        }
    }

    reset() {
        this.combo = 0;
        this.lastComboTime = 0;
    }

    getMultiplier() {
        if (this.combo <= 0) return 1;
        return Math.min(CONFIG.COMBO.MAX_MULTIPLIER, 1 + this.combo * 0.05);
    }

    getCombo() {
        return this.combo;
    }

    getLastComboTime() {
        return this.lastComboTime;
    }
}

// スコア計算
export function calculateScore(enemyType, comboMultiplier, doubleScoreActive) {
    const baseScore = enemyType ? enemyType.score : 10;
    const doubleScoreMultiplier = doubleScoreActive ? 2 : 1;
    return Math.floor(baseScore * comboMultiplier * doubleScoreMultiplier);
}

// 弾と敵の衝突判定（通常弾・爆発弾）
export function checkBulletEnemyCollision(bullets, enemies, comboSystem, powerups, onEnemyKilled) {
    const killedEnemies = [];
    
    for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        const bullet = bullets[bulletIndex];
        if (bullet.type === 'laser') continue; // レーザーは別処理

        let bulletHit = false;

        for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
            const enemy = enemies[enemyIndex];
            if (checkCollision(bullet, enemy)) {
                const score = calculateScore(enemy.type, comboSystem.getMultiplier(), powerups.doubleScore.active);
                bulletHit = true;
                enemy.health--;

                if (bullet.type === 'explosive') {
                    // 爆発弾の処理
                    playSound('explosiveHit');
                    const explosion = {
                        x: enemy.x + enemy.width / 2,
                        y: enemy.y + enemy.height / 2,
                        radius: bullet.radius
                    };

                    // 範囲内の敵もダメージ
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
                                    const otherScore = calculateScore(otherEnemy.type, comboSystem.getMultiplier(), powerups.doubleScore.active);
                                    killedEnemies.push({
                                        enemy: otherEnemy,
                                        index: otherIndex,
                                        score: otherScore,
                                        explosion: null
                                    });
                                }
                            }
                        }
                    }
                }

                if (enemy.health <= 0) {
                    const dropRate = enemy.type === EnemyType.BOSS ? 0.5 : 0.3;
                    killedEnemies.push({
                        enemy: enemy,
                        index: enemyIndex,
                        score: score,
                        explosion: bullet.type === 'explosive' ? explosion : null,
                        dropItem: Math.random() < dropRate
                    });
                }
                break; // 1つの弾は1つの敵にしか当たらない（爆発弾は範囲内の敵も処理済み）
            }
        }

        if (bulletHit) {
            bullets.splice(bulletIndex, 1);
        }
    }

    return killedEnemies;
}

// レーザーと敵の衝突判定
export function checkLaserEnemyCollision(bullets, enemies, comboSystem, powerups, onEnemyKilled) {
    const killedEnemies = [];
    let laserHitSoundPlayed = false;

    for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        const bullet = bullets[bulletIndex];
        if (bullet.type !== 'laser') continue;

        for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
            const enemy = enemies[enemyIndex];
            if (enemy.x + enemy.width / 2 >= bullet.x - bullet.width / 2 &&
                enemy.x + enemy.width / 2 <= bullet.x + bullet.width / 2 &&
                enemy.y < bullet.y + bullet.height) {
                // レーザー専用の音を再生（最初の敵に当たった時のみ）
                if (!laserHitSoundPlayed) {
                    playSound('laserHit');
                    laserHitSoundPlayed = true;
                }

                const score = calculateScore(enemy.type, comboSystem.getMultiplier(), powerups.doubleScore.active);
                enemy.health--;

                if (enemy.health <= 0) {
                    const dropRate = enemy.type === EnemyType.BOSS ? 0.5 : 0.3;
                    killedEnemies.push({
                        enemy: enemy,
                        index: enemyIndex,
                        score: score,
                        dropItem: Math.random() < dropRate
                    });
                }
            }
        }
    }

    return killedEnemies;
}

// プレイヤーと敵の衝突判定
export function checkPlayerEnemyCollision(player, enemies, shield, maxShield) {
    for (const enemy of enemies) {
        if (checkCollision(enemy, player)) {
            // シールドがある場合はシールドを優先的に減らす
            let damage = 0;
            if (shield > 0) {
                // シールドが一定値以上（50以上）の場合はダメージを軽減（50%軽減）
                damage = shield >= 50 ? 15 : 30;
            } else {
                damage = 1; // ライフを1減らす
            }

            return {
                hit: true,
                damage: damage,
                isShieldDamage: shield > 0
            };
        }
    }
    return { hit: false };
}

// プレイヤーとアイテムの衝突判定
export function checkPlayerItemCollision(player, items) {
    const collectedItems = [];
    
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (checkCollision(item, player)) {
            collectedItems.push({
                item: item,
                index: i
            });
        }
    }

    return collectedItems;
}

