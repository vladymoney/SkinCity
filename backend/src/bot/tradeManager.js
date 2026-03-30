import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const TradeOfferManager = require('steam-tradeoffer-manager');

import { manager, community, isBotReady } from './steamBot.js';
import prisma from '../prisma.js';

// Step 1: Bot requests item FROM seller when they create a listing
export async function requestItemFromSeller(listing) {
    return new Promise((resolve, reject) => {
        if (!isBotReady()) return reject(new Error('Bot not ready'));

        const offer = manager.createOffer(listing.seller_trade_url);

        offer.addTheirItem({
            appid: 730,   // CS2
            contextid: 2,
            assetid: listing.assetid,
        });

        offer.setMessage(`SkinCity - обява #${listing.id} - моля изпратете вашия предмет`);

        offer.send((err, status) => {
            if (err) {
                console.error('[BOT] Failed to send offer to seller:', err.message);
                return reject(err);
            }
            console.log(`[BOT] Offer sent to seller. ID: ${offer.id}, Status: ${status}`);

            // Auto-confirm sending if needed
            if (status === 'pending') {
                community.acceptConfirmationForObject(
                    process.env.BOT_IDENTITY_SECRET,
                    offer.id,
                    (err) => { if (err) console.error('[BOT] Confirm error:', err); }
                );
            }

            resolve(offer.id);
        });
    });
}

// Step 2: Bot sends item TO buyer after purchase
export async function sendItemToBuyer(listing) {
    return new Promise((resolve, reject) => {
        if (!isBotReady()) return reject(new Error('Bot not ready'));

        const offer = manager.createOffer(listing.buyer_trade_url);

        offer.addMyItem({
            appid: 730,
            contextid: 2,
            assetid: listing.assetid,
        });

        offer.setMessage(`SkinCity - покупка #${listing.id} - вашият предмет пристига!`);

        offer.send((err, status) => {
            if (err) {
                console.error('[BOT] Failed to send offer to buyer:', err.message);
                return reject(err);
            }
            console.log(`[BOT] Offer sent to buyer. ID: ${offer.id}, Status: ${status}`);

            if (status === 'pending') {
                community.acceptConfirmationForObject(
                    process.env.BOT_IDENTITY_SECRET,
                    offer.id,
                    (err) => { if (err) console.error('[BOT] Confirm error:', err); }
                );
            }

            resolve(offer.id);
        });
    });
}

// Cancel an active trade offer
export async function cancelOffer(tradeOfferId) {
    return new Promise((resolve, reject) => {
        manager.getOffer(tradeOfferId, (err, offer) => {
            if (err) return reject(err);
            offer.cancel((err) => {
                if (err) return reject(err);
                console.log(`[BOT] Offer ${tradeOfferId} cancelled`);
                resolve();
            });
        });
    });
}

// Listen for offer state changes and update DB
manager.on('offerChanged', async (offer, oldState) => {
    const { Accepted, Declined, Canceled, Expired } = TradeOfferManager.ETradeOfferState;

    try {
        const listing = await prisma.listing.findFirst({
            where: {
                OR: [
                    { seller_offer_id: offer.id },
                    { buyer_offer_id: offer.id },
                ]
            }
        });

        if (!listing) return;

        // Seller sent item to bot → now in bot inventory, ready for sale
        if (offer.state === Accepted && listing.seller_offer_id === offer.id) {
            console.log(`[BOT] Item received from seller for listing ${listing.id}`);
            await prisma.listing.update({
                where: { id: listing.id },
                data: { status: 'listed' } // now truly listed with item in bot
            });
        }

        // Buyer received item → start escrow countdown
        if (offer.state === Accepted && listing.buyer_offer_id === offer.id) {
            console.log(`[BOT] Buyer received item for listing ${listing.id}`);
            const releaseAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await prisma.listing.update({
                where: { id: listing.id },
                data: { status: 'in_escrow', completed_at: new Date() }
            });
            await prisma.escrowTransaction.updateMany({
                where: { listing_id: listing.id },
                data: { status: 'held', release_after: releaseAfter }
            });
        }

        // Seller declined/cancelled/expired → cancel listing
        if ([Declined, Canceled, Expired].includes(offer.state) && listing.seller_offer_id === offer.id) {
            console.log(`[BOT] Seller offer failed for listing ${listing.id}`);
            await prisma.listing.update({
                where: { id: listing.id },
                data: { status: 'cancelled' }
            });
        }

    } catch (err) {
        console.error('[BOT] offerChanged DB error:', err);
    }
});
