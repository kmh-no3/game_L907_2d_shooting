// ユーティリティ関数

// 衝突判定
export function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

// 距離計算
export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ハイスコアの読み込み
export function loadHighScore() {
    const saved = localStorage.getItem('shootingGameHighScore');
    return saved ? parseInt(saved, 10) : 0;
}

// ハイスコアの保存
export function saveHighScore(score, currentHighScore) {
    if (score > currentHighScore) {
        localStorage.setItem('shootingGameHighScore', score.toString());
        return score;
    }
    return currentHighScore;
}

// タッチ位置を取得する関数
export function getTouchPosition(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    } else {
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
}

