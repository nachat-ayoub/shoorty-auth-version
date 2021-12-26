const { Router } = require("express");
const userController = require("../controllers/userController");

const router = Router();

// GET ROUTES
router.get("/dashboard/:id", userController.dashboard_get);
router.post("/dashboard/:id", userController.dashboard_post);
//
router.get("/dashboard/:url_slug/info", userController.url_info_get);

module.exports = router;
