// -----------------------------------------------------------
// 1. FIREBASE CONFIGURATION (உங்கள் விவரங்கள் சேர்க்கப்பட்டன)
// -----------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAtcONX26tJ3P7WSeed5wKZuL_mo_8S71w",
  authDomain: "thaayam-88838.firebaseapp.com",
  databaseURL: "https://thaayam-88838-default-rtdb.firebaseio.com",
  projectId: "thaayam-88838",
  storageBucket: "thaayam-88838.firebasestorage.app",
  messagingSenderId: "310589228886",
  appId: "1:310589228886:web:32e141f72b20668e77b8f7",
  measurementId: "G-GCP6JT7VCQ"
};

// Firebase Start
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const gameRef = db.ref('thaayam_room_1'); // ஒரே ஒரு ரூம் (Test)

let tg = window.Telegram.WebApp;
tg.expand();

// User Details
let userId = tg.initDataUnsafe?.user?.id || Math.floor(Math.random() * 100000);
let userName = tg.initDataUnsafe?.user?.first_name || "Guest";

// Game Variables
let myPlayerNum = 0; // 1 = Red, 2 = Blue
let currentTurn = 1; 
let diceVal = 1;
let p1Coins = [-1, -1, -1, -1];
let p2Coins = [-1, -1, -1, -1];
let isWaitingForMove = false; // காய் நகர்த்த காத்திருப்பு

// --- 2. ONLINE JOIN LOGIC (Strictly 2 Players) ---

function connectToGame() {
    gameRef.get().then((snapshot) => {
        let data = snapshot.val();

        // 1. ரூம் காலியாக இருந்தால் -> Player 1
        if (!data) {
            myPlayerNum = 1;
            gameRef.set({
                p1: { id: userId, name: userName },
                turn: 1,
                lastRoll: 1,
                rollAnimation: false,
                p1Pos: [-1,-1,-1,-1],
                p2Pos: [-1,-1,-1,-1]
            });
            alert("நீங்கள் Player 1 (Red). எதிராளிக்காக காத்திருங்கள்...");
            setupDisconnect(1);
        } 
        // 2. P1 இருக்கிறார், P2 காலி -> Player 2
        else if (!data.p2 && data.p1.id !== userId) {
            myPlayerNum = 2;
            gameRef.update({
                p2: { id: userId, name: userName }
            });
            alert("நீங்கள் Player 2 (Blue). ஆட்டம் தொடங்குகிறது!");
            setupDisconnect(2);
        } 
        // 3. ஏற்கனவே நான் உள்ளே இருந்தால் (Reconnect)
        else if (data.p1.id === userId) {
            myPlayerNum = 1;
            setupDisconnect(1);
        }
        else if (data.p2 && data.p2.id === userId) {
            myPlayerNum = 2;
            setupDisconnect(2);
        }
        // 4. ரூம் ஃபுல் (House Full)
        else {
            document.body.innerHTML = "<h2 style='color:gold;text-align:center;margin-top:50px;'>⛔ Game Full!<br>ஏற்கனவே 2 பேர் விளையாடுகிறார்கள்.</h2>";
            return;
        }

        listenForUpdates();
    });
}

// வெளியேறினால் வெற்றி அறிவிப்பு (Disconnect Logic)
function setupDisconnect(playerNum) {
    let myKey = playerNum === 1 ? "p1" : "p2";
    // நான் வெளியேறினால் என் பெயரை அழித்துவிடு
    gameRef.child(myKey).onDisconnect().remove();
}

// --- 3. DATABASE LISTENER (Realtime Updates) ---

function listenForUpdates() {
    gameRef.on('value', (snapshot) => {
        let data = snapshot.val();
        
        // எதிராளி வெளியேறிவிட்டார்! (Win Condition)
        if (!data || (myPlayerNum===1 && !data.p2 && data.p1) || (myPlayerNum===2 && !data.p1)) {
             // ஆரம்பத்தில் P2 இல்லாத போது இது வரக்கூடாது, ஆட்டம் தொடங்கிய பின் வந்தால் மட்டும்
             if (myPlayerNum === 2 || (myPlayerNum === 1 && document.getElementById("p2-name").innerText !== "🔵 Waiting...")) {
                 alert("🎉 எதிராளி வெளியேறிவிட்டார்! நீங்கள் வெற்றி பெற்றீர்கள்!");
                 window.location.reload(); 
             }
        }
        
        if (!data) return; // டேட்டா இல்லை

        // Update Names
        document.getElementById("p1-name").innerText = data.p1 ? `🔴 ${data.p1.name}` : "🔴 Waiting...";
        document.getElementById("p2-name").innerText = data.p2 ? `🔵 ${data.p2.name}` : "🔵 Waiting...";

        // Update Game State
        p1Coins = data.p1Pos || [-1,-1,-1,-1];
        p2Coins = data.p2Pos || [-1,-1,-1,-1];
        currentTurn = data.turn;
        diceVal = data.lastRoll;

        // Dice Update
        let diceEl = document.getElementById("dice");
        diceEl.innerText = getDiceChar(diceVal);

        updateStatusText(data);
        renderAllCoins(); // காய்களை வரைதல்
    });
}

