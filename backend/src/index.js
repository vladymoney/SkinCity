import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import SteamStrategy from 'passport-steam';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { login as botLogin } from './bot/steamBot.js';
import { startEscrowService } from './bot/escrowService.js';

const app = express();
const prisma = new PrismaClient();
const PORT = 8080;

// YOUR API KEY (Required for the Proxy Routes)
const STEAMWEBAPI_KEY = "UTJS2Q98AP3BTYNU"; 

// --- PASSPORT CONFIG ---
passport.use(new SteamStrategy({
    returnURL: 'http://localhost:8080/api/auth/steam/return',
    realm: 'http://localhost:8080/',
    apiKey: process.env.STEAM_API_KEY
}, async (identifier, profile, done) => {
    try {
        const user = await prisma.user.upsert({
            where: { steam_id: profile.id },
            update: { username: profile.displayName, avatar_url: profile.photos[2].value },
            create: { steam_id: profile.id, username: profile.displayName, avatar_url: profile.photos[2].value }
        });
        return done(null, user);
    } catch (error) { return done(error, null); }
}));

passport.serializeUser((user, done) => { done(null, user.id); });
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) { done(error, null); }
});

// --- MIDDLEWARE ---
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Not authenticated' });
};

// --- AUTH ROUTES ---
const authRouter = express.Router();
authRouter.get('/steam', passport.authenticate('steam'));
authRouter.get('/steam/return', passport.authenticate('steam', { failureRedirect: process.env.FRONTEND_URL }), (req, res) => res.redirect(process.env.FRONTEND_URL));
authRouter.get('/me', (req, res) => {
    if (req.isAuthenticated()) res.json(req.user);
    else res.status(401).json({ message: 'Not authenticated' });
});
authRouter.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect(process.env.FRONTEND_URL);
    });
});
app.use('/api/auth', authRouter);

// --- USER ROUTES ---
const userRouter = express.Router();
userRouter.patch('/trade-url', isAuthenticated, async (req, res) => {
  const { trade_link } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { trade_link },
    });
    res.json({ message: 'Saved', user: updatedUser });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
});
app.use('/api/user', userRouter);

// --- SHOWCASE ROUTES ---
const showcaseRouter = express.Router();
showcaseRouter.post('/', isAuthenticated, async (req, res) => {
  const { assetid, name, image_url, rarity_color } = req.body;
  try {
    const existing = await prisma.listedItem.findUnique({ where: { assetid } });
    if (existing) return res.status(409).json({ message: 'Already listed' });
    const newItem = await prisma.listedItem.create({
      data: { assetid, name, image_url, rarity_color, ownerId: req.user.id },
    });
    res.status(201).json(newItem);
  } catch (error) { res.status(500).json({ message: 'Error' }); }
});
showcaseRouter.get('/mine', isAuthenticated, async (req, res) => {
    try {
        const items = await prisma.listedItem.findMany({ where: { ownerId: req.user.id } });
        res.json(items);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});
showcaseRouter.delete('/:assetid', isAuthenticated, async (req, res) => {
  const { assetid } = req.params;
  try {
    const item = await prisma.listedItem.findUnique({ where: { assetid } });
    if (!item || item.ownerId !== req.user.id) return res.status(403).send();
    await prisma.listedItem.delete({ where: { assetid } });
    res.status(204).send(); 
  } catch (error) { res.status(500).send(); }
});
app.use('/api/showcase', showcaseRouter);

// --- INVENTORY ROUTER (USING STEAMWEBAPI) ---
const inventoryRouter = express.Router();

inventoryRouter.get('/cs2', isAuthenticated, async (req, res) => {
  try {
    const steamId = req.user.steam_id;
    
    // Call SteamWebAPI inventory endpoint
    const apiUrl = `https://www.steamwebapi.com/steam/api/inventory?key=${STEAMWEBAPI_KEY}&steam_id=${steamId}&game=cs2&parse=1`;
    
    console.log(`Fetching inventory for Steam ID: ${steamId}`);
    
    const response = await axios.get(apiUrl, { timeout: 30000 });
    
    if (!Array.isArray(response.data)) {
      console.error("Invalid response from SteamWebAPI:", response.data);
      return res.status(500).json({ message: "Invalid API response" });
    }

    // Format the data for frontend
    const formattedInventory = response.data.map(item => {
      return {
        // Basic Info
        assetid: item.assetid || item.id,
        name: item.markethashname || item.marketname,
        image: item.image,
        
        // Rarity & Type
        rarity_color: item.bordercolor ? `#${item.bordercolor}` : '#FFFFFF',
        rarity: item.itemtype || item.quality || 'Unknown',
        
        // Inspect Link (already properly formatted from API)
        inspect_link: item.inspectlink || null,
        
        // Float Data (already included!)
        float: item.float || null,
        
        // Price Data (already included!)
        pricelatest: item.pricelatest,
        pricereal: item.pricereal,
        priceavg: item.priceavg,
        pricemedian: item.pricemedian,
        
        // Additional metadata
        tradable: item.tradable !== false,
        nametag: item.nametag || null,
        
        // Keep full item for modal if needed
        _raw: item
      };
    });

    console.log(`✅ Inventory loaded: ${formattedInventory.length} items`);
    res.json(formattedInventory);
    
  } catch (err) {
    console.error("Inventory API Error:", err.message);
    
    if (err.response?.status === 429) {
      res.status(429).json({ message: "Rate limit exceeded. Please try again in a few minutes." });
    } else if (err.response?.status === 403) {
      res.status(403).json({ message: "Steam inventory is private. Please make it public in Steam settings." });
    } else if (err.code === 'ECONNABORTED') {
      res.status(504).json({ message: "Request timeout. Please try again." });
    } else {
      res.status(500).json({ message: err.message || "Failed to load inventory" });
    }
  }
});

app.use('/api/inventory', inventoryRouter);

// --- STEAM PROXY ROUTES ---
const steamRouter = express.Router();

// Get 3D Screenshot (Streamed)
steamRouter.get('/float/screenshot', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing url parameter" });

    try {
        const params = new URLSearchParams({
            key: STEAMWEBAPI_KEY,
            url: url,
            color: 'black',
            format: 'screen'
        });

        const apiUrl = `https://www.steamwebapi.com/steam/api/float/screenshot?${params.toString()}`;

        const response = await axios({
            url: apiUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 20000,
            validateStatus: (status) => status < 500,
        });

        if (response.status !== 200) {
            console.error(`Screenshot API returned ${response.status}`);
            if (response.status === 429) return res.status(429).json({ error: "Rate limit exceeded" });
            return res.status(404).json({ error: "Screenshot not available" });
        }

        res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        response.data.pipe(res);

    } catch (err) {
        console.error("Screenshot API Error:", err.response?.status, err.message);
        if (err.code === 'ECONNABORTED') return res.status(504).json({ error: "Screenshot timeout" });
        res.status(500).json({ error: "Screenshot generation failed" });
    }
});

