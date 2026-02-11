const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- SUPABASE CONFIGURATION ---
// IMPORTANT: Replace these with your own project URL and Anon Key from Supabase Dashboard
const SUPABASE_URL = 'https://acupfaolhbhixljmbyjc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_39wnJCZQNAFTR6l5iza5TA_-p7nnhdN';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Screens
const authScreen = document.getElementById('auth-screen');
const gameScreen = document.getElementById('game-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');

// Game State
let isPlaying = false;
let score = 0;
let user = null; // Supabase user object
let poops = [];
let gameLoopId;
let lastTime = 0;
let spawnTimer = 0;

// Player
const player = {
    x: 0,
    y: 0,
    width: 30,
    height: 30,
    vx: 0,
    speed: 0.5,
    maxSpeed: 8,
    friction: 0.92,
    color: 'blue',
    animTick: 0
};

// Input
const keys = {};
let touchX = null;

// --- Initialization ---
function resizeCanvas() {
    canvas.width = window.innerWidth > 480 ? 480 : window.innerWidth;
    canvas.height = window.innerHeight > 800 ? 800 : window.innerHeight;
    player.y = canvas.height - player.height - 25;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

checkSession(); // Check if user is already logged in

// --- Event Listeners ---
const googleBtn = document.getElementById('google-login-btn');
if (googleBtn) googleBtn.addEventListener('click', loginWithGoogle);

document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('in-game-restart-btn').addEventListener('click', startGame);
document.getElementById('logout-btn').addEventListener('click', logout);

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Touch Controls
canvas.addEventListener('touchstart', e => { e.preventDefault(); touchX = e.touches[0].clientX; });
canvas.addEventListener('touchmove', e => { e.preventDefault(); touchX = e.touches[0].clientX; });
canvas.addEventListener('touchend', e => { e.preventDefault(); touchX = null; });

// --- Supabase Auth & DB Functions ---

async function checkSession() {
    if (!supabaseClient) return;

    // Listen to auth state changes (This handles redirects!)
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session) {
                user = session.user;
                showScreen('game');
                startGame();
            }
        } else if (event === 'SIGNED_OUT') {
            user = null;
            showScreen('auth');
        }
    });

    // Check initial session
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        user = session.user;
        showScreen('game');
        startGame();
    } else {
        loadLeaderboard();
    }
}

async function loginWithGoogle() {
    if (!supabaseClient) {
        alert('Supabase 설정이 필요합니다. SETUP_SUPABASE.md를 확인하세요.');
        return;
    }
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.href
        }
    });
    if (error) alert(error.message);
}

async function logout() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    user = null;
    showScreen('auth');
    location.reload(); // Refresh to clean state
}

async function saveScore() {
    if (!user || !supabaseClient) return;

    // Insert score
    const { error } = await supabaseClient
        .from('scores')
        .insert({
            user_id: user.id,
            username: user.user_metadata.full_name || user.email.split('@')[0],
            score: score
        });

    if (error) console.error('Error saving score:', error);
}

