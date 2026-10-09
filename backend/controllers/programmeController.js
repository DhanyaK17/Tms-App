const Programme = require("../models/Programme");

exports.createProgramme = async (req, res) => {
  try {
    const { name, shortName, department } = req.body;

    const programme = new Programme({
      name,
      shortName,
      department,
    });

    await programme.save();
    res
      .status(201)
      .json({ message: "Programme created successfully", programme });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Programme with this name already exists" });
    }
    res
      .status(500)
      .json({ message: "Failed to create programme", error: error.message });
  }
};

exports.getProgrammes = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const query = {};
    if (departmentId) {
      query.department = departmentId;
    }
    const programmes = await Programme.find(query).populate("department");
    res.json(programmes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch programmes", error: error.message });
  }
};

exports.getProgrammeById = async (req, res) => {
  try {
    const programme = await Programme.findById(req.params.id).populate(
      "department",
    );
    if (!programme) {
      return res.status(404).json({ message: "Programme not found" });
    }
    res.json(programme);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch programme", error: error.message });
  }
};

exports.updateProgramme = async (req, res) => {
  try {
    const { name, shortName, department } = req.body;
    const programme = await Programme.findByIdAndUpdate(
      req.params.id,
      { name, shortName, department },
      { new: true, runValidators: true },
    );
    if (!programme) {
      return res.status(404).json({ message: "Programme not found" });
    }
    res.json({ message: "Programme updated successfully", programme });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Programme with this name already exists" });
    }
    res
      .status(500)
      .json({ message: "Failed to update programme", error: error.message });
  }
};

exports.deleteProgramme = async (req, res) => {
  try {
    const programme = await Programme.findByIdAndDelete(req.params.id);
    if (!programme) {
      return res.status(404).json({ message: "Programme not found" });
    }
    res.json({ message: "Programme deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete programme", error: error.message });
  }
};
