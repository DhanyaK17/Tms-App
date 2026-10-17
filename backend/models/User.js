const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      default: "User",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    programme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
    },
    preferences: {
      emailNotifs: { type: Boolean, default: true },
      smsNotifs: { type: Boolean, default: false },
      darkMode: { type: Boolean, default: true },
    },
    notifications: {
      ticketUpdates: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: false },
    },
    pushTokens: [{ type: String }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
