// backend/src/index.js - YOUR WORKING CODE + THE FIXES

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import SteamStrategy from 'passport-steam';
import { PrismaClient } from '@prisma/client';
import steaminventory from 'get-steam-inventory'; // This line is correct

const app = express();
const prisma = new PrismaClient();
const PORT = 8080;

// --- PASSPORT (YOUR WORKING CODE - NO CHANGES) ---
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

// --- MIDDLEWARE (YOUR WORKING CODE + 1 FIX) ---
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// *** FIX #1: ADD THIS LINE. It is required for the trade link route to read the data. ***
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
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

// --- AUTH ROUTES (YOUR WORKING CODE - NO CHANGES) ---
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

// *** FIX #2: ADD THIS ENTIRE BLOCK. This is the missing route for saving the trade link. ***
const userRouter = express.Router();
userRouter.patch('/trade-url', isAuthenticated, async (req, res) => {
  const { trade_link } = req.body;
  const userId = req.user.id;

  if (!trade_link || !trade_link.startsWith('https://steamcommunity.com/tradeoffer/new/')) {
    return res.status(400).json({ message: 'Invalid Steam Trade URL format.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { trade_link: trade_link },
    });
    res.json({ message: 'Trade URL saved successfully!', user: updatedUser });
  } catch (error) {
    console.error("Error saving trade URL:", error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});
app.use('/api/user', userRouter);


// --- INVENTORY ROUTES (YOUR WORKING CODE - NO CHANGES) ---
const inventoryRouter = express.Router();
inventoryRouter.get('/cs2', isAuthenticated, async (req, res) => {
  try {
    const steamId = req.user.steam_id;
    const appId = 730;
    const contextId = '2'; 

    const inventory = await steaminventory.getinventory(appId, steamId, contextId);

    if (!inventory || !inventory.items) {
      return res.json([]);
    }

    const formattedInventory = inventory.items.map(item => ({
      assetid: item.assetid,
      name: item.market_hash_name,
      image: item.icon_url_large || item.icon_url,
      rarity_color: `#${item.name_color}`,
    }));

    res.json(formattedInventory);

  } catch (err) {
    console.error("[get-steam-inventory] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});
app.use('/api/inventory', inventoryRouter);


// --- START SERVER (YOUR WORKING CODE - NO CHANGES) ---
app.listen(PORT, () => {
  console.log(`✅ Backend server is running and listening on http://localhost:${PORT}`);
});