const express = require("express");

const authenticate = require(
  "../middleware/auth"
);

const {
  searchUsers,
} = require(
  "../controllers/userController"
);

const router = express.Router();

router.get(
  "/search",
  authenticate,
  searchUsers
);

module.exports = router;