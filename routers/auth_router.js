import { Router } from "express";
import crypto from "crypto";
import { User } from "../models/user.js";
import { Token } from "../models/token.js";
import { authenticateToken } from "../middleware/authenticate.js";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });

  const exists = await User.findOne({ where: { username } });
  if (exists) return res.status(409).json({ error: "Username already taken" });

  const user = User.build({ username });
  await user.setPassword(password);
  await user.save();

  await Token.destroy({ where: { userId: user.id } });
  const tokenValue = crypto.randomBytes(32).toString("hex");
  await Token.create({ value: tokenValue, userId: user.id });

  res.json({ token: tokenValue });
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user || !(await user.validatePassword(password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  await Token.destroy({ where: { userId: user.id } });
  const tokenValue = crypto.randomBytes(32).toString("hex");
  await Token.create({ value: tokenValue, userId: user.id });

  res.json({ token: tokenValue });
});

authRouter.get("/validate", authenticateToken, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});