// Get Price History
steamRouter.get('/history', async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: "Missing name parameter" });
    
    try {
        const response = await axios.get(
            `https://www.steamwebapi.com/steam/api/history?key=${STEAMWEBAPI_KEY}&market_hash_name=${encodeURIComponent(name)}`,
            { timeout: 10000 }
        );
        
        // Response format: [[timestamp, price], [timestamp, price], ...]
        res.json(response.data);
    } catch (e) {
        console.error("Price History API Error:", e.response?.status, e.message);
        
        if (e.response?.status === 429) {
            res.status(429).json({ error: "Rate limit exceeded" });
        } else {
            res.status(500).json({ error: "History API unavailable" });
        }
    }
});

app.use('/api/steam', steamRouter);

// --- MARKETPLACE ROUTES ---
const marketRouter = express.Router();

// Browse all active listings (public)
marketRouter.get('/', async (req, res) => {
    const { sort = 'listed_at_desc', min_price, max_price, search, page = 1 } = req.query;
    const PAGE_SIZE = 24;
    const skip = (parseInt(page) - 1) * PAGE_SIZE;

    const where = { status: 'listed' };
    if (min_price || max_price) {
        where.price = {};
        if (min_price) where.price.gte = parseFloat(min_price);
        if (max_price) where.price.lte = parseFloat(max_price);
    }
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const orderByMap = {
        price_asc:      { price: 'asc' },
        price_desc:     { price: 'desc' },
        float_asc:      { float_value: 'asc' },
        float_desc:     { float_value: 'desc' },
        listed_at_desc: { listed_at: 'desc' },
        views_desc:     { views: 'desc' },
    };
    const orderBy = orderByMap[sort] || { listed_at: 'desc' };

    try {
        const [listings, total] = await Promise.all([
            prisma.listing.findMany({
                where, orderBy, skip, take: PAGE_SIZE,
                include: { seller: { select: { username: true, avatar_url: true, steam_id: true } } },
            }),
            prisma.listing.count({ where }),
        ]);
        res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / PAGE_SIZE) });
    } catch (err) {
        console.error('Market browse error:', err);
        res.status(500).json({ message: 'Error fetching listings' });
    }
});

