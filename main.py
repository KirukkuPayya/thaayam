import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# ---------------- CONFIGURATION ---------------- #

# உங்கள் Bot Token
BOT_TOKEN = "7820753162:AAFJxxsgtrPbI8e57NhKoCPc628jzrDi8AA"

# உங்கள் GitHub Pages லிங்க் (Web App Link)
WEB_APP_URL = "https://KirukkuPayya.github.io/thaayam/"

# ----------------------------------------------- #

# Logging (பிழைகளைக் கண்டறிய)
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    /start என்று கொடுத்தால் கேம் பட்டனை அனுப்பும்.
    """
    # Web App பட்டன் உருவாக்குதல்
    keyboard = [
        [InlineKeyboardButton(
            text="🎲 தாயக்கட்டம் விளையாட கிளிக் செய்யவும் (Play)", 
            web_app=WebAppInfo(url=WEB_APP_URL)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    # மெசேஜ் அனுப்புதல்
    await update.message.reply_text(
        "👋 வணக்கம்!\n\nதாயக்கட்டம் விளையாட தயாராக உள்ளீர்களா?\n\nகீழே உள்ள பட்டனை அழுத்தி விளையாட்டைத் தொடங்கவும்! 👇",
        reply_markup=reply_markup
    )

if __name__ == '__main__':
    # Bot Application உருவாக்குதல்
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # கமாண்ட் இணைத்தல்
    app.add_handler(CommandHandler("start", start))

    print("Bot is running... (Press Ctrl+C to stop)")
    app.run_polling()
    
