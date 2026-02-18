export class GameManager {
    constructor() {
        this.currentGame = null;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameLoopId = null;
        this.lastTime = 0;
    }

    startGame(GameClass, onGameOver) {
        if (this.currentGame) {
            this.stopGame();
        }

        this.currentGame = new GameClass(this.canvas, this.ctx, (score) => {
            this.stopGame();
            onGameOver(score);
        });

        // Initialize game
        if (this.currentGame.init) {
            this.currentGame.init();
        }

        this.lastTime = performance.now();
        this.gameLoopId = requestAnimationFrame(this.loop.bind(this));

        // Input handling
        this.handleInput = (e) => {
            if (this.currentGame && this.currentGame.handleInput) {
                this.currentGame.handleInput(e);
            }
        };

        window.addEventListener('keydown', this.handleInput);
        window.addEventListener('keyup', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleInput, { passive: false });
        this.canvas.addEventListener('touchend', this.handleInput);
    }

    stopGame() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
        }

        window.removeEventListener('keydown', this.handleInput);
        window.removeEventListener('keyup', this.handleInput);
        this.canvas.removeEventListener('touchstart', this.handleInput);
        this.canvas.removeEventListener('touchmove', this.handleInput);
        this.canvas.removeEventListener('touchend', this.handleInput);

        this.currentGame = null;
    }

    loop(timestamp) {
        if (!this.currentGame) return;

        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.currentGame.update) {
            this.currentGame.update(dt);
        }

        if (this.currentGame.draw) {
            this.currentGame.draw();
        }

        this.gameLoopId = requestAnimationFrame(this.loop.bind(this));
    }
}
