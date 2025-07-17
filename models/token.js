import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { User } from "./user.js";

export const Token = sequelize.define("Token", {
  value: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

Token.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(Token, { foreignKey: "userId", onDelete: "CASCADE" });