// Create a listing (seller posts item for sale)
marketRouter.post('/', isAuthenticated, async (req, res) => {
    const { assetid, name, image_url, rarity_color, float_value, stickers, price } = req.body;

    if (!assetid || !name || !image_url || !price) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const numPrice = parseFloat(price);
    if (numPrice < 0.50 || numPrice > 10000) {
        return res.status(400).json({ message: 'Price must be between $0.50 and $10,000' });
    }

    try {
        const existing = await prisma.listing.findUnique({ where: { assetid } });
        if (existing && existing.status !== 'cancelled') {
            return res.status(409).json({ message: 'Item already listed' });
        }

        const listing = await prisma.listing.upsert({
            where: { assetid },
            update: {
                seller_id: req.user.id, buyer_id: null, name, image_url, rarity_color,
                float_value: float_value ?? null, stickers: stickers ?? null,
                price: numPrice, status: 'listed',
                seller_trade_url: req.user.trade_link ?? null,
                listed_at: new Date(), purchased_at: null, completed_at: null, views: 0,
            },
            create: {
                assetid, seller_id: req.user.id, name, image_url, rarity_color,
                float_value: float_value ?? null, stickers: stickers ?? null,
                price: numPrice, seller_trade_url: req.user.trade_link ?? null,
            },
        });
        res.status(201).json(listing);
    } catch (err) {
        console.error('Create listing error:', err);
        res.status(500).json({ message: 'Error creating listing' });
    }
});

// Get single listing by id (increments views)
marketRouter.get('/:id', async (req, res) => {
    try {
        const listing = await prisma.listing.findUnique({
            where: { id: req.params.id },
            include: { seller: { select: { username: true, avatar_url: true, steam_id: true } } },
        });
        if (!listing) return res.status(404).json({ message: 'Not found' });
        // Increment view count async (fire-and-forget)
        prisma.listing.update({ where: { id: listing.id }, data: { views: { increment: 1 } } }).catch(() => {});
        res.json(listing);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching listing' });
    }
});

// Cancel a listing (seller only)
marketRouter.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
        if (!listing) return res.status(404).json({ message: 'Not found' });
        if (listing.seller_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
        if (listing.status !== 'listed') return res.status(400).json({ message: 'Can only cancel active listings' });

        await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error cancelling listing' });
    }
});

// Purchase flow: buyer initiates purchase
marketRouter.post('/:id/purchase', isAuthenticated, async (req, res) => {
    const { buyer_trade_url } = req.body;
    if (!buyer_trade_url) return res.status(400).json({ message: 'Trade URL required' });

    try {
        const listing = await prisma.listing.findUnique({
            where: { id: req.params.id },
            include: { seller: true },
        });
        if (!listing) return res.status(404).json({ message: 'Not found' });
        if (listing.status !== 'listed') return res.status(400).json({ message: 'Item is no longer available' });
        if (listing.seller_id === req.user.id) return res.status(400).json({ message: 'Cannot buy your own listing' });

        const commission = parseFloat((listing.price * 0.05).toFixed(2));
        const seller_receives = parseFloat((listing.price - commission).toFixed(2));

        const releaseAfter = new Date();
        releaseAfter.setDate(releaseAfter.getDate() + 7);

        const [updatedListing] = await prisma.$transaction([
            prisma.listing.update({
                where: { id: req.params.id },
                data: {
                    status: 'pending_purchase',
                    buyer_id: req.user.id,
                    buyer_trade_url,
                    purchased_at: new Date(),
                },
            }),
            prisma.escrowTransaction.create({
                data: {
                    listing_id: listing.id,
                    buyer_id: req.user.id,
                    seller_id: listing.seller_id,
                    item_price: listing.price,
                    commission,
                    seller_receives,
                    release_after: releaseAfter,
                },
            }),
        ]);

        res.json({
            message: 'Purchase initiated',
            listing: updatedListing,
            seller_trade_url: listing.seller_trade_url,
            instructions: 'Send the item to the buyer using the trade URL provided. Funds will be released after 7 days.',
        });
    } catch (err) {
        console.error('Purchase error:', err);
        res.status(500).json({ message: 'Error processing purchase' });
    }
});

// Get seller's own listings
marketRouter.get('/my/listings', isAuthenticated, async (req, res) => {
    try {
        const listings = await prisma.listing.findMany({
            where: { seller_id: req.user.id },
            orderBy: { listed_at: 'desc' },
            include: { escrow: true },
        });
        res.json(listings);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching listings' });
    }
});

app.use('/api/market', marketRouter);

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- START ---
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📡 Using SteamWebAPI for inventory`);
  botLogin();
  startEscrowService();
});