const express = require("express");

const authenticate = require("../middleware/auth");

const { getPresence } = require("../controllers/presenceController");

const router = express.Router();

router.post("/", authenticate, getPresence);

module.exports = router;
