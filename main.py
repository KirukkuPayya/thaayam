from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

BOT_TOKEN = "உங்கள்_BOT_TOKEN"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "வணக்கம்! தாயக்கட்டம் விளையாட கீழே உள்ள பட்டனை அழுத்தவும்.",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton(
                text="🎮 விளையாடத் தொடங்க (Play Game)",
                # இங்கே GitHub-ல் கிடைத்த லிங்க்கை போடவும்
                web_app=WebAppInfo(url="https://kirukkupayya.github.io/thaayam-web/") 
            )]
        ])
    )

if __name__ == '__main__':
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    print("Bot Started...")
    app.run_polling()
  
