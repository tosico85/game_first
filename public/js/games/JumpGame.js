export class JumpGame {
    constructor(canvas, ctx, onGameOver) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onGameOver = onGameOver;
        this.GAME_WIDTH = 480;
        this.GAME_HEIGHT = 800;

        this.player = {
            x: 0,
            y: 0,
            width: 30,
            height: 30,
            vx: 0,
            vy: 0,
            speed: 5,
            jumpForce: -15,
            gravity: 0.6
        };

        this.platforms = [];
        this.cameraY = 0;
        this.score = 0;
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.score = 0;
        this.cameraY = 0;
        this.player.x = this.GAME_WIDTH / 2 - this.player.width / 2;
        this.player.y = this.GAME_HEIGHT - 100;
        this.player.vx = 0;
        this.player.vy = 0;

        this.platforms = [];
        // Start platform
        this.platforms.push({ x: this.GAME_WIDTH / 2 - 50, y: this.GAME_HEIGHT - 50, w: 100, h: 20 });

        // Generate initial platforms
        let y = this.GAME_HEIGHT - 150;
        while (y > -1000) {
            this.addPlatform(y);
            y -= 100 + Math.random() * 50;
        }

        this.keys = {};
        this.touchX = null;
    }

    addPlatform(y) {
        const w = 80 + Math.random() * 40;
        const x = Math.random() * (this.GAME_WIDTH - w);
        this.platforms.push({ x, y, w, h: 20 });
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
            this.touchX = null;
        }
    }

    update(dt) {
        // Horizontal Movement
        if (this.keys['ArrowLeft']) this.player.vx = -this.player.speed;
        else if (this.keys['ArrowRight']) this.player.vx = this.player.speed;
        else this.player.vx = 0;

        if (this.touchX !== null) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.GAME_WIDTH / rect.width;
            const relX = (this.touchX - rect.left) * scaleX;
            const center = this.player.x + this.player.width / 2;
            if (Math.abs(relX - center) > 5) {
                this.player.vx = (relX > center) ? this.player.speed : -this.player.speed;
            }
        }

        this.player.x += this.player.vx;

        // Wrap around horizontally
        if (this.player.x + this.player.width < 0) this.player.x = this.GAME_WIDTH;
        else if (this.player.x > this.GAME_WIDTH) this.player.x = -this.player.width;

        // Vertical Movement
        this.player.vy += this.player.gravity;
        this.player.y += this.player.vy;

        // Collision with Platforms (Only when falling)
        if (this.player.vy > 0) {
            for (let p of this.platforms) {
                // Check if player feet are within platform height
                if (this.player.y + this.player.height > p.y &&
                    this.player.y + this.player.height < p.y + p.h + this.player.vy && // Prevent falling through fast
                    this.player.x + this.player.width > p.x &&
                    this.player.x < p.x + p.w) {

                    this.player.vy = this.player.jumpForce;
                    this.player.y = p.y - this.player.height;
                }
            }
        }

        // Camera Logic
        if (this.player.y < this.GAME_HEIGHT / 2) {
            const diff = (this.GAME_HEIGHT / 2) - this.player.y;
            this.player.y += diff;
            for (let p of this.platforms) {
                p.y += diff;
                if (p.y > this.GAME_HEIGHT) {
                    // Recycle platform to top
                    p.y = -50 - Math.random() * 50;
                    p.x = Math.random() * (this.GAME_WIDTH - p.w);
                    this.score += 10;
                }
            }
        }

        // Game Over - Fall off screen
        if (this.player.y > this.GAME_HEIGHT) {
            this.onGameOver(this.score);
        }
    }

    draw() {
        this.ctx.fillStyle = '#87CEEB'; // Sky blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Platforms
        this.ctx.fillStyle = '#2ecc71';
        for (let p of this.platforms) {
            this.ctx.fillRect(p.x, p.y, p.w, p.h);
        }

        // Player (Simple box for now)
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Score
        document.getElementById('score-display').textContent = `Score: ${this.score}`;
    }
}
