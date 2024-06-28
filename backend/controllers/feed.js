const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");
const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res
        .status(200)
        .json({ message: "Fetched Posts successfully!", posts: posts });
    })
    .catch((err) => {
      //If statuscode doesnt exist set it to 500
      err.statusCode = err.statusCode || 500;
      next(err); //This is async code hence using next()
    });
};

exports.createPost = (req, res, next) => {
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
    creator: { name: "Kanishk" },
    imageUrl: imageUrl,
  }); //createdAt is created with the help of timestamps

  post
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Post created successfully!",
        post: result,
      });
    })
    .catch((err) => {
      //If statuscode doesnt exist set it to 500
      err.statusCode = err.statusCode || 500;
      next(err); //This is async code hence using next()
    });
};

exports.getPost = (req, res, next) => {
  const postID = req.params.postID;

  Post.findById(postID)
    .then((post) => {
      if (!post) {
        const error = new Error("Invalid postID!");
        error.statusCode = 404;
        throw err; //Despite being in async code we can use throw in then block as control is redirected to the catch block automatically
      }
      res.status(200).json({ message: "Post Fetched", post: post });
    })
    .catch((err) => {
      //If statuscode doesnt exist set it to 500
      err.statusCode = err.statusCode || 500;
      next(err); //This is async code hence using next()
    });
};

exports.editPost = (req, res, next) => {
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

  Post.findById(postID)
    .then((post) => {
      if (!post) {
        const error = new Error("Invalid PostID");
        error.statusCode = 422;
        throw error; //Will be caught by catch blcok
      }
      if (imageUrl !== post.imageUrl) {
        //If image has been updated
        deleteImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl.replace("\\", "/");
      post.content = content;
      return post.save();
    })
    .then((result) =>
      res.json({ message: "Post updated sucessfully", post: result })
    )
    .catch((err) => {
      //If statuscode doesnt exist set it to 500
      console.log(err);
      err.statusCode = err.statusCode || 500;
      next(err); //This is async code hence using next()
    });
};

const deleteImage = (filePath) => {
  const p = path.join(
    __dirname,
    "..",
    filePath.split("/")[0],
    filePath.split("/")[1]
  );
  fs.unlink(p, (err) => console.log(err));
};
