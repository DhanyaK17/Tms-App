const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.createUser = async (req, res) => {
  try {
    const { username, email, phone, password, role, department, programme } =
      req.body;

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanUsername = username ? username.trim() : '';

    const existingUser = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { username: cleanUsername },
      ],
    });
    if (existingUser) {
      return res.status(400).json({ message: "User with this username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      phone,
      password: hashedPassword,
      role,
      department: department || undefined,
      programme: programme || undefined,
    });

    await user.save();
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username or email already in use" });
    }
    res
      .status(500)
      .json({ message: "Failed to create user", error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role, department } = req.query;
    const query = {};
    if (role) query.role = role;
    if (department) query.department = department;

    const users = await User.find(query)
      .select("-password")
      .populate("department")
      .populate("programme");
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("department")
      .populate("programme");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch user", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { username, email, phone, password, role, department, programme } = req.body;
    const updateData = {};
    if (username !== undefined) updateData.username = username.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department || null;
    if (programme !== undefined) updateData.programme = programme || null;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username or email already in use" });
    }
    res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete user", error: error.message });
  }
};

// Register/save device push token for the authenticated user
exports.savePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Push token is required" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { pushTokens: token },
    });

    res.json({ message: "Push token registered successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to save push token", error: error.message });
  }
};

// Remove device push token on logout
exports.removePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Push token is required" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { pushTokens: token },
    });

    res.json({ message: "Push token removed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to remove push token", error: error.message });
  }
};