function updateStatusText(data) {
    let status = document.getElementById("status-text");
    let btn = document.getElementById("rollBtn");

    if (!data.p2) {
        status.innerText = "⏳ எதிராளிக்காக காத்திருப்பு...";
        btn.disabled = true;
        return;
    }

    if (currentTurn === myPlayerNum) {
        status.innerText = "🎲 உங்கள் முறை! (Your Turn)";
        status.style.color = "gold";
        btn.disabled = false;
        
        // காயை நகர்த்த வேண்டுமா? (ஏற்கனவே உருட்டியாச்சு, ஆனால் Turn மாறவில்லை என்றால்)
        // (சிறிய லாஜிக் தேவை, இப்போதைக்கு Roll பட்டன் மூலம் கட்டுப்படுத்துவோம்)
    } else {
        status.innerText = "✋ எதிராளி முறை (Opponent's Turn)";
        status.style.color = "gray";
        btn.disabled = true;
    }
}

// --- 4. GAME ACTIONS ---

function rollDice() {
    if (myPlayerNum !== currentTurn) return;

    // Random Dice
    let val = Math.floor(Math.random() * 6) + 1;
    if (Math.random() > 0.9) val = 12;

    // Save to DB
    gameRef.update({
        lastRoll: val
    });
    
    // தானாக நகராது. Touch செய்ய காத்திருக்கவும்.
    // (Touch Logic கீழே உள்ளது)
}

function coinClicked(player, index) {
    // 1. என் முறை தானா?
    if (player !== myPlayerNum || currentTurn !== myPlayerNum) return;

    // 2. காய் நகர்த்தும் லாஜிக்
    let coins = myPlayerNum === 1 ? [...p1Coins] : [...p2Coins];
    let currentPos = coins[index];
    let moveAmount = diceVal; 

    // புது இடம் கணக்கீடு
    let newPos = -1;
    
    // காய் போர்டில் இல்லை என்றால் (Home)
    if (currentPos === -1) {
        if ([1, 5, 6, 12].includes(moveAmount)) {
            newPos = 0; // Start Point
        } else {
            alert("உள்ளே இறக்க 1, 5, 6, 12 வேண்டும்!");
            // நகர்த்த முடியாது -> Turn மாற்றலாமா? 
            // இல்லை, வேறு காய் இருக்கிறதா என்று பார்க்க வேண்டும்.
            // (எளிமைக்காக: தவறான காயை தொட்டால் Alert மட்டும் வரும்)
            return; 
        }
    } else {
        newPos = currentPos + moveAmount;
    }

    // அப்டேட் Array
    coins[index] = newPos;

    // Turn மாற்றுதல் (1,5,6,12 வந்தால் மறுவாய்ப்பு)
    let nextTurn = ([1, 5, 6, 12].includes(moveAmount)) ? myPlayerNum : (myPlayerNum === 1 ? 2 : 1);

    // DB அப்டேட்
    let updateData = {};
    if (myPlayerNum === 1) updateData["p1Pos"] = coins;
    else updateData["p2Pos"] = coins;
    
    updateData["turn"] = nextTurn;
    gameRef.update(updateData);
}

// --- 5. VISUALS (Board & Coins) ---
// (முன்பு இருந்த Grid Code அப்படியே)

const board = document.getElementById('board');
const gridSize = 11;
const diceChars = {1:'⚀', 2:'⚁', 3:'⚂', 4:'⚃', 5:'⚄', 6:'⚅', 12:'12'};
function getDiceChar(v) { return diceChars[v] || '🎲'; }

