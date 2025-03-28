const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const token = JSON.parse(fs.readFileSync('./config.json')).telegramkey;
const bot = new TelegramBot(token, { polling: true });
const urlIngredients = "https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=%INGREDIENT";
const urlDrinkDetails = "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=%DRINKNAME";
let ingredientsList = [];
let foundDrinks = [];

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") {
        ingredientsList = [];
        foundDrinks = [];
        bot.sendMessage(chatId, "Scrivi i tuoi ingredienti uno ad uno per cercare il drink perfetto! Quando hai finito, scrivi 'fine'.");
    } else if (foundDrinks.includes(text)) {
        const url = urlDrinkDetails.replace("%DRINKNAME", encodeURIComponent(text));
        try {
            const response = await fetch(url);
            if (!response.ok) {
                bot.sendMessage(chatId, `Errore nel recupero della ricetta per il drink "${text}".`);
                return;
            }
            const data = await response.json();
            if (data.drinks && data.drinks.length > 0) {
                const drink = data.drinks[0];
                let recipe = `Ecco la ricetta per il drink "${drink.strDrink}":\n\n`;
                recipe += `Categoria: ${drink.strCategory}\n`;
                recipe += `Alcolico: ${drink.strAlcoholic}\n`;
                recipe += `Bicchiere: ${drink.strGlass}\n\n`;
                recipe += `Ingredienti:\n`;

            
                for (let i = 1; i <= 15; i++) {
                    const ingredient = drink[`strIngredient${i}`];
                    const measure = drink[`strMeasure${i}`];
                    if (ingredient) {
                        recipe += `- ${ingredient}${measure ? ` (${measure.trim()})` : ""}\n`;
                    }
                }

                recipe += `\nIstruzioni:\n${drink.strInstructions}`;
                bot.sendMessage(chatId, recipe);
            } else {
                bot.sendMessage(chatId, `Non ho trovato la ricetta per il drink "${text}".`);
            }
        } catch (error) {
            console.error(`errore durante il recupero della ricetta per il drink "${text}":`, error);
            bot.sendMessage(chatId, `si è verificato un errore durante il recupero della ricetta per il drink "${text}".`);
        }
    } else if (text === "fine") {
        if (ingredientsList.length === 0) {
            bot.sendMessage(chatId, "Non hai fornito alcun ingrediente. Riprova!");
            return;
        }

        bot.sendMessage(chatId, "Sto cercando i drink con gli ingredienti comuni...");

        const maxCalls = 20;
        const limitedIngredientsList = ingredientsList.slice(0, maxCalls);

        const drinkLists = [];
        for (const ingredient of limitedIngredientsList) {
            try {
                const url = urlIngredients.replace("%INGREDIENT", ingredient);
                const response = await fetch(url);
                if (!response.ok) {
                    console.error(`errore  chiamata api per ingrediente "${ingredient}"`);
                    drinkLists.push([]);
                    continue;
                }
                const data = await response.json();
                let drinkNames = [];
                if (Array.isArray(data.drinks)) {
                    drinkNames = data.drinks.map((drink) => drink.strDrink);
                }
                drinkLists.push(drinkNames);
            } catch (error) {
                console.error(`errore  chiamata api per ingrediente "${ingredient}":`, error);
                drinkLists.push([]);
            }
        }

        let commonDrinks = drinkLists[0];
        for (let i = 1; i < drinkLists.length; i++) {
            const currentList = drinkLists[i];
            commonDrinks = commonDrinks.filter(drink => currentList.includes(drink));
        }

        if (commonDrinks.length === 0) {
            bot.sendMessage(chatId, "Non ho trovato nessun drink.");
        } else {
            foundDrinks = commonDrinks;
            bot.sendMessage(chatId, "Ecco i drink che puoi preparare con questi ingredienti comuni:");
            commonDrinks.forEach(drink => bot.sendMessage(chatId, `- ${drink}`));
            bot.sendMessage(chatId, "Scrivi il nome di uno dei drink per ricevere la ricetta.");
        }
    } else if (text !== "/start") {
        ingredientsList.push(text);
        bot.sendMessage(chatId, "Ingrediente aggiunto! Scrivi un altro ingrediente o 'fine' per terminare.");
    } else {
        bot.sendMessage(chatId, "Non ho capito. Scrivi il nome di un drink trovato o usa /start per ricominciare.");
    }
});