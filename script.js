let tg = window.Telegram.WebApp;
tg.expand();

// --- 1. போர்டு உருவாக்கம் (GRID SYSTEM) ---
const board = document.getElementById('board');
const gridSize = 11; // 11x11 Grid
let cells = []; // எல்லா கட்டங்களின் விபரங்கள்

// தாயக்கட்ட வடிவம் (0 = காலி, 1 = சாதா கட்டம், 2 = சேஃப் ஜோன், 3 = சென்டர்)
// இது ஒரு மேப் (Map) போல.
const layout = [
    [0,0,0,0,1,2,1,0,0,0,0], // Row 0 (Top)
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,2,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [1,1,1,1,1,2,1,1,1,1,1], // Row 4 (Cross arm)
    [2,1,2,1,2,3,2,1,2,1,2], // Row 5 (Center Horizontal)
    [1,1,1,1,1,2,1,1,1,1,1],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,2,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,2,1,0,0,0,0]  // Row 10 (Bottom)
];

// போர்டை வரையும் பங்க்ஷன்
function createBoard() {
    board.innerHTML = '';
    for(let r=0; r<gridSize; r++) {
        for(let c=0; c<gridSize; c++) {
            let type = layout[r][c];
            let cell = document.createElement('div');
            
            // கட்டத்தின் ID (எ.கா: cell-5-5)
            cell.id = `cell-${r}-${c}`; 
            
            if (type === 0) {
                cell.className = 'empty'; // மூலைகள்
            } else {
                cell.className = 'cell';
                if (type === 2) cell.classList.add('safe'); // X போட்ட கட்டம்
                if (type === 3) cell.classList.add('center-box'); // மையம்
            }
            board.appendChild(cell);
        }
    }
    // ஆரம்பத்தில் காய்களை செட் செய்தல்
    resetCoins();
}

// --- 2. பாதை அமைத்தல் (PATH MAPPING) ---
// ஒவ்வொரு பிளேயருக்கும் காய் நகர வேண்டிய வரிசை (Row, Col)

// சிவப்பு பாதை (கீழே இருந்து ஆரம்பம்)
const redPath = [
    {r:10, c:5}, {r:9, c:5}, {r:8, c:5}, {r:7, c:5}, {r:6, c:5}, // ஏறுகிறது
    {r:6, c:4}, {r:6, c:3}, {r:6, c:2}, {r:6, c:1}, {r:6, c:0}, // இடது கை
    {r:5, c:0}, {r:4, c:0}, {r:4, c:1}, {r:4, c:2}, {r:4, c:3}, {r:4, c:4}, 
    {r:3, c:4}, {r:2, c:4}, {r:1, c:4}, {r:0, c:4}, // மேல் கை
    {r:0, c:5}, {r:0, c:6}, {r:1, c:6}, {r:2, c:6}, {r:3, c:6}, {r:4, c:6},
    {r:4, c:7}, {r:4, c:8}, {r:4, c:9}, {r:4, c:10}, // வலது கை
    {r:5, c:10}, {r:6, c:10}, {r:6, c:9}, {r:6, c:8}, {r:6, c:7}, {r:6, c:6},
    {r:7, c:6}, {r:8, c:6}, {r:9, c:6}, {r:10, c:6}, // கீழே திரும்புகிறது
    {r:10, c:5}, // ரவுண்டு முடிந்தது (Start Point)
    // உள்ளே செல்லும் பாதை... (Inner Circle) - தற்போதைக்கு சென்டர்
    {r:9, c:5}, {r:8, c:5}, {r:7, c:5}, {r:6, c:5}, {r:5, c:5} // வெற்றி
];

// நீல பாதை (இடது பக்கத்தில் இருந்து ஆரம்பம்)
const bluePath = [
    {r:5, c:0}, {r:5, c:1}, {r:5, c:2}, {r:5, c:3}, {r:5, c:4},
    {r:4, c:4}, {r:3, c:4}, {r:2, c:4}, {r:1, c:4}, {r:0, c:4},
    {r:0, c:5}, {r:0, c:6}, {r:1, c:6}, {r:2, c:6}, {r:3, c:6}, {r:4, c:6},
    {r:4, c:7}, {r:4, c:8}, {r:4, c:9}, {r:4, c:10},
    {r:5, c:10}, {r:6, c:10}, {r:6, c:9}, {r:6, c:8}, {r:6, c:7}, {r:6, c:6},
    {r:7, c:6}, {r:8, c:6}, {r:9, c:6}, {r:10, c:6},
    {r:10, c:5}, {r:9, c:5}, {r:8, c:5}, {r:7, c:5}, {r:6, c:5},
    {r:6, c:4}, {r:6, c:3}, {r:6, c:2}, {r:6, c:1}, {r:6, c:0},
    {r:5, c:0},
    // Inner
    {r:5, c:1}, {r:5, c:2}, {r:5, c:3}, {r:5, c:4}, {r:5, c:5} // வெற்றி
];

