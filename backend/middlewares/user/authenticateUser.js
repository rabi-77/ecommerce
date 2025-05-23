import jwt from "jsonwebtoken";
import userModel from "../../models/userModel.js";


// authentication
export const authenticateUser = async (req, res, next) => {
    console.log(req.headers);

  const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log(token,'auth');

  if (!token) {
    return res
      .status(401)
      .json({ message: "Token not found, authorization failed" });
  }
  try {
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(verify.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error.message, "in the user authentication");
    res.status(500).json({ message: "failed to authenticate" });
  }
};

//authorization
export const userAuthorization = async (req, res, next) => {
  if (!req.user) {
    return res
      .status(403)
      .json({ message: "you are not authorized to be here" });
  }
  next();
};
