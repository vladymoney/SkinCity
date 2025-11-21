
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import SteamStrategy from 'passport-steam';
import { PrismaClient } from '@prisma/client';
import steaminventory from 'get-steam-inventory'; 

const app = express();
const prisma = new PrismaClient();
const PORT = 8080;

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

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

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

const showcaseRouter = express.Router();

showcaseRouter.post('/', isAuthenticated, async (req, res) => {
  const { assetid, name, image_url, rarity_color } = req.body;
  const ownerId = req.user.id;

  if (!assetid || !name || !image_url || !rarity_color) {
    return res.status(400).json({ message: 'Missing item data.' });
  }

  try {
    const existingListing = await prisma.listedItem.findUnique({
      where: { assetid: assetid },
    });

    if (existingListing) {
      return res.status(409).json({ message: 'This item is already listed.' });
    }

    const newListedItem = await prisma.listedItem.create({
      data: {
        assetid: assetid,
        name: name,
        image_url: image_url,
        rarity_color: rarity_color,
        ownerId: ownerId,
      },
    });

    res.status(201).json(newListedItem);
  } catch (error) {
    console.error("Error listing item:", error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

showcaseRouter.delete('/:assetid', isAuthenticated, async (req, res) => {
  console.log("--- Received from Frontend ---");
  console.log("Request Body:", req.body);
  const { assetid } = req.params;
  const ownerId = req.user.id;

  try {
    const listedItem = await prisma.listedItem.findUnique({
      where: { assetid: assetid },
    });

    if (!listedItem) {
      return res.status(404).json({ message: 'Item not found in showcase.' });
    }

    if (listedItem.ownerId !== ownerId) {
      return res.status(403).json({ message: 'You are not authorized to remove this item.' });
    }

    await prisma.listedItem.delete({
      where: { assetid: assetid },
    });

    res.status(204).send(); 
  } catch (error) {
    console.error("Error unlisting item:", error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.use('/api/showcase', showcaseRouter);


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
      // THE FIX: Let's assume the library documentation is wrong
      // and the unique ID is simply called 'id'. This is common.
      assetid: item.id || item.assetid, // Use 'id' OR 'assetid', whichever exists
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


app.listen(PORT, () => {
  console.log(`✅ Backend server is running and listening on http://localhost:${PORT}`);
});