const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const cors = require("cors");
const fs = require("fs");

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = "!";
const SALES_FILE = "./sales.json";

if (!fs.existsSync(SALES_FILE)) {
    fs.writeFileSync(SALES_FILE, JSON.stringify([], null, 2));
}

function readSales() {
    return JSON.parse(fs.readFileSync(SALES_FILE, "utf8"));
}

function formatMoney(amount) {
    return amount.toLocaleString("de-DE") + " €";
}

const app = express();
app.use(cors());
app.use(express.json());

app.post("/sale", (req, res) => {
    const sales = readSales();

    sales.push({
        product: req.body.product,
        category: req.body.category,
        quantity: Number(req.body.quantity),
        total: Number(req.body.total),
        date: new Date().toISOString()
    });

    fs.writeFileSync(SALES_FILE, JSON.stringify(sales, null, 2));
    res.json({ success: true });
});

app.listen(3001, () => {
    console.log("Kassen-API läuft auf Port 3001");
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", () => {
    console.log(`Bot online als ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const command = message.content.slice(PREFIX.length).trim().toLowerCase();

    if (command === "kasse") {
        const sales = readSales();

        let total = 0;
        let essen = 0;
        let trinken = 0;
        let menu = 0;

        sales.forEach(sale => {
            total += sale.total;

            if (sale.category === "Essen") essen += sale.total;
            if (sale.category === "Trinken") trinken += sale.total;
            if (sale.category === "Menü") menu += sale.total;
        });

        message.reply(`
📊 **Kassensturz – La Casa del Nonno**

🍕 Essen: **${formatMoney(essen)}**
🥤 Getränke: **${formatMoney(trinken)}**
🍽️ Menü: **${formatMoney(menu)}**

🧾 Verkäufe: **${sales.length}**
💰 Gesamt: **${formatMoney(total)}**
        `);
    }

    if (command === "kassereset") {
        fs.writeFileSync(SALES_FILE, JSON.stringify([], null, 2));
        message.reply("✅ Kasse wurde zurückgesetzt.");
    }
});

client.login(TOKEN);