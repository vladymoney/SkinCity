import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');

const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeOfferManager({
    steam: client,
    community: community,
    language: 'en',
    pollInterval: 10000, // check for new trade offers every 10 seconds
});

let botReady = false;

export function login() {
    const logOnOptions = {
        accountName: process.env.BOT_USERNAME,
        password: process.env.BOT_PASSWORD,
        twoFactorCode: SteamTotp.generateAuthCode(process.env.BOT_SHARED_SECRET),
    };

    console.log('[BOT] Logging into Steam as', process.env.BOT_USERNAME);
    client.logOn(logOnOptions);
}

client.on('loggedOn', () => {
    console.log('[BOT] Logged into Steam successfully');
    client.setPersona(SteamUser.EPersonaState.Online);
});

client.on('webSession', (sessionID, cookies) => {
    console.log('[BOT] Got web session');

    manager.setCookies(cookies, (err) => {
        if (err) {
            console.error('[BOT] Error setting trade manager cookies:', err);
            return;
        }
        console.log('[BOT] Trade offer manager ready');
        botReady = true;
    });

    community.setCookies(cookies);
    community.startConfirmationChecker(10000, process.env.BOT_IDENTITY_SECRET);
});

client.on('disconnected', (eresult, msg) => {
    console.warn('[BOT] Disconnected:', msg, '— retrying in 10s');
    botReady = false;
    setTimeout(login, 10000);
});

client.on('error', (err) => {
    console.error('[BOT] Error:', err.message, '— retrying in 15s');
    botReady = false;
    setTimeout(login, 15000);
});

manager.on('offerChanged', (offer, oldState) => {
    console.log(`[BOT] Offer ${offer.id}: ${TradeOfferManager.ETradeOfferState[oldState]} → ${TradeOfferManager.ETradeOfferState[offer.state]}`);
});

manager.on('pollFailure', (err) => {
    console.error('[BOT] Poll failure:', err.message);
});

export function isBotReady() {
    return botReady;
}

export { client, community, manager };
