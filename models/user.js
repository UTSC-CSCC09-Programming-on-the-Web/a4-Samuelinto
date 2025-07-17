import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";

export const User = sequelize.define("User", {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
});

User.prototype.setPassword = async function (plaintext) {
  this.passwordHash = await bcrypt.hash(plaintext, 10);
};

User.prototype.validatePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};
