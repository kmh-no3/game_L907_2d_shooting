// ゲームオブジェクトのクラス定義

import { CONFIG, EnemyType } from './config.js';

// プレイヤークラス
export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.speed = CONFIG.PLAYER.BASE_SPEED;
        this.baseSpeed = CONFIG.PLAYER.BASE_SPEED;
        this.color = CONFIG.PLAYER.COLOR;
    }

    update(keys, canvas) {
        if (keys.left) {
            this.x = Math.max(0, this.x - this.speed);
        }
        if (keys.right) {
            this.x = Math.min(canvas.width - this.width, this.x + this.speed);
        }
    }

    draw(ctx, blinkAlpha = 1.0) {
        ctx.globalAlpha = blinkAlpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // プレイヤーの目
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 8, this.y + 8, 8, 8);
        ctx.fillRect(this.x + 24, this.y + 8, 8, 8);
        ctx.globalAlpha = 1.0;
    }
}

// 弾クラス
export class Bullet {
    constructor(x, y, type, angle = -Math.PI / 2) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.angle = angle;

        if (type === 'normal') {
            this.width = CONFIG.BULLET.NORMAL.WIDTH;
            this.height = CONFIG.BULLET.NORMAL.HEIGHT;
            this.speed = CONFIG.BULLET.NORMAL.SPEED;
            this.color = CONFIG.BULLET.NORMAL.COLOR;
        } else if (type === 'explosive') {
            this.width = CONFIG.BULLET.EXPLOSIVE.WIDTH;
            this.height = CONFIG.BULLET.EXPLOSIVE.HEIGHT;
            this.speed = CONFIG.BULLET.EXPLOSIVE.SPEED;
            this.color = CONFIG.BULLET.EXPLOSIVE.COLOR;
            this.radius = CONFIG.BULLET.EXPLOSIVE.RADIUS;
        } else if (type === 'laser') {
            this.width = CONFIG.BULLET.LASER.WIDTH;
            this.height = 0; // レーザーは高さが可変
            this.speed = 0;
            this.color = CONFIG.BULLET.LASER.COLOR;
            this.life = CONFIG.BULLET.LASER.LIFE;
        }
    }

    update(canvas) {
        if (this.type === 'laser') {
            this.life -= 0.02;
            return this.life > 0;
        } else {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            return this.y > -this.height && this.x > -this.width && this.x < canvas.width + this.width;
        }
    }

    draw(ctx) {
        if (this.type === 'laser') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.width;
            ctx.globalAlpha = this.life;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, 0);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = this.color;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle + Math.PI / 2);
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }
    }
}

// 敵クラス
export class Enemy {
    constructor(x, y, enemyType, level) {
        const sizeRange = enemyType.size;
        const enemySize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
        const speedMultiplier = 1 + (level - 1) * 0.1;
        const speed = (enemyType.speed.base + level * enemyType.speed.levelMultiplier) * speedMultiplier;

        this.x = x;
        this.y = y;
        this.width = enemySize;
        this.height = enemySize;
        this.speed = speed;
        this.color = enemyType.color;
        this.health = enemyType.health;
        this.maxHealth = enemyType.health;
        this.type = enemyType;
        this.shape = enemyType.shape;
    }

    update() {
        this.y += this.speed;
    }

    isOutOfBounds(canvas) {
        return this.y > canvas.height;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.shape === 'triangle') {
            // 三角形（高速敵）
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(-this.width / 2, this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 2);
            ctx.closePath();
            ctx.fill();

            // 目
            ctx.fillStyle = '#fff';
            ctx.fillRect(-this.width * 0.15, -this.height * 0.1, this.width * 0.15, this.height * 0.15);
            ctx.fillRect(this.width * 0.05, -this.height * 0.1, this.width * 0.15, this.height * 0.15);
        } else {
            // 四角形（通常敵、中型敵、大型敵、ボス敵）
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

            // ボス敵の場合は枠線を追加
            if (this.type === EnemyType.BOSS) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }

            // 目
            ctx.fillStyle = '#fff';
            const eyeSize = this.width * 0.2;
            ctx.fillRect(-this.width * 0.3, -this.height * 0.2, eyeSize, eyeSize);
            ctx.fillRect(this.width * 0.1, -this.height * 0.2, eyeSize, eyeSize);

            // ボス敵の場合はHPバーを表示
            if (this.type === EnemyType.BOSS && this.maxHealth > 1) {
                const barWidth = this.width * 0.8;
                const barHeight = 4;
                const barX = -barWidth / 2;
                const barY = -this.height / 2 - 8;

                // HPバーの背景
                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                // HPバー
                const hpRatio = this.health / this.maxHealth;
                ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.25 ? '#ffff00' : '#ff0000';
                ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
            }
        }

        ctx.restore();
    }
}

// アイテムクラス
export class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.ITEM.WIDTH;
        this.height = CONFIG.ITEM.HEIGHT;
        this.speed = CONFIG.ITEM.SPEED;
        this.type = type;
        this.rotation = 0;
    }

    update() {
        this.y += this.speed;
        this.rotation += 0.1;
    }

    isOutOfBounds(canvas) {
        return this.y > canvas.height;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.type.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }
}

// パーティクルクラス
export class Particle {
    constructor(x, y, color, count = 10) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                size: 2 + Math.random() * 3,
                color: color
            });
        }
    }

    update() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vy += 0.1; // 重力
            return particle.life > 0;
        });
        return this.particles.length > 0;
    }

    draw(ctx) {
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
        });
        ctx.globalAlpha = 1.0;
    }

    getParticles() {
        return this.particles;
    }
}

// 爆発クラス
export class Explosion {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = radius;
        this.life = 1.0;
        this.decay = 0.05;
    }

    update() {
        this.radius += 5;
        this.life -= this.decay;
        return this.life > 0 && this.radius < this.maxRadius;
    }

    draw(ctx) {
        const alpha = this.life;
        ctx.strokeStyle = `rgba(255, 102, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
}


