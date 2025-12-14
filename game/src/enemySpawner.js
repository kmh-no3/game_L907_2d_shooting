// 敵の生成システム

import { EnemyType } from './config.js';
import { Enemy } from './gameObjects.js';

export class EnemySpawner {
    constructor(canvas) {
        this.canvas = canvas;
    }

    // 敵を生成（ランダム）
    spawnEnemy(level, enemies, effectManager) {
        const enemyTypes = Object.keys(EnemyType);
        let selectedType;

        // レベルに応じて出現率を調整
        const rand = Math.random();
        let bossChance = 0;
        let largeChance = 0;
        let mediumChance = 0;
        let fastChance = 0.4;

        if (level >= 7) {
            bossChance = 0.1 + Math.min(0.15, (level - 7) * 0.05);
        }
        if (level >= 5) {
            largeChance = 0.2 + Math.min(0.3, (level - 5) * 0.1);
        }
        if (level >= 3) {
            mediumChance = 0.3 + Math.min(0.3, (level - 3) * 0.1);
        }
        fastChance = Math.min(0.6, 0.4 + (level - 1) * 0.05);

        // 累積確率で判定
        if (level >= 7 && rand < bossChance) {
            selectedType = EnemyType.BOSS;
            if (effectManager) {
                effectManager.triggerBossWarning();
            }
        } else if (level >= 5 && rand < bossChance + largeChance) {
            selectedType = EnemyType.LARGE;
        } else if (level >= 3 && rand < bossChance + largeChance + mediumChance) {
            selectedType = EnemyType.MEDIUM;
        } else if (rand < bossChance + largeChance + mediumChance + fastChance) {
            selectedType = EnemyType.FAST;
        } else {
            selectedType = EnemyType.NORMAL;
        }

        const sizeRange = selectedType.size;
        const enemySize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
        const x = Math.random() * (this.canvas.width - enemySize);
        const y = -enemySize;

        enemies.push(new Enemy(x, y, selectedType, level));
    }

    // ボス敵を生成
    spawnBossEnemy(level, enemies, canvas) {
        const bossType = EnemyType.BOSS;
        const sizeRange = bossType.size;
        const enemySize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
        const x = canvas.width / 2 - enemySize / 2;
        const y = -enemySize;

        const enemy = new Enemy(x, y, bossType, level);
        // ボスはレベルに応じてHPが増える
        enemy.health = bossType.health + Math.floor(level / 3);
        enemy.maxHealth = enemy.health;
        enemies.push(enemy);
    }

    // エリート敵を生成
    spawnEliteEnemy(level, enemies) {
        const eliteType = EnemyType.ELITE;
        const sizeRange = eliteType.size;
        const enemySize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
        const x = Math.random() * (this.canvas.width - enemySize);
        const y = -enemySize;

        enemies.push(new Enemy(x, y, eliteType, level));
    }

    // 高速敵を生成
    spawnFastEnemy(level, enemies) {
        const fastType = EnemyType.FAST;
        const sizeRange = fastType.size;
        const enemySize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
        const x = Math.random() * (this.canvas.width - enemySize);
        const y = -enemySize;

        enemies.push(new Enemy(x, y, fastType, level));
    }

    // 指定タイプの敵を生成
    spawnEnemyOfType(enemyType, level, enemies) {
        const sizeRange = enemyType.size;
        const enemySize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
        const x = Math.random() * (this.canvas.width - enemySize);
        const y = -enemySize;

        enemies.push(new Enemy(x, y, enemyType, level));
    }
}


