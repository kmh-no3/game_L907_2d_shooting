// オーディオシステム

let audioContext;
let bgmAudio = null;
let currentBGM = null;
let soundEnabled = true;
let bgmVolume = 0.3;
let seVolume = 0.5;

// サウンドエフェクト（Web Audio APIで生成）
const sounds = {
    shoot: null,
    explosion: null,
    powerup: null,
    hit: null,
    explosiveHit: null,
    laserHit: null
};

// サウンドを初期化
export function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createSounds();
    } catch (e) {
        console.warn('オーディオコンテキストの初期化に失敗しました:', e);
        soundEnabled = false;
    }
}

// サウンドエフェクトを生成
function createSounds() {
    // 発射音（短いビープ音）
    sounds.shoot = () => {
        if (!soundEnabled || !audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(seVolume * 0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };

    // 爆発音（低いノイズ）
    sounds.explosion = () => {
        if (!soundEnabled || !audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 100;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(seVolume * 0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };

    // パワーアップ音（上昇音）
    sounds.powerup = () => {
        if (!soundEnabled || !audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(seVolume * 0.15, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    };

    // 被弾音（警告音）
    sounds.hit = () => {
        if (!soundEnabled || !audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 200;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(seVolume * 0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    };

    // 爆発弾命中音（大きな爆発音）
    sounds.explosiveHit = () => {
        if (!soundEnabled || !audioContext) return;
        const time = audioContext.currentTime;

        // 低音の爆発音
        const lowOsc = audioContext.createOscillator();
        const lowGain = audioContext.createGain();
        lowOsc.connect(lowGain);
        lowGain.connect(audioContext.destination);
        lowOsc.frequency.value = 80;
        lowOsc.type = 'sawtooth';
        lowGain.gain.setValueAtTime(0, time);
        lowGain.gain.linearRampToValueAtTime(seVolume * 0.3, time + 0.01);
        lowGain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
        lowOsc.start(time);
        lowOsc.stop(time + 0.4);

        // 高音の爆発音（短い）
        const highOsc = audioContext.createOscillator();
        const highGain = audioContext.createGain();
        highOsc.connect(highGain);
        highGain.connect(audioContext.destination);
        highOsc.frequency.value = 300;
        highOsc.type = 'square';
        highGain.gain.setValueAtTime(0, time);
        highGain.gain.linearRampToValueAtTime(seVolume * 0.2, time + 0.01);
        highGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        highOsc.start(time);
        highOsc.stop(time + 0.15);
    };

    // レーザー命中音（ビーム音）
    sounds.laserHit = () => {
        if (!soundEnabled || !audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(seVolume * 0.25, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    };
}

// BGMを再生（ステージごとに異なる周波数パターン）
export function playBGM(stage, gameStateCallback) {
    if (!soundEnabled || !audioContext) return;

    // 既存のBGMを停止
    if (bgmAudio) {
        bgmAudio.stop();
        bgmAudio = null;
    }

    // ステージに応じた周波数パターン
    const patterns = {
        1: [440, 523, 659],
        2: [523, 659, 784],
        3: [659, 784, 988],
        4: [784, 988, 1175],
        5: [988, 1175, 1319],
        6: [1175, 1319, 1568],
        7: [1319, 1568, 1760],
        8: [1568, 1760, 1976],
        9: [1760, 1976, 2349],
        10: [1976, 2349, 2637]
    };

    const frequencies = patterns[Math.min(stage, 10)] || patterns[1];

    // シンプルなBGM（オシレーターの組み合わせ）
    const createBGMNote = (freq, time, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(bgmVolume * 0.1, time + 0.1);
        gainNode.gain.linearRampToValueAtTime(bgmVolume * 0.1, time + duration - 0.1);
        gainNode.gain.linearRampToValueAtTime(0, time + duration);
        oscillator.start(time);
        oscillator.stop(time + duration);
    };

    // BGMループ（簡易版：定期的に音を再生）
    let currentTime = audioContext.currentTime;
    const playBGMNotes = () => {
        frequencies.forEach((freq, index) => {
            createBGMNote(freq, currentTime + index * 0.5, 0.4);
        });
        currentTime += 1.5;
    };

    // 初回再生
    playBGMNotes();

    // ループ再生（簡易版）
    const bgmInterval = setInterval(() => {
        if (gameStateCallback() !== 'playing' || !soundEnabled) {
            clearInterval(bgmInterval);
            return;
        }
        playBGMNotes();
    }, 1500);

    currentBGM = { stage, interval: bgmInterval };
}

// サウンドエフェクトを再生
export function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName]();
    }
}

// 音量設定
export function setBGMVolume(volume) {
    bgmVolume = volume;
}

export function setSEVolume(volume) {
    seVolume = volume;
}

export function getBGMVolume() {
    return bgmVolume;
}

export function getSEVolume() {
    return seVolume;
}