const layout = [
    [0,0,0,0,1,2,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,2,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [1,1,1,1,1,2,1,1,1,1,1],
    [2,1,2,1,2,3,2,1,2,1,2],
    [1,1,1,1,1,2,1,1,1,1,1],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,2,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,2,1,0,0,0,0]
];

function createBoard() {
    board.innerHTML = '';
    for(let r=0; r<gridSize; r++) {
        for(let c=0; c<gridSize; c++) {
            let type = layout[r][c];
            let cell = document.createElement('div');
            cell.id = `cell-${r}-${c}`; 
            if (type === 0) cell.className = 'empty';
            else {
                cell.className = 'cell';
                if (type === 2) cell.classList.add('safe');
                if (type === 3) cell.classList.add('center-box');
            }
            board.appendChild(cell);
        }
    }
}

// PATHS (சுருக்கமாக)
const redPath = [{r:10, c:5}, {r:9, c:5}, {r:8, c:5}, {r:7, c:5}, {r:6, c:5}, {r:6, c:4}, {r:6, c:3}, {r:6, c:2}, {r:6, c:1}, {r:6, c:0}, {r:5, c:0}, {r:4, c:0}, {r:4, c:1}, {r:4, c:2}, {r:4, c:3}, {r:4, c:4}, {r:3, c:4}, {r:2, c:4}, {r:1, c:4}, {r:0, c:4}, {r:0, c:5}, {r:0, c:6}, {r:1, c:6}, {r:2, c:6}, {r:3, c:6}, {r:4, c:6}, {r:4, c:7}, {r:4, c:8}, {r:4, c:9}, {r:4, c:10}, {r:5, c:10}, {r:6, c:10}, {r:6, c:9}, {r:6, c:8}, {r:6, c:7}, {r:6, c:6}, {r:7, c:6}, {r:8, c:6}, {r:9, c:6}, {r:10, c:6}, {r:10, c:5}, {r:9, c:5}, {r:8, c:5}, {r:7, c:5}, {r:6, c:5}, {r:5, c:5}];
const bluePath = [{r:5, c:0}, {r:5, c:1}, {r:5, c:2}, {r:5, c:3}, {r:5, c:4}, {r:4, c:4}, {r:3, c:4}, {r:2, c:4}, {r:1, c:4}, {r:0, c:4}, {r:0, c:5}, {r:0, c:6}, {r:1, c:6}, {r:2, c:6}, {r:3, c:6}, {r:4, c:6}, {r:4, c:7}, {r:4, c:8}, {r:4, c:9}, {r:4, c:10}, {r:5, c:10}, {r:6, c:10}, {r:6, c:9}, {r:6, c:8}, {r:6, c:7}, {r:6, c:6}, {r:7, c:6}, {r:8, c:6}, {r:9, c:6}, {r:10, c:6}, {r:10, c:5}, {r:9, c:5}, {r:8, c:5}, {r:7, c:5}, {r:6, c:5}, {r:6, c:4}, {r:6, c:3}, {r:6, c:2}, {r:6, c:1}, {r:6, c:0}, {r:5, c:0}, {r:5, c:1}, {r:5, c:2}, {r:5, c:3}, {r:5, c:4}, {r:5, c:5}];

function renderAllCoins() {
    document.querySelectorAll('.coin').forEach(c => c.remove());
    // P1 Coins
    for(let i=0; i<4; i++) drawCoin(1, i, p1Coins[i]);
    // P2 Coins
    for(let i=0; i<4; i++) drawCoin(2, i, p2Coins[i]);
}

function drawCoin(player, index, posIndex) {
    if (posIndex === -1) return; // போர்டில் இல்லை
    
    let path = player === 1 ? redPath : bluePath;
    if (posIndex >= path.length) posIndex = path.length - 1;

    let target = path[posIndex];
    let cell = document.getElementById(`cell-${target.r}-${target.c}`);
    
    if (cell) {
        let coin = document.createElement('div');
        coin.className = player === 1 ? 'coin red-coin' : 'coin blue-coin';
        
        // --- Touch Event ---
        coin.onclick = function() {
            coinClicked(player, index);
        };
        
        // Offset Logic (காய்கள் ஒன்றன் மேல் ஒன்று வராமல் இருக்க)
        if (index === 1) coin.style.transform = "translate(3px, 3px)";
        if (index === 2) coin.style.transform = "translate(-3px, -3px)";
        
        cell.appendChild(coin);
    }
}

// Start
createBoard();
connectToGame();

