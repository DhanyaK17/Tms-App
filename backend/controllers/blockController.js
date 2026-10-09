const Block = require("../models/Block");

exports.createBlock = async (req, res) => {
  try {
    const { name, department, programme } = req.body;

    const block = new Block({
      name,
      department,
      programme,
    });

    await block.save();
    res.status(201).json({ message: "Block created successfully", block });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Block with this name already exists" });
    }
    res
      .status(500)
      .json({ message: "Failed to create block", error: error.message });
  }
};

exports.getBlocks = async (req, res) => {
  try {
    const { departmentId, programmeId } = req.query;
    const query = {};
    if (departmentId) query.department = departmentId;
    if (programmeId) query.programme = programmeId;

    const blocks = await Block.find(query)
      .populate("department")
      .populate("programme");
    res.json(blocks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch blocks", error: error.message });
  }
};

exports.getBlockById = async (req, res) => {
  try {
    const block = await Block.findById(req.params.id)
      .populate("department")
      .populate("programme");
    if (!block) {
      return res.status(404).json({ message: "Block not found" });
    }
    res.json(block);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch block", error: error.message });
  }
};

exports.updateBlock = async (req, res) => {
  try {
    const { name, department, programme } = req.body;
    const block = await Block.findByIdAndUpdate(
      req.params.id,
      { name, department, programme },
      { new: true, runValidators: true },
    );
    if (!block) {
      return res.status(404).json({ message: "Block not found" });
    }
    res.json({ message: "Block updated successfully", block });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Block with this name already exists" });
    }
    res
      .status(500)
      .json({ message: "Failed to update block", error: error.message });
  }
};

exports.deleteBlock = async (req, res) => {
  try {
    const block = await Block.findByIdAndDelete(req.params.id);
    if (!block) {
      return res.status(404).json({ message: "Block not found" });
    }
    res.json({ message: "Block deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete block", error: error.message });
  }
};
