import logging
import random
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# ---------------- CONFIGURATION ---------------- #

# நீங்கள் கொடுத்த Bot Token
BOT_TOKEN = "7820753162:AAFJxxsgtrPbI8e57NhKoCPc628jzrDi8AA"

# நீங்கள் கொடுத்த Owner ID
OWNER_ID = 8556110773

# ----------------------------------------------- #

# Logging (பிழைகளைக் கண்டறிய)
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# விளையாட்டு விவரங்களை சேமிக்க
game_data = {
    "players": [],
    "current_turn": 0,
    "game_active": False
}

# தாயக்கட்ட எண்கள்
DICE_VALUES = [1, 2, 3, 4, 5, 6, 12]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """விளையாட்டைத் தொடங்கும் கமாண்ட்"""
    user = update.effective_user
    
    # விளையாட்டு ஏற்கனவே நடந்துகொண்டிருந்தால்
    if game_data["game_active"]:
        await update.message.reply_text("⚠️ விளையாட்டு ஏற்கனவே நடந்து கொண்டிருக்கிறது!")
        return

    # விளையாடுபவர் பெயர் பட்டியலில் இல்லையென்றால் சேர்க்கும்
    # (Checking if user ID is already in the list)
    player_ids = [p['id'] for p in game_data["players"]]
    
    if user.id not in player_ids:
        game_data["players"].append({"id": user.id, "name": user.first_name, "score": 0})
        await update.message.reply_text(
            f"✅ {user.first_name} விளையாட்டில் சேர்ந்தார்!\n"
            f"மொத்த வீரர்கள்: {len(game_data['players'])}\n"
            f"விளையாட விரும்புபவர்கள் அனைவரும் /start கொடுக்கவும்.\n"
            f"தொடங்க /play கொடுக்கவும்."
        )
    else:
        await update.message.reply_text(f"{user.first_name}, நீங்கள் ஏற்கனவே சேர்ந்துவிட்டீர்கள்!")

async def play(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """விளையாட்டை ஆரம்பிக்கும் (Start Game)"""
    if len(game_data["players"]) < 1:
        await update.message.reply_text("விளையாட ஆட்கள் இல்லை! முதலில் /start கொடுத்து சேருங்கள்.")
        return

    if not game_data["game_active"]:
        game_data["game_active"] = True
        first_player = game_data["players"][0]["name"]
        await update.message.reply_text(
            f"🎲 தாயக்கட்டம் தொடங்கியது!\n"
            f"மொத்த வீரர்கள்: {len(game_data['players'])}\n"
            f"முதல் வாய்ப்பு: {first_player}\n"
            f"உருட்ட /roll என்று டைப் செய்யவும்."
        )
    else:
        await update.message.reply_text("விளையாட்டு ஏற்கனவே தொடங்கிவிட்டது!")

async def roll(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """தாயக்கட்டையை உருட்டும் கமாண்ட்"""
    user = update.effective_user

    if not game_data["game_active"]:
        await update.message.reply_text("முதலில் விளையாட்டைத் தொடங்க /play கொடுங்கள்.")
        return

    # யாருடைய முறை (Turn) என்று பார்ப்பது
    current_player_index = game_data["current_turn"]
    current_player = game_data["players"][current_player_index]

    if user.id != current_player["id"]:
        await update.message.reply_text(f"✋ இது உங்கள் முறை அல்ல! தற்போது {current_player['name']} விளையாடுகிறார்.")
        return

    # தாயக்கட்டை உருட்டல்
    dice_roll = random.choice(DICE_VALUES)
    
    # தாயம் (1), 5, 6, 12 விழுந்தால் மறுவாய்ப்பு
    if dice_roll in [1, 5, 6, 12]:
        msg = (
            f"🎲 {user.first_name} உருட்டிய எண்: **{dice_roll}**! \n"
            f"🎉 சூப்பர்! உங்களுக்கு இன்னொரு வாய்ப்பு உண்டு. மீண்டும் /roll கொடுங்கள்."
        )
        # Turn மாற்றப்படவில்லை (Extra turn)
    else:
        # அடுத்த ஆளுக்கு மாற்றுதல்
        game_data["current_turn"] = (current_player_index + 1) % len(game_data["players"])
        next_player = game_data["players"][game_data["current_turn"]]["name"]
        msg = (
            f"🎲 {user.first_name} உருட்டிய எண்: {dice_roll}. \n"
            f"அடுத்த முறை: {next_player}"
        )

    await update.message.reply_text(msg)

async def reset(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """விளையாட்டை ரீசெட் செய்ய (Owner Only)"""
    user = update.effective_user
    
    # Owner ID Check
    if user.id != OWNER_ID:
        await update.message.reply_text("❌ உங்களுக்கு இந்த கமாண்ட் பயன்படுத்த அனுமதி இல்லை.")
        return

    game_data["players"] = []
    game_data["current_turn"] = 0
    game_data["game_active"] = False
    await update.message.reply_text("🔄 விளையாட்டு ரீசெட் செய்யப்பட்டது! புதிய ஆட்டத்தைத் தொடங்க /start கொடுக்கவும்.")

if __name__ == '__main__':
    # Application உருவாக்குதல்
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # கமாண்டுகளை இணைத்தல்
    app.add_handler(CommandHandler("start", start))  # சேருவதற்கு
    app.add_handler(CommandHandler("play", play))    # ஆட்டத்தை தொடங்க
    app.add_handler(CommandHandler("roll", roll))    # உருட்ட
    app.add_handler(CommandHandler("reset", reset))  # அழிக்க (Owner only)

    print("Bot is running...")
    app.run_polling()
  