// --- 3. கேம் லாஜிக் ---
let currentPlayer = 1; // 1 = Red, 2 = Blue
let diceChars = ['🎲', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// 4 காய்களின் நிலைகள் (Positions) - ஆரம்பத்தில் -1 (போர்டில் இல்லை)
let p1Coins = [-1, -1, -1, -1];
let p2Coins = [-1, -1, -1, -1];

function resetCoins() {
    // காய்களை ஆரம்ப இடத்திற்கு கொண்டு வருதல் (Visual Reset)
    // தற்போதைக்கு மறைத்து வைப்போம், ஆட்டம் ஆரம்பிக்கும் போது வரும்
    for(let i=0; i<4; i++) {
        updateVisual(1, i, -1);
        updateVisual(2, i, -1);
    }
}

function rollDice() {
    let btn = document.querySelector("button");
    btn.disabled = true; // பட்டனை முடக்கு
    
    // அனிமேஷன் எஃபெக்ட்
    let count = 0;
    let anim = setInterval(() => {
        let r = Math.floor(Math.random() * 6) + 1;
        document.getElementById("dice").innerText = diceChars[r];
        count++;
        if(count > 10) {
            clearInterval(anim);
            finalRoll();
        }
    }, 50);
}

function finalRoll() {
    let val = Math.floor(Math.random() * 6) + 1; // 1-6
    if (Math.random() > 0.9) val = 12; // 10% சான்ஸ் 12 விழ
    
    // 12-க்கு தனி Unicode இல்லை, அதனால் Text
    let displayVal = val === 12 ? "12" : diceChars[val];
    document.getElementById("dice").innerText = displayVal;
    
    // காய் நகர்த்தல் (Logic)
    // தற்போதைக்கு "முதல் காயை" (Coin 0) மட்டும் நகர்த்தும் படி வைத்துள்ளேன்.
    // 4 காய்களையும் தேர்வு செய்யும் வசதி மிகவும் பெரிய கோட் ஆகும்.
    
    let moved = false;
    let coins = currentPlayer === 1 ? p1Coins : p2Coins;
    
    // எந்த காய் நகர்த்தலாம்? (எளிய லாஜிக்: முதல் காயை நகர்த்து)
    // 1 அல்லது 5 அல்லது 6 அல்லது 12 விழுந்தால் மட்டுமே உள்ளே வர முடியும் (Cut logic later)
    
    // தற்போதைய டெமோவிற்கு: காய் 0-வை மட்டும் நகர்த்துவோம்
    let coinIdx = 0; 
    let currentPos = coins[coinIdx];
    
    // காய் போர்டில் இல்லை (-1) மற்றும் தாயம் (1) விழுந்தால் உள்ளே வரும்
    if (currentPos === -1) {
        if (val === 1 || val === 5 || val === 12) {
            coins[coinIdx] = 0; // Start Position
            moved = true;
        }
    } else {
        coins[coinIdx] += val; // நகர்த்து
        moved = true;
    }

    // அப்டேட் விஷுவல்
    if (moved) {
        updateVisual(currentPlayer, coinIdx, coins[coinIdx]);
    }

    // Turn மாற்றுதல் (Extra Turn if 1, 5, 6, 12 logic can be added)
    if (![1, 5, 6, 12].includes(val)) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateStatus();
    }
    
    document.querySelector("button").disabled = false;
}

function updateStatus() {
    let st = document.getElementById("status-text");
    if(currentPlayer === 1) {
        st.innerText = "🔴 Player 1 முறை";
        st.className = "status p1-turn";
    } else {
        st.innerText = "🔵 Player 2 முறை";
        st.className = "status p2-turn";
    }
}

function updateVisual(player, coinIdx, posIndex) {
    let coinId = player === 1 ? `r${coinIdx}` : `b${coinIdx}`;
    let coinEl = document.getElementById(coinId);
    
    if (posIndex === -1) {
        coinEl.style.display = 'none'; // போர்டில் இல்லை
        return;
    }
    
    coinEl.style.display = 'block';
    
    // பாதை
    let path = player === 1 ? redPath : bluePath;
    
    // எல்லை தாண்டினால் வெற்றி
    if (posIndex >= path.length) {
        posIndex = path.length - 1; // Center
        alert((player===1?"Red":"Blue") + " Coin Wins!");
    }
    
    let target = path[posIndex]; // {r: 10, c: 5}
    
    // CSS Grid-ல் உள்ள அந்த கட்டத்தை கண்டுபிடி
    let cell = document.getElementById(`cell-${target.r}-${target.c}`);
    
    if(cell) {
        // காயை அந்த கட்டத்தின் நடுவே வைப்பது
        // Offset logic to avoid coins overlapping
        let rect = cell.getBoundingClientRect();
        let boardRect = board.getBoundingClientRect();
        
        let top = rect.top - boardRect.top + 8; // +8 for centering
        let left = rect.left - boardRect.left + 8;
        
        // 4 காய்களும் ஒரே இடத்தில் இருந்தால் பிரித்து காட்ட (Offset)
        if (coinIdx === 1) { left += 5; }
        if (coinIdx === 2) { top += 5; }
        if (coinIdx === 3) { left += 5; top += 5; }

        coinEl.style.transform = `translate(${left}px, ${top}px)`;
    }
}

// Start
createBoard();

