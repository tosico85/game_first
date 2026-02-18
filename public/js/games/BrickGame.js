export class BrickGame {
    constructor(canvas, ctx, onGameOver) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onGameOver = onGameOver;

        this.GAME_WIDTH = 480;
        this.GAME_HEIGHT = 800;

        this.paddle = { x: 0, width: 100, height: 20 };
        this.ball = { x: 0, y: 0, r: 8, dx: 0, dy: 0, speed: 6 };
        this.bricks = [];
        this.score = 0;
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.score = 0;
        this.paddle.x = this.GAME_WIDTH / 2 - this.paddle.width / 2;

        // Ball Start
        this.ball.x = this.GAME_WIDTH / 2;
        this.ball.y = this.GAME_HEIGHT - 50;
        this.ball.dx = 4;
        this.ball.dy = -4;

        // Create Bricks
        this.createBricks();

        this.touchX = null;
        this.keys = {};
    }

    createBricks() {
        this.bricks = [];
        const rows = 8;
        const cols = 6;
        const padding = 10;
        const width = (this.GAME_WIDTH - (cols + 1) * padding) / cols;
        const height = 25;

        const colors = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad'];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.bricks.push({
                    x: c * (width + padding) + padding,
                    y: r * (height + padding) + 60,
                    w: width,
                    h: height,
                    status: 1,
                    color: colors[r % colors.length]
                });
            }
        }
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
        // Paddle Move
        if (this.keys['ArrowLeft']) this.paddle.x -= 7;
        if (this.keys['ArrowRight']) this.paddle.x += 7;

        if (this.touchX !== null) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.GAME_WIDTH / rect.width;
            const relX = (this.touchX - rect.left) * scaleX;
            this.paddle.x = relX - this.paddle.width / 2;
        }

        // Paddle Bounds
        if (this.paddle.x < 0) this.paddle.x = 0;
        if (this.paddle.x + this.paddle.width > this.canvas.width) this.paddle.x = this.canvas.width - this.paddle.width;

        // Ball Move
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Wall Collisions
        if (this.ball.x + this.ball.r > this.canvas.width || this.ball.x - this.ball.r < 0) this.ball.dx *= -1;
        if (this.ball.y - this.ball.r < 0) this.ball.dy *= -1;

        // Floor Collision (Game Over)
        if (this.ball.y + this.ball.r > this.canvas.height) {
            this.onGameOver(this.score);
            return;
        }

        // Paddle Collision
        if (this.ball.y + this.ball.r > this.GAME_HEIGHT - 30 && // Paddle Base Y check
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width &&
            this.ball.dy > 0) { // Only if falling

            this.ball.dy *= -1;
            // Add some spin/angle change based on hit position
            const hitPoint = this.ball.x - (this.paddle.x + this.paddle.width / 2);
            this.ball.dx = hitPoint * 0.15;

            // Speed up slightly
            this.ball.dx *= 1.05;
            this.ball.dy *= 1.05;
        }

        // Brick Collision
        let activeBricks = 0;
        for (let b of this.bricks) {
            if (b.status === 1) {
                activeBricks++;
                if (this.ball.x > b.x && this.ball.x < b.x + b.w &&
                    this.ball.y > b.y && this.ball.y < b.y + b.h) {
                    this.ball.dy *= -1;
                    b.status = 0;
                    this.score += 20;
                }
            }
        }

        if (activeBricks === 0) {
            // Level Cleared - reset bricks, speed up ?
            this.createBricks();
            this.ball.x = this.GAME_WIDTH / 2;
            this.ball.y = this.GAME_HEIGHT / 2;
            this.ball.speed += 1;
        }
    }

    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Paddle
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(this.paddle.x, this.GAME_HEIGHT - 30, this.paddle.width, this.paddle.height);

        // Ball
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        this.ctx.fill();

        // Bricks
        for (let b of this.bricks) {
            if (b.status === 1) {
                this.ctx.fillStyle = b.color;
                this.ctx.fillRect(b.x, b.y, b.w, b.h);
                this.ctx.strokeStyle = '#111';
                this.ctx.strokeRect(b.x, b.y, b.w, b.h);
            }
        }

        document.getElementById('score-display').textContent = `Score: ${this.score}`;
    }
}
