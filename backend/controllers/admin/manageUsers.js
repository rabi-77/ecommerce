import userModel from "../../models/userModel.js";

const getUsers = async (req, res) => {
  const { page = 1, size = 10, search = "" } = req.query;
  const query = {
    role: "user",
    $or: [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ],
  };
try{
  const total = await userModel.countDocuments(query);
  const users = await userModel
    .find(query)
    .select("username email isBlocked createdAt ")
    .sort({ createdAt: -1 })
    .skip((page - 1) * size)
    .limit(Number(size));

    res.json({total, users, page: Number(page), size: Number(size)})
}catch(err){
    console.error('Error fetching users:', err.message);
    res.status(500).json({message: "Internal server error: " + err.message})
}
};

const blockUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userModel.findByIdAndUpdate(
      id,
      { isBlocked: true },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User blocked successfully", user });
  } catch (err) {

   console.log(err.message); 
    res.status(500).json({ message: "Internal server error" });
  }
};

const unblockUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userModel.findByIdAndUpdate(
      id,
      { isBlocked: false },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User unblocked successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const toggleUserBlock = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Toggle the isBlocked status
    user.isBlocked = !user.isBlocked;
    await user.save();
    
    const statusMessage = user.isBlocked ? "blocked" : "unblocked";
    res.json({ 
      message: `User ${statusMessage} successfully`, 
      user 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export {getUsers,blockUser,unblockUser,toggleUserBlock}