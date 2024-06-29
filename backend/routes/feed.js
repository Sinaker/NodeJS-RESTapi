const express = require("express");
const { body } = require("express-validator");

const feedController = require("../controllers/feed");
const isAuth = require("../middleware/isAuth");

const router = express.Router();

// GET /feed/posts
router.get("/posts", isAuth, feedController.getPosts);

// POST /feed/post
router.post(
  "/post",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost
);

router.get("/post/:postID", isAuth, feedController.getPost);

router.put(
  "/post/:postID",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.editPost
);

router.delete("/post/:postID", isAuth, feedController.deletePost);
module.exports = router;
