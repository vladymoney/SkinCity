import express from 'express';
import passport from 'passport';

const router = express.Router();


router.get('/steam', passport.authenticate('steam'));

router.get(
  '/steam/return',
  passport.authenticate('steam', {
    failureRedirect: process.env.FRONTEND_URL, 
  }),
  (req, res) => {

    res.redirect(process.env.FRONTEND_URL);
  }
);

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user); 
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect(process.env.FRONTEND_URL);
  });
});

export default router;