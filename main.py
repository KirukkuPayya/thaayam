import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# ---------------- CONFIGURATION ---------------- #

# உங்கள் Bot Token (பழையது அப்படியே இருக்கட்டும்)
BOT_TOKEN = "7820753162:AAFJxxsgtrPbI8e57NhKoCPc628jzrDi8AA"

# உங்கள் புதிய GitHub Pages லிங்க் (சரியான லிங்க் சேர்க்கப்பட்டுள்ளது)
WEB_APP_URL = "https://kirukkupayya.github.io/thaayam/"

# ----------------------------------------------- #

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    /start கொடுத்தால் கேம் பட்டன் வரும்.
    """
    print("User clicked /start") # இது லாக்-ல் தெரியும்
    
    # Web App பட்டன்
    keyboard = [
        [InlineKeyboardButton(
            text="🎲 தாயக்கட்டம் விளையாட கிளிக் செய்யவும் (Play)", 
            web_app=WebAppInfo(url=WEB_APP_URL)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "👋 வணக்கம்!\n\nதாயக்கட்டம் விளையாடத் தயாரா?\n\nகீழே உள்ள பட்டனை அழுத்தவும்! 👇",
        reply_markup=reply_markup
    )

if __name__ == '__main__':
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    
    print("Bot is running... Link connected!")
    app.run_polling()
    
