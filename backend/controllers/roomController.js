const Room = require("../models/Room");
const Block = require("../models/Block");

exports.createRoom = async (req, res) => {
  try {
    let { roomNumber, department, programme, block } = req.body;

    if (!roomNumber) {
      return res.status(400).json({ message: "Room number is required" });
    }

    if (block && (!programme || !department)) {
      const blockDoc = await Block.findById(block);
      if (blockDoc) {
        if (!programme) programme = blockDoc.programme;
        if (!department) department = blockDoc.department;
      }
    }

    const room = new Room({
      roomNumber,
      department,
      programme,
      block,
    });

    await room.save();
    res.status(201).json({ message: "Room created successfully", room });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Room number already exists in this block" });
    }
    res
      .status(500)
      .json({ message: "Failed to create room", error: error.message });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const { departmentId, programmeId, blockId } = req.query;
    const query = {};
    if (departmentId) query.department = departmentId;
    if (programmeId) query.programme = programmeId;
    if (blockId) query.block = blockId;

    const rooms = await Room.find(query)
      .populate("department")
      .populate("programme")
      .populate("block");
    res.json(rooms);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch rooms", error: error.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("department")
      .populate("programme")
      .populate("block");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch room", error: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    let { roomNumber, department, programme, block } = req.body;

    if (block && (!programme || !department)) {
      const blockDoc = await Block.findById(block);
      if (blockDoc) {
        if (!programme) programme = blockDoc.programme;
        if (!department) department = blockDoc.department;
      }
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { roomNumber, department, programme, block },
      { new: true, runValidators: true },
    );
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json({ message: "Room updated successfully", room });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Room number already exists in this block" });
    }
    res
      .status(500)
      .json({ message: "Failed to update room", error: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete room", error: error.message });
  }
};
