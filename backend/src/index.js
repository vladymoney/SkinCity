import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import SteamStrategy from 'passport-steam';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

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

// Get 3D Screenshot (Streamed) with Custom Branding
steamRouter.get('/float/screenshot', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing url parameter" });
    
    try {
        // Build API URL with custom parameters
        const params = new URLSearchParams({
            key: STEAMWEBAPI_KEY,
            url: url,
            color: 'black',                          // Black theme (professional)
            logo_url: 'https://webifly.bg/wp-content/uploads/2026/02/remove_background_project_1.png',
            logo_offset_start: 'top left',           // Position TOP LEFT
            logo_offset_x: '30',                     // 30px from left edge
            logo_offset_y: '30',                     // 30px from top edge
            logo_opacity: '0.95',                    // 95% opacity (very visible)
            logo_width: '180',                       // 180px width (good size)
            format: 'screen'                         // Screen format
        });
        
        const apiUrl = `https://www.steamwebapi.com/steam/api/float/screenshot?${params.toString()}`;
        
        const response = await axios({
            url: apiUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 15000,
            validateStatus: (status) => status === 200
        });

        res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Disable caching temporarily
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        response.data.pipe(res);
        
    } catch (err) {
        console.error("Screenshot API Error:", err.response?.status || err.message);
        
        if (err.response?.status === 429) {
            res.status(429).json({ error: "Rate limit exceeded" });
        } else if (err.response?.status === 404) {
            res.status(404).json({ error: "Screenshot not available" });
        } else {
            res.status(500).json({ error: "Screenshot generation failed" });
        }
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

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- START ---
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📡 Using SteamWebAPI for inventory`);
});