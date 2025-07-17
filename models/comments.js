import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Image } from "./image.js";

export const Comment = sequelize.define("Comment", {
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

Comment.belongsTo(Image, { foreignKey: "imageId", onDelete: "CASCADE" });
Image.hasMany(Comment, { foreignKey: "imageId", onDelete: "CASCADE" });
