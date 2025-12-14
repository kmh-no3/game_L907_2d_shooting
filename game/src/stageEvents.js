// ステージイベント管理

import { CONFIG, EnemyType } from './config.js';
import { EnemySpawner } from './enemySpawner.js';

export class StageEventManager {
    constructor(canvas, enemySpawner) {
        this.canvas = canvas;
        this.enemySpawner = enemySpawner;
        this.stageEvent = {
            active: false,
            type: null,
            enemiesRemaining: 0,
            completed: false,
            bossRespawnCount: 0
        };
    }

    // ステージイベントを開始
    startStageEvent(level, enemies, effectManager) {
        this.stageEvent.active = true;
        this.stageEvent.completed = false;
        this.stageEvent.enemiesRemaining = 0;
        this.stageEvent.bossRespawnCount = 0;

        // レベルに応じてイベントタイプを決定
        let eventType;

        if (level >= 7) {
            eventType = 'boss';
        } else if (level >= 5) {
            eventType = Math.random() < 0.5 ? 'boss' : 'eliteSquad';
        } else if (level >= 3) {
            eventType = Math.random() < 0.5 ? 'eliteSquad' : 'fastSwarm';
        } else {
            eventType = Math.random() < 0.5 ? 'fastSwarm' : 'mixedWave';
        }

        this.stageEvent.type = eventType;

        // イベントタイプに応じて敵を生成
        if (eventType === 'boss') {
            this.enemySpawner.spawnBossEnemy(level, enemies, this.canvas);
            this.stageEvent.enemiesRemaining = 1;
            if (effectManager) {
                effectManager.triggerBossWarning();
            }
        } else if (eventType === 'eliteSquad') {
            const count = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                setTimeout(() => this.enemySpawner.spawnEliteEnemy(level, enemies), i * 500);
            }
            this.stageEvent.enemiesRemaining = count;
        } else if (eventType === 'fastSwarm') {
            const count = 5 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                setTimeout(() => this.enemySpawner.spawnFastEnemy(level, enemies), i * 300);
            }
            this.stageEvent.enemiesRemaining = count;
        } else if (eventType === 'mixedWave') {
            setTimeout(() => this.enemySpawner.spawnEnemyOfType(EnemyType.MEDIUM, level, enemies), 0);
            setTimeout(() => this.enemySpawner.spawnEnemyOfType(EnemyType.MEDIUM, level, enemies), 500);
            setTimeout(() => this.enemySpawner.spawnEnemyOfType(EnemyType.FAST, level, enemies), 1000);
            setTimeout(() => this.enemySpawner.spawnEnemyOfType(EnemyType.FAST, level, enemies), 1300);
            setTimeout(() => this.enemySpawner.spawnEnemyOfType(EnemyType.FAST, level, enemies), 1600);
            this.stageEvent.enemiesRemaining = 5;
        }
    }

    // ステージイベントを更新
    update(deltaTime) {
        // イベント中の追加処理（必要に応じて）
    }

    // 敵が倒された
    onEnemyKilled(enemies) {
        if (this.stageEvent.active) {
            this.stageEvent.enemiesRemaining = Math.max(0, this.stageEvent.enemiesRemaining - 1);
        }
    }

    // 敵が画面外に出た
    onEnemyOutOfBounds(enemies, level, effectManager) {
        if (this.stageEvent.active) {
            this.stageEvent.enemiesRemaining = Math.max(0, this.stageEvent.enemiesRemaining - 1);
            
            // ボス戦の場合、画面外に出たら再生成する（最大3回まで）
            if (this.stageEvent.type === 'boss') {
                const bossEnemies = enemies.filter(e => e.type === EnemyType.BOSS);
                if (bossEnemies.length === 0 && this.stageEvent.bossRespawnCount < 3) {
                    this.stageEvent.bossRespawnCount++;
                    setTimeout(() => {
                        if (this.stageEvent.active && this.stageEvent.enemiesRemaining === 0) {
                            this.enemySpawner.spawnBossEnemy(level, enemies, this.canvas);
                            this.stageEvent.enemiesRemaining = 1;
                        }
                    }, 1000);
                } else if (this.stageEvent.bossRespawnCount >= 3) {
                    // 3回再生成しても倒せなかった場合は、イベントをクリア（失敗扱い）
                    this.completeStageEvent();
                }
            }
            
            // 全ての敵が画面外に出た場合、イベントをクリア（ボス戦以外）
            if (this.stageEvent.enemiesRemaining <= 0 && this.stageEvent.type !== 'boss') {
                this.completeStageEvent();
            }
        }
    }

    // ステージイベントを完了
    completeStageEvent() {
        this.stageEvent.active = false;
        this.stageEvent.completed = true;
        this.stageEvent.enemiesRemaining = 0;
        this.stageEvent.bossRespawnCount = 0;
    }

    // ステージイベントが完了したか
    isCompleted() {
        return this.stageEvent.completed;
    }

    // ステージイベントがアクティブか
    isActive() {
        return this.stageEvent.active;
    }

    // ステージイベント情報を取得
    getStageEvent() {
        return this.stageEvent;
    }

    // リセット
    reset() {
        this.stageEvent.active = false;
        this.stageEvent.completed = false;
        this.stageEvent.enemiesRemaining = 0;
        this.stageEvent.bossRespawnCount = 0;
        this.stageEvent.type = null;
    }
}

