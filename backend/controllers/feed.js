const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");

exports.getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("Invalid User Id");
      error.statusCode = 500;
      throw error;
    }

    res.status(200).json({ message: "Status fetched", status: user.status });
  } catch (err) {
    //If statuscode doesnt exist set it to 500
    err.statusCode = err.statusCode || 500;
    next(err); //This is async code hence using next()
  }
};

exports.updateStatus = async (req, res, next) => {
  const newStatus = req.body.status;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid User Id");
      error.statusCode = 404;
      throw error;
    }
    user.status = newStatus;
    fetched_user = user;

    await user.save();

    res
      .status(200)
      .json({ message: "Status updated", status: fetched_user.status });
  } catch (err) {
    //If statuscode doesnt exist set it to 500
    console.log(err);
    err.statusCode = err.statusCode || 500;
    next(err); //This is async code hence using next()
  }
};

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const ITEMS_PER_PAGE = 2;

  try {
    let totalItems = await Post.countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .skip((currentPage - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    //Response
    res.status(200).json({
      message: "Fetched Posts successfully!",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    //If statuscode doesnt exist set it to 500
    err.statusCode = err.statusCode || 500;
    next(err); //This is async code hence using next()
  }
};

exports.createPost = async (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  const errors = validationResult(req);
  const image = req.file;

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");

    error.statusCode = 422;
    throw error; //Since we are in sync code we are throwing err
  }

  if (!image) {
    const error = new Error("No Image Provided");
    error.statusCode = 422;
    throw error; //Since we are in sync code we are throwing err
  }

  // Create post in db
  const imageUrl = image.path.replace("\\", "/");
  console.log(image);
  const post = new Post({
    title: title,
    content: content,
    creator: req.userId, //From isAuth middleware, attach post to user
    imageUrl: imageUrl,
  }); //createdAt is created with the help of timestamps

  try {
    await post.save();
    const user = await User.findById(req.userId);

    // Attach user to post
    user.posts.push(post);
    fetched_user = user;
    await user.save();

    res.status(201).json({
      message: "Post created successfully!",
      post: post,
      creator: { _id: fetched_user._id, name: fetched_user.name },
    });
  } catch (err) {
    //If statuscode doesnt exist set it to 500
    err.statusCode = err.statusCode || 500;
    next(err); //This is async code hence using next()
  }
};

exports.getPost = async (req, res, next) => {
  const postID = req.params.postID;

  try {
    const post = await Post.findById(postID);
    if (!post) {
      const error = new Error("Invalid postID!");
      error.statusCode = 404;
      throw error; //Despite being in async code we can use throw in then block as control is redirected to the catch block automatically
    }
    res.status(200).json({ message: "Post Fetched", post: post });
  } catch (err) {
    //If statuscode doesnt exist set it to 500
    err.statusCode = err.statusCode || 500;
    next(err); //This is async code hence using next()
  }
};

exports.editPost = async (req, res, next) => {
  const postID = req.params.postID;
  const title = req.body.title;
  let imageUrl = req.body.image;
  const content = req.body.content;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");

    error.statusCode = 422;
    throw error; //Since we are in sync code we are throwing err
  }

  if (req.file) {
    //In case file is uploaded to change imageUrl
    imageUrl = req.file.path;
  }

  if (!imageUrl) {
    const error = new Error("No file picked");
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postID);
    if (!post) {
      const error = new Error("Invalid PostID");
      error.statusCode = 404;
      throw error; //Will be caught by catch block
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    if (imageUrl !== post.imageUrl) {
      //If image has been updated
      deleteImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl.replace("\\", "/");
    post.content = content;

    const result = await post.save();

    res.status(200).json({ message: "Post updated sucessfully", post: result });
  } catch (err) {
    //If statuscode doesnt exist set it to 500
    console.log(err);
    err.statusCode = err.statusCode || 500;
    next(err); //This is async code hence using next()
  }
};

//Helper function
const deleteImage = (filePath) => {
  const p = path.join(
    __dirname,
    "..",
    filePath.split("/")[0],
    filePath.split("/")[1]
  );
  fs.unlink(p, (err) => console.log(err));
};

exports.deletePost = async (req, res, next) => {
  const postID = req.params.postID;

  try {
    const post = await Post.findById(postID);

    if (!post) {
      const error = new Error("Invalid PostID");
      error.statusCode = 404;
      throw error; //Will be caught by catch block
    }

    //Checking if logged in user matches post creator
    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    // We also have to remove this from Users.posts
    deleteImage(post.imageUrl);

    await Post.findByIdAndDelete(postID);
    const user = await User.findById(req.userId);

    //pull function is provided by mongoose
    user.posts.pull(postID);

    await user.save();
    res.status(200).json({ message: "Post Deleted Sucessfully" });
  } catch (err) {
    //If statuscode doesnt exist set it to 500
    console.log(err);
    err.statusCode = err.statusCode || 500;
    next(err); //This is async code hence using next()
  }
};
