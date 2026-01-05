import logging
import asyncio
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# ---------------- CONFIGURATION ---------------- #
BOT_TOKEN = "7820753162:AAFJxxsgtrPbI8e57NhKoCPc628jzrDi8AA"
OWNER_ID = 8556110773
# ----------------------------------------------- #

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# விளையாட்டு விவரங்கள்
game_data = {
    "players": [],       # வீரர்களின் விவரம்
    "current_turn": 0,   # யார் முறை
    "game_active": False # ஆட்டம் நடக்கிறதா
}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """படம் காட்டி வரவேற்பு அளிக்கும் Start கமாண்ட்"""
    user = update.effective_user
    chat_id = update.effective_chat.id

    # 1. போர்டு படத்தை அனுப்புதல் (Sending Board Image)
    try:
        await context.bot.send_photo(
            chat_id=chat_id,
            photo=open('board.jpg', 'rb'), # உங்கள் படத்தின் பெயர் board.jpg இருக்க வேண்டும்
            caption="🙏 வணக்கம்! தாயக்கட்டம் உங்களை அன்புடன் வரவேற்கிறது."
        )
    except:
        await update.message.reply_text("⚠️ 'board.jpg' படம் கிடைக்கவில்லை. Code இருக்கும் இடத்தில் படத்தை வைக்கவும்.")

    # 2. Player சேர்ப்பு (Join Logic)
    if game_data["game_active"]:
        await update.message.reply_text("⚠️ விளையாட்டு ஏற்கனவே நடந்து கொண்டிருக்கிறது!")
        return

    player_ids = [p['id'] for p in game_data["players"]]
    
    # 2 பேருக்கு மேல் சேர்க்காது (Only 2 Players Logic)
    if len(game_data["players"]) >= 2:
        if user.id not in player_ids:
            await update.message.reply_text("⛔ மன்னிக்கவும்! 2 பேர் மட்டுமே விளையாட முடியும். இடம் இல்லை.")
            return

    if user.id not in player_ids:
        # காய்களுக்கு நிறம் ஒதுக்குதல் (Player Colors)
        symbol = "🔴" if len(game_data["players"]) == 0 else "🔵"
        
        game_data["players"].append({
            "id": user.id, 
            "name": user.first_name, 
            "pos": 0,       # ஆரம்ப இடம்
            "symbol": symbol 
        })
        
        await update.message.reply_text(
            f"✅ {user.first_name} ({symbol}) விளையாட்டில் சேர்ந்தார்!\n"
            f"மொத்த வீரர்கள்: {len(game_data['players'])}/2\n"
            f"2 பேர் சேர்ந்தவுடன் /play கொடுக்கவும்."
        )
    else:
        await update.message.reply_text(f"{user.first_name}, நீங்கள் ஏற்கனவே சேர்ந்துவிட்டீர்கள்!")

async def play(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """விளையாட்டைத் தொடங்கும்"""
    # சரியாக 2 பேர் இருக்கிறார்களா எனப் பார்ப்பது
    if len(game_data["players"]) != 2:
        await update.message.reply_text(f"⚠️ இன்னும் {2 - len(game_data['players'])} பேர் தேவை! (மொத்தம் 2 பேர் வேண்டும்)")
        return

    if not game_data["game_active"]:
        game_data["game_active"] = True
        p1 = game_data["players"][0]
        await update.message.reply_text(
            f"🎲 **ஆட்டம் தொடங்கியது!**\n\n"
            f"{p1['symbol']} {p1['name']} - பெட்டி 0\n"
            f"{game_data['players'][1]['symbol']} {game_data['players'][1]['name']} - பெட்டி 0\n\n"
            f"முதல் வாய்ப்பு: {p1['name']}\n"
            f"உருட்ட /roll என்று டைப் செய்யவும்."
        )
    else:
        await update.message.reply_text("விளையாட்டு ஏற்கனவே தொடங்கிவிட்டது!")

async def roll(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """தாயக்கட்டை உருட்டுதல் (Animation உடன்)"""
    user = update.effective_user
    chat_id = update.effective_chat.id

    if not game_data["game_active"]:
        await update.message.reply_text("விளையாட்டு இன்னும் தொடங்கவில்லை. /start செய்யவும்.")
        return

    # Turn Check
    current_player_idx = game_data["current_turn"]
    current_player = game_data["players"][current_player_idx]

    if user.id != current_player["id"]:
        await update.message.reply_text(f"✋ இது {current_player['name']}-இன் முறை!")
        return

    # 1. Telegram Dice Animation அனுப்புதல்
    msg = await context.bot.send_dice(chat_id=chat_id, emoji='🎲')
    dice_value = msg.dice.value  # விழுந்த எண் (1-6)
    
    # அனிமேஷன் முடிய சிறிது நேரம் காத்திருத்தல் (Wait)
    await asyncio.sleep(3)

    # தாயக்கட்டத்தில் 1-6 தான் வரும். 12 வேண்டும் என்றால் லாஜிக் மாற்ற வேண்டும்.
    # இப்போதைக்கு Telegram Dice (1-6) பயன்படுத்துவோம்.
    
    # 2. காய் நகர்த்தல் (Move Coin Logic)
    current_player["pos"] += dice_value
    new_pos = current_player["pos"]
    symbol = current_player["symbol"]

    await update.message.reply_text(
        f"🎲 {user.first_name} உருட்டியது: **{dice_value}**\n"
        f"🏃 காய் நகர்கிறது... பெட்டி {new_pos}-க்குச் சென்றது!\n"
    )

    # வெற்றியாளர் சரிபார்ப்பு (உதாரணத்திற்கு 50 பெட்டி வைத்துள்ளேன்)
    if new_pos >= 50:
        await update.message.reply_text(f"🏆🎉 வாழ்த்துக்கள்! {user.first_name} வெற்றி பெற்றார்! \nஆட்டம் முடிந்தது.")
        # Reset Game
        game_data["players"] = []
        game_data["game_active"] = False
        game_data["current_turn"] = 0
        return

    # 3. அடுத்த முறை (Next Turn)
    # 1, 5, 6 விழுந்தால் மறுவாய்ப்பு (Extra Turn Logic)
    if dice_value in [1, 5, 6]:
        await update.message.reply_text(f"🔥 {dice_value} விழுந்ததால் உங்களுக்கு மறுவாய்ப்பு! மீண்டும் /roll செய்யவும்.")
    else:
        game_data["current_turn"] = (current_player_idx + 1) % 2
        next_p = game_data["players"][game_data["current_turn"]]
        await update.message.reply_text(f"அடுத்த முறை: {next_p['symbol']} {next_p['name']}")

async def reset(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """ரீசெட் (Owner Only)"""
    if update.effective_user.id != OWNER_ID:
        return
    game_data["players"] = []
    game_data["game_active"] = False
    game_data["current_turn"] = 0
    await update.message.reply_text("🔄 Game Reset Done!")

if __name__ == '__main__':
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("play", play))
    app.add_handler(CommandHandler("roll", roll))
    app.add_handler(CommandHandler("reset", reset))

    print("Bot is running with Image support...")
    app.run_polling()
    
