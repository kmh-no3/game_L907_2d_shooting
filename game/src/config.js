// ゲーム設定と定数

export const CONFIG = {
    // プレイヤー設定
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 40,
        BASE_SPEED: 5,
        COLOR: '#00ff00',
        INITIAL_LIVES: 3,
        MAX_LIVES: 5,
        INITIAL_SHIELD: 0,
        MAX_SHIELD: 100
    },

    // 弾の設定
    BULLET: {
        NORMAL: {
            WIDTH: 4,
            HEIGHT: 10,
            SPEED: 7,
            COLOR: '#ffff00'
        },
        EXPLOSIVE: {
            WIDTH: 6,
            HEIGHT: 12,
            SPEED: 6,
            COLOR: '#ff6600',
            RADIUS: 50
        },
        LASER: {
            WIDTH: 8,
            COLOR: '#00ffff',
            LIFE: 0.5
        }
    },

    // 弾の初期数
    INITIAL_BULLET_COUNTS: {
        normal: Infinity,
        explosive: 3,
        laser: 2
    },

    // 弾の最大数
    MAX_BULLET_COUNTS: {
        explosive: 10,
        laser: 5
    },

    // アイテム設定
    ITEM: {
        WIDTH: 20,
        HEIGHT: 20,
        SPEED: 2
    },

    // パワーアップ設定
    POWERUP: {
        RAPID_FIRE: { duration: 10000 },
        MULTI_SHOT: { duration: 15000 },
        SPEED_BOOST: { duration: 10000, speedMultiplier: 1.5 },
        DOUBLE_SCORE: { duration: 20000 }
    },

    // コンボ設定
    COMBO: {
        TIMEOUT: 3000, // 3秒
        BONUS_INTERVAL: 10, // 10コンボごとにボーナス
        MAX_MULTIPLIER: 2
    },

    // レベル設定
    LEVEL: {
        MAX: 10,
        UP_SCORE_INTERVAL: 500,
        GRACE_PERIOD: 3000 // 3秒
    },


    // エフェクト設定
    EFFECT: {
        SCREEN_FLASH_DURATION: 30,
        PLAYER_BLINK_DURATION: 200,
        BOSS_WARNING_DURATION: 2000,
        BOSS_PORTRAIT_DURATION: 3000,
        POWERUP_EFFECT_DURATION: 800
    },

    // サウンド設定
    SOUND: {
        BGM_VOLUME: 0.3,
        SE_VOLUME: 0.5
    },

    // 背景設定
    BACKGROUND: {
        PARTICLE_COUNT_BASE: 100,
        PARTICLE_COUNT_PER_LEVEL: 10,
        METEOR_CHANCE: 0.1
    }
};

// 敵のドロップ率
export const DROP_RATE = {
    NORMAL: 0.3,
    BOSS: 0.5
};

// パワーアップの種類
export const PowerupType = {
    RAPID_FIRE: { color: '#ff0000', name: '連射速度アップ', emoji: '🔴' },
    MULTI_SHOT: { color: '#0000ff', name: 'マルチショット', emoji: '🔵' },
    SPEED_BOOST: { color: '#00ff00', name: '移動速度アップ', emoji: '🟢' },
    DOUBLE_SCORE: { color: '#ffff00', name: 'スコア2倍', emoji: '🟡' },
    HEALTH: { color: '#ffffff', name: 'ライフ回復', emoji: '⚪' },
    EXPLOSIVE_AMMO: { color: '#ff6600', name: '爆発弾+1', emoji: '💣' },
    LASER_AMMO: { color: '#00ffff', name: 'レーザー弾+1', emoji: '⚡' },
    SHIELD_REGEN: { color: '#0066ff', name: 'シールド回復', emoji: '🛡️' }
};

// 敵の種類
export const EnemyType = {
    NORMAL: {
        name: '通常敵',
        size: { min: 25, max: 35 },
        speed: { base: 2, levelMultiplier: 0.5 },
        color: '#ff0000',
        score: 10,
        health: 1,
        shape: 'square'
    },
    FAST: {
        name: '高速敵',
        size: { min: 20, max: 30 },
        speed: { base: 3.5, levelMultiplier: 0.7 },
        color: '#ff6600',
        score: 20,
        health: 1,
        shape: 'triangle'
    },
    MEDIUM: {
        name: '中型敵',
        size: { min: 35, max: 45 },
        speed: { base: 1.5, levelMultiplier: 0.4 },
        color: '#ff00ff',
        score: 30,
        health: 1,
        shape: 'square'
    },
    LARGE: {
        name: '大型敵',
        size: { min: 45, max: 60 },
        speed: { base: 1, levelMultiplier: 0.3 },
        color: '#9900ff',
        score: 50,
        health: 1,
        shape: 'square'
    },
    BOSS: {
        name: 'ボス敵',
        size: { min: 55, max: 70 },
        speed: { base: 0.8, levelMultiplier: 0.2 },
        color: '#cc0000',
        score: 100,
        health: 2,
        shape: 'square'
    },
    ELITE: {
        name: 'エリート敵',
        size: { min: 40, max: 50 },
        speed: { base: 2.5, levelMultiplier: 0.6 },
        color: '#ff0088',
        score: 75,
        health: 2,
        shape: 'square'
    }
};

// レベルに応じた背景色
export function getBackgroundColor(level) {
    const colors = [
        { base: '#000000', gradient: ['#000000', '#001122'] },
        { base: '#000011', gradient: ['#000011', '#001133'] },
        { base: '#000022', gradient: ['#000022', '#002244'] },
        { base: '#110022', gradient: ['#110022', '#220044'] },
        { base: '#220011', gradient: ['#220011', '#440022'] },
        { base: '#330000', gradient: ['#330000', '#660000'] },
        { base: '#440000', gradient: ['#440000', '#880000'] },
        { base: '#330022', gradient: ['#330022', '#660044'] },
        { base: '#220033', gradient: ['#220033', '#440066'] },
        { base: '#000033', gradient: ['#000033', '#000066'] }
    ];
    return colors[Math.min(level - 1, 9)] || colors[0];
}

