let tg = window.Telegram.WebApp;
tg.expand(); // Telegram உள்ளே முழு திரையில் வரும்

// இது சும்மா ஒரு உதாரணம் (Demo Path)
// காய்கள் நகர வேண்டிய இடங்களின் (X, Y) அளவு.
// இதை நீங்கள் உங்கள் போர்டுக்கு ஏற்ப சரியாக அளந்து எழுத வேண்டும்.
const path = [
    {top: '45%', left: '45%'}, // Start (Center)
    {top: '80%', left: '45%'}, // கீழே
    {top: '80%', left: '20%'}, // இடது
    {top: '50%', left: '20%'}, // மேலே
    {top: '20%', left: '20%'}, 
    {top: '20%', left: '50%'}, 
];

let currentStep = 0;

function rollDice() {
    // 1. ரேண்டம் நம்பர்
    let dice = Math.floor(Math.random() * 6) + 1; // 1-6
    document.getElementById("status").innerText = "விழுந்த எண்: " + dice;

    // 2. காய் நகர்த்தல் (Visual Move)
    currentStep++;
    if (currentStep >= path.length) currentStep = 0; // Reset for demo

    let p1 = document.getElementById("player1");
    
    // HTML-ல் இடங்களை மாற்றுவது (Animation நடக்கும்)
    p1.style.top = path[currentStep].top;
    p1.style.left = path[currentStep].left;
}