async function loadLeaderboard() {
    if (!supabaseClient) return;

    // Select top 10 scores
    const { data, error } = await supabaseClient
        .from('scores')
        .select('username, score')
        .order('score', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error loading leaderboard:', error);
        return;
    }

    // Render to Auth Screen Preview (if exists)
    const previewList = document.getElementById('preview-leaderboard-list');
    if (previewList) {
        previewList.innerHTML = data.map((entry, i) =>
            `<li><span>${i + 1}. ${entry.username}</span> <span>${entry.score}</span></li>`
        ).join('');
    }

    // Render to Game Over Screen
    const list = document.getElementById('leaderboard-list');
    if (list) {
        list.innerHTML = '';
        data.forEach((entry, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${index + 1}. ${entry.username}</span> <span>${entry.score}점</span>`;
            list.appendChild(li);
        });
    }
}

// --- Game Logic ---
function showScreen(screenName) {
    authScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');

    if (screenName === 'auth') authScreen.classList.remove('hidden');
    else if (screenName === 'game') gameScreen.classList.remove('hidden');
    else if (screenName === 'leaderboard') leaderboardScreen.classList.remove('hidden');
}

function startGame() {
    showScreen('game');
    score = 0;
    poops = [];
    player.x = canvas.width / 2 - player.width / 2;
    player.vx = 0;
    document.getElementById('score-display').textContent = `Score: ${score}`;

    // Use Google name if available
    const nameState = user ? (user.user_metadata.full_name || user.email) : 'Guest';
    document.getElementById('player-name').textContent = nameState;

    isPlaying = true;
    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(gameLoopId);

    saveScore().then(() => {
        loadLeaderboard();
        document.getElementById('final-score').textContent = `Score: ${score}`;
        showScreen('leaderboard');
    });
}

function gameLoop(timestamp) {
    if (!isPlaying) return;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    update(dt);
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    // Player Movement
    if (keys['ArrowLeft']) player.vx -= player.speed;
    if (keys['ArrowRight']) player.vx += player.speed;
    player.vx *= player.friction;

    if (player.vx > player.maxSpeed) player.vx = player.maxSpeed;
    if (player.vx < -player.maxSpeed) player.vx = -player.maxSpeed;
    player.x += player.vx;

    // Animation Tick
    if (Math.abs(player.vx) > 0.1) {
        player.animTick += 0.2 * Math.abs(player.vx);
    } else {
        player.animTick = 0;
    }

    // Touch
    if (touchX !== null) {
        const rect = canvas.getBoundingClientRect();
        const relX = touchX - rect.left;
        const center = player.x + player.width / 2;
        const diff = relX - center;
        if (Math.abs(diff) > 5) {
            player.vx += (diff > 0 ? player.speed * 2 : -player.speed * 2);
        }
    }

    // Bounds
    if (player.x < 0) { player.x = 0; player.vx = 0; }
    if (player.x + player.width > canvas.width) { player.x = canvas.width - player.width; player.vx = 0; }

    // Spawn
    spawnTimer += dt;
    if (spawnTimer > 500) {
        spawnTimer = 0;
        const size = Math.random() * 20 + 20;
        poops.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: Math.random() * 2 + 2 + (score * 0.01),
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.1
        });
        score += 10;
        document.getElementById('score-display').textContent = `Score: ${score}`;
    }

    // Update Poops
    for (let i = poops.length - 1; i >= 0; i--) {
        const p = poops[i];
        p.y += p.speed;
        p.rotation += p.rotSpeed;

        const hitX = p.x + 5;
        const hitY = p.y + 5;
        const hitW = p.width - 10;
        const hitH = p.height - 10;
        if (player.x < hitX + hitW && player.x + player.width > hitX &&
            player.y < hitY + hitH && player.y + player.height > hitY) {
            gameOver();
            return;
        }
        if (p.y > canvas.height) poops.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Humanoid Rendering
    const centerX = player.x + player.width / 2;
    const groundY = player.y + player.height;

    ctx.strokeStyle = player.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const headRadius = 8;
    const bodyLength = 15;
    const limbLength = 12;
    const bounce = Math.abs(Math.sin(player.animTick * 2)) * 2;
    const hipY = groundY - limbLength - bounce;
    const neckY = hipY - bodyLength;
    const headY = neckY - headRadius;

    // Head
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(centerX, neckY);
    ctx.lineTo(centerX, hipY);
    ctx.stroke();

    const swingRange = 0.8;

    // Left Limbs
    const leftLegAngle = Math.sin(player.animTick) * swingRange;
    const leftFootX = centerX + Math.sin(leftLegAngle) * limbLength;
    const leftFootY = hipY + Math.cos(leftLegAngle) * limbLength;
    ctx.beginPath(); ctx.moveTo(centerX, hipY); ctx.lineTo(leftFootX, leftFootY); ctx.stroke();

    const leftArmAngle = -Math.sin(player.animTick) * swingRange;
    const leftHandX = centerX + Math.sin(leftArmAngle) * limbLength;
    const leftHandY = (neckY + 4) + Math.cos(leftArmAngle) * limbLength;
    ctx.beginPath(); ctx.moveTo(centerX, neckY + 4); ctx.lineTo(leftHandX, leftHandY); ctx.stroke();

    // Right Limbs
    const rightLegAngle = -Math.sin(player.animTick) * swingRange;
    const rightFootX = centerX + Math.sin(rightLegAngle) * limbLength;
    const rightFootY = hipY + Math.cos(rightLegAngle) * limbLength;
    ctx.beginPath(); ctx.moveTo(centerX, hipY); ctx.lineTo(rightFootX, rightFootY); ctx.stroke();

    const rightArmAngle = Math.sin(player.animTick) * swingRange;
    const rightHandX = centerX + Math.sin(rightArmAngle) * limbLength;
    const rightHandY = (neckY + 4) + Math.cos(rightArmAngle) * limbLength;
    ctx.beginPath(); ctx.moveTo(centerX, neckY + 4); ctx.lineTo(rightHandX, rightHandY); ctx.stroke();

    // Face
    const lookDir = player.vx > 0.1 ? 1 : (player.vx < -0.1 ? -1 : 0);
    const eyeOffsetX = lookDir * 3;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(centerX - 3 + eyeOffsetX, headY - 1, 1.5, 0, Math.PI * 2);
    ctx.arc(centerX + 3 + eyeOffsetX, headY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Poops
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of poops) {
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(p.rotation);
        ctx.font = `${p.width}px Arial`;
        ctx.fillText('💩', 0, 0);
        ctx.restore();
    }
}
