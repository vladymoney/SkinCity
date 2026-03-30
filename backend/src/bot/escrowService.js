import prisma from '../prisma.js';

async function processEscrowReleases() {
    console.log('[ESCROW] Checking for releases...');

    try {
        const ready = await prisma.escrowTransaction.findMany({
            where: {
                status: 'held',
                release_after: { lte: new Date() },
            }
        });

        for (const escrow of ready) {
            await prisma.$transaction([
                prisma.escrowTransaction.update({
                    where: { id: escrow.id },
                    data: { status: 'released', released_at: new Date() }
                }),
                prisma.listing.update({
                    where: { id: escrow.listing_id },
                    data: { status: 'sold' }
                }),
            ]);
            console.log(`[ESCROW] Released $${escrow.seller_receives} to seller ${escrow.seller_id} for listing ${escrow.listing_id}`);
            // TODO: Stripe payout to seller goes here
        }

        if (ready.length === 0) console.log('[ESCROW] Nothing to release');

    } catch (err) {
        console.error('[ESCROW] Error:', err);
    }
}

export function startEscrowService() {
    console.log('[ESCROW] Service started (runs every hour)');
    processEscrowReleases();
    setInterval(processEscrowReleases, 60 * 60 * 1000);
}
