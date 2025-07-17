import { Token } from "../models/token.js";
import { User } from "../models/user.js";

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const tokenValue = authHeader.split(" ")[1];
  const token = await Token.findOne({
    where: { value: tokenValue },
    include: User,
  });
  if (!token) return res.status(403).json({ error: "Invalid token" });

  req.user = token.User;
  next();
}

export async function authenticateTokenOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const tokenValue = authHeader.split(" ")[1];
    const token = await Token.findOne({
      where: { value: tokenValue },
      include: User,
    });

    if (token && token.User) {
      req.user = token.User;
    }
  }
  next();
}
