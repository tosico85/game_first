export class DodgeGame {
    constructor(canvas, ctx, onGameOver) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onGameOver = onGameOver;

        this.score = 0;
        this.poops = [];
        this.spawnTimer = 0;

        this.player = {
            x: 0,
            y: 0,
            width: 30,
            height: 30,
            vx: 0,
            speed: 0.2,
            maxSpeed: 5,
            friction: 0.95,
            color: 'blue',
            animTick: 0
        };

        this.keys = {};
        this.touchX = null;

        this.GAME_WIDTH = 480;
        this.GAME_HEIGHT = 800;
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.score = 0;
        this.poops = [];
        this.player.x = this.GAME_WIDTH / 2 - this.player.width / 2;
        this.player.y = this.GAME_HEIGHT - this.player.height - 25;
        this.player.vx = 0;
    }

    resizeCanvas() {
        const scaleX = window.innerWidth / this.GAME_WIDTH;
        const scaleY = window.innerHeight / this.GAME_HEIGHT;
        const scale = Math.min(scaleX, scaleY);

        this.canvas.width = this.GAME_WIDTH;
        this.canvas.height = this.GAME_HEIGHT;

        this.canvas.style.width = `${this.GAME_WIDTH * scale}px`;
        this.canvas.style.height = `${this.GAME_HEIGHT * scale}px`;
    }

    handleInput(e) {
        if (e.type === 'keydown') this.keys[e.code] = true;
        if (e.type === 'keyup') this.keys[e.code] = false;

        if (e.type === 'touchstart' || e.type === 'touchmove') {
            e.preventDefault();
            this.touchX = e.touches[0].clientX;
        }
        if (e.type === 'touchend') {
            e.preventDefault();
            this.touchX = null;
        }
    }

    update(dt) {
        // Player Movement
        if (this.keys['ArrowLeft']) this.player.vx -= this.player.speed;
        if (this.keys['ArrowRight']) this.player.vx += this.player.speed;
        this.player.vx *= this.player.friction;

        if (this.player.vx > this.player.maxSpeed) this.player.vx = this.player.maxSpeed;
        if (this.player.vx < -this.player.maxSpeed) this.player.vx = -this.player.maxSpeed;
        this.player.x += this.player.vx;

        // Animation Tick
        if (Math.abs(this.player.vx) > 0.1) {
            this.player.animTick += 0.2 * Math.abs(this.player.vx);
        } else {
            this.player.animTick = 0;
        }

        // Touch
        if (this.touchX !== null) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.GAME_WIDTH / rect.width;
            const relX = (this.touchX - rect.left) * scaleX;
            const center = this.player.x + this.player.width / 2;
            const diff = relX - center;

            if (Math.abs(diff) > 5) {
                this.player.vx += (diff > 0 ? this.player.speed * 2 : -this.player.speed * 2);
            }
        }

        // Bounds
        if (this.player.x < 0) { this.player.x = 0; this.player.vx = 0; }
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
            this.player.vx = 0;
        }

        // Spawn
        this.spawnTimer += dt;
        const spawnThreshold = Math.max(100, 500 - this.score * 0.5);
        if (this.spawnTimer > spawnThreshold) {
            this.spawnTimer = 0;
            const size = Math.random() * 20 + 20;
            this.poops.push({
                x: Math.random() * (this.canvas.width - size),
                y: -size,
                width: size,
                height: size,
                speed: Math.random() * 3 + 3 + (this.score * 0.05),
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 0.1
            });
            this.score += 10;
        }

        // Update Poops
        for (let i = this.poops.length - 1; i >= 0; i--) {
            const p = this.poops[i];
            p.y += p.speed;
            p.rotation += p.rotSpeed;

            const hitX = p.x + 5;
            const hitY = p.y + 5;
            const hitW = p.width - 10;
            const hitH = p.height - 10;

            if (this.player.x < hitX + hitW && this.player.x + this.player.width > hitX &&
                this.player.y < hitY + hitH && this.player.y + this.player.height > hitY) {
                this.onGameOver(this.score);
                return;
            }
            if (p.y > this.canvas.height) this.poops.splice(i, 1);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Humanoid Rendering
        const centerX = this.player.x + this.player.width / 2;
        const groundY = this.player.y + this.player.height;

        this.ctx.strokeStyle = this.player.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        const headRadius = 8;
        const bodyLength = 15;
        const limbLength = 12;
        const bounce = Math.abs(Math.sin(this.player.animTick * 2)) * 2;
        const hipY = groundY - limbLength - bounce;
        const neckY = hipY - bodyLength;
        const headY = neckY - headRadius;

        // Head
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Body
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, neckY);
        this.ctx.lineTo(centerX, hipY);
        this.ctx.stroke();

        const swingRange = 0.8;
        const leftLegAngle = Math.sin(this.player.animTick) * swingRange;
        const leftFootX = centerX + Math.sin(leftLegAngle) * limbLength;
        const leftFootY = hipY + Math.cos(leftLegAngle) * limbLength;
        this.ctx.beginPath(); this.ctx.moveTo(centerX, hipY); this.ctx.lineTo(leftFootX, leftFootY); this.ctx.stroke();

        const leftArmAngle = -Math.sin(this.player.animTick) * swingRange;
        const leftHandX = centerX + Math.sin(leftArmAngle) * limbLength;
        const leftHandY = (neckY + 4) + Math.cos(leftArmAngle) * limbLength;
        this.ctx.beginPath(); this.ctx.moveTo(centerX, neckY + 4); this.ctx.lineTo(leftHandX, leftHandY); this.ctx.stroke();

        const rightLegAngle = -Math.sin(this.player.animTick) * swingRange;
        const rightFootX = centerX + Math.sin(rightLegAngle) * limbLength;
        const rightFootY = hipY + Math.cos(rightLegAngle) * limbLength;
        this.ctx.beginPath(); this.ctx.moveTo(centerX, hipY); this.ctx.lineTo(rightFootX, rightFootY); this.ctx.stroke();

        const rightArmAngle = Math.sin(this.player.animTick) * swingRange;
        const rightHandX = centerX + Math.sin(rightArmAngle) * limbLength;
        const rightHandY = (neckY + 4) + Math.cos(rightArmAngle) * limbLength;
        this.ctx.beginPath(); this.ctx.moveTo(centerX, neckY + 4); this.ctx.lineTo(rightHandX, rightHandY); this.ctx.stroke();

        // Face
        const lookDir = this.player.vx > 0.1 ? 1 : (this.player.vx < -0.1 ? -1 : 0);
        const eyeOffsetX = lookDir * 3;
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 3 + eyeOffsetX, headY - 1, 1.5, 0, Math.PI * 2);
        this.ctx.arc(centerX + 3 + eyeOffsetX, headY - 1, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Poops
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        for (const p of this.poops) {
            this.ctx.save();
            this.ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            this.ctx.rotate(p.rotation);
            this.ctx.font = `${p.width}px Arial`;
            this.ctx.fillText('💩', 0, 0);
            this.ctx.restore();
        }

        // Score (Drew externally usually, but nice to have in-game too or valid updates)
        document.getElementById('score-display').textContent = `Score: ${this.score}`;
    }
}
