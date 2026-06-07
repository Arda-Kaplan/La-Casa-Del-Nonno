const { Client, GatewayIntentBits } = require("discord.js");

const { initializeApp } = require("firebase/app");
const {
    getFirestore,
    collection,
    getDocs
} = require("firebase/firestore");

const TOKEN = "DEIN_BOT_TOKEN_HIER";
const PREFIX = "!";

const firebaseConfig = {
    apiKey: "DEIN_FIREBASE_API_KEY",
    authDomain: "la-casa-del-nonno.firebaseapp.com",
    projectId: "la-casa-del-nonno",
    storageBucket: "la-casa-del-nonno.firebasestorage.app",
    messagingSenderId: "751184717495",
    appId: "1:751184717495:web:3452ad5e589591864fcf32"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " €";
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("clientReady", () => {
    console.log(`Bot online als ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const command = message.content.slice(PREFIX.length).trim().toLowerCase();

    if (command === "kasse") {
        const snapshot = await getDocs(collection(db, "sales"));

        let total = 0;
        let subtotal = 0;
        let salesCount = 0;
        let itemCount = 0;

        snapshot.forEach(doc => {
            const sale = doc.data();

            total += Number(sale.total || 0);
            subtotal += Number(sale.subtotal || 0);
            salesCount++;

            if (Array.isArray(sale.items)) {
                sale.items.forEach(item => {
                    itemCount += Number(item.qty || 0);
                });
            }
        });

        message.reply(`
📊 **Kassensturz – La Casa del Nonno**

🧾 Bestellungen: **${salesCount}**
🍽️ Produkte verkauft: **${itemCount}**

💰 Umsatz ohne Rabatt: **${formatMoney(subtotal)}**
🏷️ Rabatt gesamt: **${formatMoney(subtotal - total)}**
💵 Gesamtumsatz: **${formatMoney(total)}**
        `);
    }
});

client.login(TOKEN);
