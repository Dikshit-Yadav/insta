// middleware/authMiddleware.js
module.exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
      return next(); // User is logged in, proceed to the next middleware/route
    } else {
      return res.redirect('/login'); // User is not logged in, redirect to login page
    }
  };
  