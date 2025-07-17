import { Router } from "express";
import multer from "multer";
import path from "path";
import { Image } from "../models/image.js";
import { Comment } from "../models/comments.js";
import {
  authenticateToken,
  authenticateTokenOptional,
} from "../middleware/authenticate.js";

export const imagesRouter = Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/gif"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (png, jpg, jpeg, gif)"));
    }
  },
});

imagesRouter.get("/", authenticateTokenOptional, async (req, res) => {
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;
  const mode = req.query.mode;

  const page = rawPage === undefined ? 0 : parseInt(rawPage, 10);
  const limit = rawLimit === undefined ? 10 : parseInt(rawLimit, 10);

  if (
    (rawPage !== undefined && (isNaN(page) || page < 0)) ||
    (rawLimit !== undefined && (isNaN(limit) || limit <= 0 || limit > 100))
  ) {
    return res.status(422).json({
      error:
        "'page' must be a non-negative integer and 'limit' must be between 1 and 100.",
    });
  }

  const offset = page * limit;
  let where = undefined;

  if (mode === "mine") {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Authentication required for my gallery." });
    }
    where = { userId: req.user.id };
  }

  const { count, rows: images } = await Image.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  res.json({
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
    images,
  });
});

imagesRouter.post("/", authenticateToken, (req, res) => {
  upload.single("image")(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const { title, author } = req.body;

    if (
      typeof title !== "string" ||
      typeof author !== "string" ||
      title.trim() === "" ||
      author.trim() === ""
    ) {
      return res
        .status(422)
        .json({ error: "Title and author can't be empty." });
    }

    const url = `/uploads/${req.file.filename}`;
    const image = await Image.create({
      title: title.trim(),
      author: author.trim(),
      url: `/uploads/${req.file.filename}`,
      userId: req.user.id,
    });

    return res.json(image);
  });
});

imagesRouter.get("/:id", async (req, res) => {
  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found" });
  return res.json(image);
});

imagesRouter.delete("/:id", authenticateToken, async (req, res) => {
  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found" });

  if (image.userId !== req.user.id) {
    return res
      .status(401)
      .json({ error: "Unauthorized: you do not own this image." });
  }

  await image.destroy();
  return res.json({ message: "Image deleted" });
});

imagesRouter.patch("/:id", async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res
      .status(400)
      .json({ error: "Request body must be a JSON object" });
  }

  const { title, author } = req.body;

  if (
    (title !== undefined &&
      (typeof title !== "string" || title.trim() === "")) ||
    (author !== undefined &&
      (typeof author !== "string" || author.trim() === ""))
  ) {
    return res.status(422).json({ error: "Title and author can't be empty" });
  }

  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found" });

  if (title !== undefined) image.title = title.trim();
  if (author !== undefined) image.author = author.trim();
  await image.save();

  return res.json(image);
});

imagesRouter.get("/:id/comments", authenticateToken, async (req, res) => {
  const image = await Image.findByPk(req.params.id);
  if (!image) {
    return res.status(404).json({ error: "Image not found" });
  }

  const rawPage = req.query.page;
  const page = rawPage === undefined ? 0 : parseInt(rawPage, 10);

  if (isNaN(page) || page < 0) {
    return res
      .status(422)
      .json({ error: "'page' must be a non-negative integer." });
  }

  const limit = 10;
  const offset = page * limit;

  const comments = await Comment.findAll({
    where: { imageId: image.id },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return res.json({ comments });
});

imagesRouter.post("/:id/comments", authenticateToken, async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res
      .status(400)
      .json({ error: "Request body must be a JSON object." });
  }

  const { content } = req.body;
  const author = req.user.username;

  if (typeof content !== "string" || content.trim() === "") {
    return res.status(422).json({
      error: "Content must be a non-empty string.",
    });
  }

  const image = await Image.findByPk(req.params.id);
  if (!image) return res.status(404).json({ error: "Image not found" });

  const comment = await Comment.create({
    imageId: image.id,
    author: author.trim(),
    content: content.trim(),
  });

  return res.json(comment);
});
