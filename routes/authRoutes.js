const { Router } = require("express");
const authController = require("../controllers/authController");

const router = Router();

// GET ROUTES
router.get("/signup", authController.signup_get);
router.get("/login", authController.login_get);
router.get("/logout", authController.logout_get);
// POST ROUTES
router.post("/signup", authController.signup_post);
router.post("/login", authController.login_post);

module.exports = router;
