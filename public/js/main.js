import { GameManager } from './GameManager.js';
import { DodgeGame } from './games/DodgeGame.js';
import { SnakeGame } from './games/SnakeGame.js';
import { BrickGame } from './games/BrickGame.js';
import { JumpGame } from './games/JumpGame.js';
import { FlappyGame } from './games/FlappyGame.js';

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://acupfaolhbhixljmbyjc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_39wnJCZQNAFTR6l5iza5TA_-p7nnhdN';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Screens
const authScreen = document.getElementById('auth-screen');
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');

// State
let user = null;
const gameManager = new GameManager();

// Game Selection State
const currentGameType = { value: 'dodge' };
let selectedGameClass = null;

// --- Init ---
checkSession();

// --- Event Listeners ---
const googleBtn = document.getElementById('google-login-btn');
if (googleBtn) googleBtn.addEventListener('click', loginWithGoogle);

document.getElementById('menu-logout-btn').addEventListener('click', logout);

// Adjust logout on Leaderboard to perform like "Main Menu"
const leaderboardLogoutBtn = document.getElementById('logout-btn');
if (leaderboardLogoutBtn) {
    leaderboardLogoutBtn.textContent = "메인 메뉴";
    leaderboardLogoutBtn.replaceWith(leaderboardLogoutBtn.cloneNode(true)); // remove old listeners (if any)
    document.getElementById('logout-btn').addEventListener('click', () => {
        showScreen('menu');
        if (gameManager) gameManager.stopGame(); // Ensure game stopped
    });
}

document.getElementById('restart-btn').addEventListener('click', () => {
    if (selectedGameClass) startGame(selectedGameClass);
});

document.getElementById('in-game-restart-btn').addEventListener('click', () => {
    if (selectedGameClass) startGame(selectedGameClass);
});


// Game Selection Buttons
document.querySelectorAll('.game-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const gameType = btn.dataset.game;
        currentGameType.value = gameType; // Store selected game type

        switch (gameType) {
            case 'dodge': selectedGameClass = DodgeGame; break;
            case 'snake': selectedGameClass = SnakeGame; break;
            case 'brick': selectedGameClass = BrickGame; break;
            case 'jump': selectedGameClass = JumpGame; break;
            case 'flappy': selectedGameClass = FlappyGame; break;
        }

        if (selectedGameClass) startGame(selectedGameClass);
    });
});


// --- Functions ---

function showScreen(screenName) {
    console.log(`Showing screen: ${screenName}`);
    // Hide all
    [authScreen, menuScreen, gameScreen, leaderboardScreen].forEach(el => {
        if (el) el.style.display = 'none';
    });

    // Show specific
    if (screenName === 'auth' && authScreen) authScreen.style.display = 'flex';
    else if (screenName === 'menu' && menuScreen) menuScreen.style.display = 'flex';
    else if (screenName === 'game' && gameScreen) gameScreen.style.display = 'flex';
    else if (screenName === 'leaderboard' && leaderboardScreen) leaderboardScreen.style.display = 'flex';
}

function startGame(GameClass) {
    console.log('Starting game...');
    // Explicit alert to debug auto-start
    // alert('게임이 시작됩니다! (Game Starting)');
    showScreen('game');
    gameManager.startGame(GameClass, (score) => {
        handleGameOver(score);
    });
}

function handleGameOver(score) {
    console.log(`Game Over. Score: ${score}`);
    saveScore(score, currentGameType.value).then(() => {
        // Load leaderboard for this game
        loadLeaderboard(currentGameType.value);
        document.getElementById('final-score').textContent = `Score: ${score}`;
        showScreen('leaderboard');
    });
}

async function checkSession() {
    console.log('Checking session...');
    // alert('세션 확인 중...'); // debug
    if (!supabaseClient) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        console.log('Session found', session.user.email);
        // alert('로그인 확인됨! 메뉴로 이동합니다. (LoggedIn -> Menu)');
        user = session.user;
        showScreen('menu');
    } else {
        console.log('No session');
        showScreen('auth');
        // Removed preview loading to avoid confusion/errors during debug
        // loadLeaderboard('dodge', true); 
    }

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log(`Auth event: ${event}`);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session) {
                user = session.user;
                showScreen('menu');
            }
        } else if (event === 'SIGNED_OUT') {
            user = null;
            showScreen('auth');
        }
    });
}

async function loginWithGoogle() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
    });
}

async function logout() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    window.location.reload();
}

async function saveScore(score, gameType) {
    if (!user || !supabaseClient) return;

    // Ensure gameType defaults if missing
    const type = gameType || 'dodge';

    const { error } = await supabaseClient
        .from('scores')
        .insert({
            user_id: user.id,
            username: user.user_metadata.full_name || user.email.split('@')[0],
            score: score,
            game_type: type
        });
    if (error) console.error('Error saving score:', error);
}

async function loadLeaderboard(gameTypeOrPreview, isPreview = false) {
    if (!supabaseClient) return;

    let gameType = 'dodge';
    let preview = false;

    if (typeof gameTypeOrPreview === 'boolean') {
        preview = gameTypeOrPreview;
    } else {
        gameType = gameTypeOrPreview || 'dodge';
        preview = isPreview;
    }

    const { data, error } = await supabaseClient
        .from('scores')
        .select('username, score')
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(10);

    const listId = preview ? 'preview-leaderboard-list' : 'leaderboard-list';
    const list = document.getElementById(listId);

    if (list) {
        if (error || !data || data.length === 0) {
            list.innerHTML = '<li><span>No scores yet!</span></li>';
        } else {
            list.innerHTML = data.map((entry, i) =>
                `<li><span>${i + 1}. ${entry.username}</span> <span>${entry.score}</span></li>`
            ).join('');
        }
    }
}
