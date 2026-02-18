export class SnakeGame {
    constructor(canvas, ctx, onGameOver) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onGameOver = onGameOver;
        this.gridSize = 25;
        this.tileCountX = 20;
        this.tileCountY = 20;
        this.score = 0;
        this.timer = 0;
        this.speed = 100; // ms per move
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.snake = [{ x: 10, y: 10 }];
        this.trail = [];
        this.tailLength = 5;
        this.velX = 0;
        this.velY = 0;
        this.apple = { x: 15, y: 15 };
        this.score = 0;
        this.speed = 100;
        this.timer = 0;

        // Start moving right by default? No, wait for input.
    }

    resizeCanvas() {
        // Snake game logic is easier with fixed grid, but we need to scale the drawing
        // We will keep internal logic based on tile counts, but draw scaled.
        // Actually, let's fit the canvas to window, and calculate tile size dynamically or center the board.
        // For simplicity, let's fill screen and adjust tileCount based on size, OR keep fixed aspect ratio.
        // Let's go with fixed aspect ratio game board centered.

        // Let's use the same Strategy as Dodge: fixed internal resolution, scaled display
        this.GAME_WIDTH = 500;
        this.GAME_HEIGHT = 500; // Square for Snake usually best, or 400x600

        const scaleX = window.innerWidth / this.GAME_WIDTH;
        const scaleY = window.innerHeight / this.GAME_HEIGHT;
        const scale = Math.min(scaleX, scaleY);

        this.canvas.width = this.GAME_WIDTH;
        this.canvas.height = this.GAME_HEIGHT;
        this.canvas.style.width = `${this.GAME_WIDTH * scale}px`;
        this.canvas.style.height = `${this.GAME_HEIGHT * scale}px`;

        this.tileCountX = this.GAME_WIDTH / this.gridSize;
        this.tileCountY = this.GAME_HEIGHT / this.gridSize;
    }

    handleInput(e) {
        if (e.type === 'keydown') {
            switch (e.code) {
                case 'ArrowLeft': if (this.velX !== 1) { this.velX = -1; this.velY = 0; } break;
                case 'ArrowRight': if (this.velX !== -1) { this.velX = 1; this.velY = 0; } break;
                case 'ArrowUp': if (this.velY !== 1) { this.velX = 0; this.velY = -1; } break;
                case 'ArrowDown': if (this.velY !== -1) { this.velX = 0; this.velY = 1; } break;
            }
        }

        // Simple Touch Swipe Control
        if (e.type === 'touchstart') {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }
        if (e.type === 'touchend') {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - this.touchStartX;
            const dy = touchEndY - this.touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && this.velX !== -1) { this.velX = 1; this.velY = 0; }
                else if (dx < 0 && this.velX !== 1) { this.velX = -1; this.velY = 0; }
            } else {
                if (dy > 0 && this.velY !== -1) { this.velX = 0; this.velY = 1; }
                else if (dy < 0 && this.velY !== 1) { this.velX = 0; this.velY = -1; }
            }
        }
    }

    update(dt) {
        this.timer += dt;
        if (this.timer < this.speed) return;
        this.timer = 0;

        // Move
        const head = { x: this.snake[0].x + this.velX, y: this.snake[0].y + this.velY };

        // If not moving yet, don't update
        if (this.velX === 0 && this.velY === 0) return;

        // Creating wrap-around logic or wall-death? User asked for "Snake Game" usually wall death or wrap.
        // Classic Snake often has walls. Let's do wall death for difficulty.
        if (head.x < 0 || head.x >= this.tileCountX || head.y < 0 || head.y >= this.tileCountY) {
            this.onGameOver(this.score);
            return;
        }

        // Self collision
        for (let t of this.snake) {
            if (head.x === t.x && head.y === t.y) {
                this.onGameOver(this.score);
                return;
            }
        }

        this.snake.unshift(head);

        // Apple collision
        if (head.x === this.apple.x && head.y === this.apple.y) {
            this.score += 100;
            this.tailLength++; // Grow
            // Respawn Apple
            let valid = false;
            while (!valid) {
                this.apple.x = Math.floor(Math.random() * this.tileCountX);
                this.apple.y = Math.floor(Math.random() * this.tileCountY);
                valid = true;
                for (let t of this.snake) {
                    if (this.apple.x === t.x && this.apple.y === t.y) valid = false;
                }
            }
            // Speed up slightly
            this.speed = Math.max(50, this.speed - 1);
        } else {
            this.snake.pop(); // Remove tail if not ate apple
        }
    }

    draw() {
        this.ctx.fillStyle = '#222'; // Snake BG often dark
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apple
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc((this.apple.x * this.gridSize) + this.gridSize / 2, (this.apple.y * this.gridSize) + this.gridSize / 2, this.gridSize / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Snake
        this.ctx.fillStyle = 'lime';
        for (let t of this.snake) {
            this.ctx.fillRect(t.x * this.gridSize + 1, t.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
        }

        // Score
        document.getElementById('score-display').textContent = `Score: ${this.score}`;
    }
}
