export class FlappyGame {
    constructor(canvas, ctx, onGameOver) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onGameOver = onGameOver;
        this.GAME_WIDTH = 480;
        this.GAME_HEIGHT = 800;

        this.bird = {
            x: 50,
            y: 0,
            width: 30,
            height: 30,
            vy: 0,
            gravity: 0.5,
            jump: -8
        };

        this.pipes = [];
        this.pipeSpeed = 3;
        this.gap = 180;
        this.pipeTimer = 0;
        this.score = 0;
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.bird.y = this.GAME_HEIGHT / 2;
        this.bird.vy = 0;
        this.pipes = [];
        this.score = 0;
        this.pipeTimer = 0;

        this.keys = {};
        this.canJump = true;
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
        if (e.type === 'keydown' && e.code === 'Space') {
            this.jump();
            e.preventDefault();
        }
        if (e.type === 'touchstart') {
            this.jump();
            e.preventDefault();
        }
    }

    jump() {
        this.bird.vy = this.bird.jump;
    }

    update(dt) {
        // Physics
        this.bird.vy += this.bird.gravity;
        this.bird.y += this.bird.vy;

        // Ground/Ceiling
        if (this.bird.y + this.bird.height > this.GAME_HEIGHT || this.bird.y < 0) {
            this.onGameOver(this.score);
            return;
        }

        // Move Pipes
        this.pipeTimer += dt;
        if (this.pipeTimer > 2000) { // Spawn every 2 seconds roughly
            this.spawnPipe();
            this.pipeTimer = 0;
        }

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= this.pipeSpeed;

            // Collision
            if (this.checkCollision(this.bird, p)) {
                this.onGameOver(this.score);
                return;
            }

            // Remove off-screen
            if (p.x + p.width < 0) {
                this.pipes.splice(i, 1);
                this.score++;
            }
        }
    }

    spawnPipe() {
        const minHeight = 100;
        const maxHeight = this.GAME_HEIGHT - this.gap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

        // Top Pipe
        this.pipes.push({
            x: this.GAME_WIDTH,
            y: 0,
            width: 60,
            height: topHeight,
            type: 'top'
        });

        // Bottom Pipe
        this.pipes.push({
            x: this.GAME_WIDTH,
            y: topHeight + this.gap,
            width: 60,
            height: this.GAME_HEIGHT - (topHeight + this.gap),
            type: 'bottom'
        });
    }

    checkCollision(bird, pipe) {
        return (
            bird.x < pipe.x + pipe.width &&
            bird.x + bird.width > pipe.x &&
            bird.y < pipe.y + pipe.height &&
            bird.y + bird.height > pipe.y
        );
    }

    draw() {
        this.ctx.fillStyle = '#70c5ce'; // Flappy Bird Blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pipes
        this.ctx.fillStyle = '#2ecc71';
        for (let p of this.pipes) {
            this.ctx.fillRect(p.x, p.y, p.width, p.height);
            this.ctx.strokeStyle = '#27ae60';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(p.x, p.y, p.width, p.height);
        }

        // Bird
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);

        // Score
        document.getElementById('score-display').textContent = `Score: ${this.score}`;
    }
}
