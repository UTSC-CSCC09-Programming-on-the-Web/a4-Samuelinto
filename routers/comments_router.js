import { Router } from "express";
import { Comment } from "../models/comments.js";
import { Image } from "../models/image.js";
import { authenticateToken } from "../middleware/authenticate.js";

export const commentsRouter = Router();

commentsRouter.get("/:imageId", authenticateToken, async (req, res) => {
  const image = await Image.findByPk(req.params.imageId);
  if (!image) {
    return res.status(404).json({ error: "Image not found" });
  }

  const rawPage = req.query.page;
  const page = parseInt(rawPage, 10);

  if (rawPage !== undefined && (isNaN(page) || page < 0)) {
    return res.status(422).json({ error: "page can't be negative" });
  }

  const limit = 10;
  const offset = (page || 0) * limit;

  const comments = await Comment.findAll({
    where: { imageId: req.params.imageId },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return res.json({ comments });
});

commentsRouter.delete("/:id", authenticateToken, async (req, res) => {
  const comment = await Comment.findByPk(req.params.id);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const image = await Image.findByPk(comment.imageId);
  if (!image)
    return res.status(404).json({ error: "Associated image not found" });

  const isCommentOwner = comment.author === req.user.username;
  const isGalleryOwner = image.userId === req.user.id;

  if (!isCommentOwner && !isGalleryOwner) {
    return res
      .status(403)
      .json({ error: "You do not have permission to delete this comment" });
  }

  await comment.destroy();
  res.json({ message: "Comment deleted" });
});

commentsRouter.patch("/:id", async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res
      .status(400)
      .json({ error: "Request body must be a JSON object." });
  }
  const { author, content } = req.body;

  if (
    (author !== undefined &&
      (typeof author !== "string" || author.trim() === "")) ||
    (content !== undefined &&
      (typeof content !== "string" || content.trim() === ""))
  ) {
    return res
      .status(422)
      .json({ error: "author and content can't be empty." });
  }

  const comment = await Comment.findByPk(req.params.id);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  if (author !== undefined) comment.author = author.trim();
  if (content !== undefined) comment.content = content.trim();
  await comment.save();

  return res.json(comment);
});
