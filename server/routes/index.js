const express = require("express");
const router = express.Router();

const { getAuthorize } = require("../middlewares/auth");

router.use(getAuthorize);


module.exports = router;