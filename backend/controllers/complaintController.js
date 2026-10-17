const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const {
  notifyComplaintRegistered,
  notifyComplaintAssigned,
  notifyComplaintStatusChanged,
} = require("../services/notificationService");

exports.deleteComplaint = async (req, res) => {
  try {
    const requester = req.user;
    if (requester.role !== "SuperAdmin") {
      return res
        .status(403)
        .json({ message: "Only SuperAdmin can delete complaints" });
    }
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    res.json({ message: "Complaint deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete complaint", error: error.message });
  }
};

exports.createComplaint = async (req, res) => {
  try {
    const {
      blockName,
      roomNumber,
      complaintType,
      remarks,
      userId,
      departmentName,
      programmeName,
    } = req.body;

    if (!blockName || !roomNumber || !complaintType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Only SuperAdmin and regular Users can create complaints
    const requester = req.user || {};
    if (requester.role && !["SuperAdmin", "User"].includes(requester.role)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to create complaints" });
    }

    const complaint = new Complaint({
      departmentName,
      programmeName,
      blockName,
      roomNumber,
      complaintType,
      remarks,
      createdBy: req.user?.id || userId,
    });

    if (req.file) {
      complaint.attachment = `/uploads/${req.file.filename}`;
    }

    await complaint.save();

    // Trigger push notification and real-time socket event
    notifyComplaintRegistered(complaint);
    if (req.io) {
      req.io.emit("complaint_created", complaint);
      req.io.to(`user_${complaint.createdBy}`).emit("complaint_created", complaint);
    }

    res.status(201).json({ message: "Complaint created", complaint });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create complaint", error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    // SuperAdmin: global stats
    if (requester.role === "SuperAdmin") {
      const all = await Complaint.find();
      const total = all.length;
      const pending = all.filter((c) => c.status === "Pending" || c.status === "Onhold").length;
      const assigned = all.filter((c) => c.status === "Assigned").length;
      const inProgress = all.filter((c) => c.status === "In-Progress").length;
      const closed = all.filter((c) => c.status === "Completed").length;
      return res.json({ total, pending, assigned, inProgress, closed });
    }

    // Staff/Technician: stats for complaints assigned to them or their department
    if (!["SuperAdmin", "User"].includes(requester.role)) {
      let filter = { assignedTo: requester.id };

      // If staff has a department assigned, also get complaints for all staff in that dept
      if (requester.department) {
        const sameDeptStaff = await User.find({
          department: requester.department,
        }).select("_id");
        const staffIds = sameDeptStaff.map((u) => u._id);
        filter = {
          $or: [{ assignedTo: { $in: staffIds } }, { createdBy: requester.id }],
        };
      } else {
        // Fallback: if no department, just show assigned to this user
        filter = { assignedTo: requester.id };
      }

      const assignedList = await Complaint.find(filter);
      const total = assignedList.length;
      const pending = assignedList.filter((c) => c.status === "Pending" || c.status === "Onhold").length;
      const assigned = assignedList.filter((c) => c.status === "Assigned").length;
      const inProgress = assignedList.filter((c) => c.status === "In-Progress").length;
      const closed = assignedList.filter((c) => c.status === "Completed").length;
      return res.json({ total, pending, assigned, inProgress, closed });
    }

    // Regular User: stats for complaints created by them
    const myList = await Complaint.find({ createdBy: requester.id });
    const total = myList.length;
    const pending = myList.filter((c) => c.status === "Pending" || c.status === "Onhold").length;
    const assigned = myList.filter((c) => c.status === "Assigned").length;
    const inProgress = myList.filter((c) => c.status === "In-Progress").length;
    const closed = myList.filter((c) => c.status === "Completed").length;
    res.json({ total, pending, assigned, inProgress, closed });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: error.message });
  }
};

exports.listComplaints = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    // SuperAdmin: all complaints
    if (requester.role === "SuperAdmin") {
      const complaints = await Complaint.find()
        .populate({
          path: "createdBy",
          select: "username email department",
          populate: { path: "department", select: "name" },
        })
        .populate({
          path: "assignedTo",
          select: "username email role department",
          populate: { path: "department", select: "name" },
        })
        .sort({ createdAt: -1 });
      return res.json(complaints);
    }

    // Staff/Technician: complaints assigned to them or their department
    if (!["SuperAdmin", "User"].includes(requester.role)) {
      let filter = { assignedTo: requester.id };

      // If staff has a department assigned, also get complaints for all staff in that dept
      if (requester.department) {
        const sameDeptStaff = await User.find({
          department: requester.department,
        }).select("_id");
        const staffIds = sameDeptStaff.map((u) => u._id);
        filter = {
          $or: [{ assignedTo: { $in: staffIds } }, { createdBy: requester.id }],
        };
      }

      const complaints = await Complaint.find(filter)
        .populate({
          path: "createdBy",
          select: "username email department",
          populate: { path: "department", select: "name" },
        })
        .populate({
          path: "assignedTo",
          select: "username email role department",
          populate: { path: "department", select: "name" },
        })
        .sort({ createdAt: -1 });
      return res.json(complaints);
    }

    // Regular User: complaints raised by them
    const complaints = await Complaint.find({ createdBy: requester.id })
      .populate({
        path: "createdBy",
        select: "username email department",
        populate: { path: "department", select: "name" },
      })
      .populate({
        path: "assignedTo",
        select: "username email role department",
        populate: { path: "department", select: "name" },
      })
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to list complaints", error: error.message });
  }
};

// SuperAdmin assigns complaint to a staff user
exports.assignComplaint = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester || requester.role !== "SuperAdmin") {
      return res
        .status(403)
        .json({ message: "Only SuperAdmin can assign complaints" });
    }

    const complaintId = req.params.id;
    const { assignedTo } = req.body; // user id
    if (!assignedTo)
      return res.status(400).json({ message: "assignedTo is required" });

    const assignee = await User.findById(assignedTo);
    if (!assignee)
      return res.status(404).json({ message: "Assignee not found" });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });

    const previousAssignee = complaint.assignedTo ? String(complaint.assignedTo) : null;
    const isAlreadyAssignedToSame = previousAssignee === String(assignee._id);

    complaint.assignedTo = assignee._id;
    complaint.status = "Assigned";
    await complaint.save();

    const updated = await Complaint.findById(complaintId)
      .populate({
        path: "createdBy",
        select: "username email department",
        populate: { path: "department", select: "name" },
      })
      .populate({
        path: "assignedTo",
        select: "username email role department",
        populate: { path: "department", select: "name" },
      });

    // Notify only if not already assigned to the same user
    if (!isAlreadyAssignedToSame) {
      notifyComplaintAssigned(updated, assignee);
    }

    // Real-time broadcast
    if (req.io) {
      req.io.to(`complaint_${complaintId}`).emit("complaint_updated", updated);
      req.io.emit("complaint_updated", updated);
      req.io.to(`user_${updated.createdBy?._id}`).emit("complaint_status_changed", {
        complaintId,
        status: "Assigned",
        complaint: updated,
      });
      req.io.to(`user_${assignee._id}`).emit("complaint_assigned", updated);
    }

    res.json({ message: "Assigned successfully", complaint: updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to assign complaint", error: error.message });
  }
};

// Assigned staff (or SuperAdmin) can update status
exports.updateStatus = async (req, res) => {
  try {
    const requester = req.user;
    const complaintId = req.params.id;
    let { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });

    const allowedStatuses = [
      "Pending",
      "Assigned",
      "In-Progress",
      "Onhold",
      "Completed",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const complaint = await Complaint.findById(complaintId)
      .populate("assignedTo", "_id")
      .populate("createdBy", "_id");
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });

    // Prevent duplicate processing if status is identical
    if (complaint.status === status) {
      const currentDoc = await Complaint.findById(complaintId)
        .populate({
          path: "createdBy",
          select: "username email department",
          populate: { path: "department", select: "name" },
        })
        .populate({
          path: "assignedTo",
          select: "username email role department",
          populate: { path: "department", select: "name" },
        });
      return res.json({ message: "Status unchanged", complaint: currentDoc });
    }

    // If requester is SuperAdmin, allow any change
    if (requester.role !== "SuperAdmin") {
      // Staff/Technician: must be assignedTo and can set limited statuses
      const isAssignee =
        complaint.assignedTo &&
        String(complaint.assignedTo._id) === String(requester.id);

      if (!isAssignee) {
        return res.status(403).json({
          message: "Only assigned staff can update status",
        });
      }

      const staffAllowed = ["In-Progress", "Onhold", "Completed"];
      if (!staffAllowed.includes(status)) {
        return res
          .status(403)
          .json({ message: "Assigned staff cannot set this status" });
      }
    }

    const previousStatus = complaint.status;
    complaint.status = status;
    await complaint.save();

    const updated = await Complaint.findById(complaintId)
      .populate({
        path: "createdBy",
        select: "username email department",
        populate: { path: "department", select: "name" },
      })
      .populate({
        path: "assignedTo",
        select: "username email role department",
        populate: { path: "department", select: "name" },
      });

    // Notify creator and interested parties
    notifyComplaintStatusChanged(updated, status, previousStatus);

    // Broadcast live event
    if (req.io) {
      req.io.to(`complaint_${complaintId}`).emit("complaint_updated", updated);
      req.io.emit("complaint_updated", updated);
      req.io.to(`user_${updated.createdBy?._id}`).emit("complaint_status_changed", {
        complaintId,
        status,
        complaint: updated,
      });
    }

    res.json({ message: "Status updated", complaint: updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update status", error: error.message });
  }
};

// SuperAdmin: generate filtered reports
exports.generateReport = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester || requester.role !== "SuperAdmin")
      return res
        .status(403)
        .json({ message: "Only SuperAdmin can generate reports" });

    const { department, programme, complaintType, status, assignee } =
      req.query;

    const filter = {};
    if (complaintType)
      filter.complaintType = { $regex: complaintType.trim(), $options: "i" };
    if (status) filter.status = status;
    if (assignee && mongoose.Types.ObjectId.isValid(assignee)) {
      filter.assignedTo = assignee;
    }

    // If department or programme are provided, resolve their names and filter by name
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        const deptDoc = await require("../models/Department").findById(department);
        if (deptDoc) {
          filter.departmentName = deptDoc.name;
        }
      } else {
        filter.departmentName = department;
      }
    }
    if (programme) {
      if (mongoose.Types.ObjectId.isValid(programme)) {
        const progDoc = await require("../models/Programme").findById(programme);
        if (progDoc) {
          filter.programmeName = progDoc.name;
        }
      } else {
        filter.programmeName = programme;
      }
    }

    const complaints = await Complaint.find(filter)
      .populate({
        path: "createdBy",
        select: "username email department programme",
        populate: [
          { path: "department", select: "name" },
          { path: "programme", select: "name" },
        ],
      })
      .populate({ path: "assignedTo", select: "username email role" })
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to generate report", error: error.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    const complaint = await Complaint.findById(id)
      .populate({
        path: "createdBy",
        select: "username email department phone",
        populate: { path: "department", select: "name" },
      })
      .populate({
        path: "assignedTo",
        select: "username email role department phone",
        populate: { path: "department", select: "name" },
      });
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Permission enforcement
    const requester = req.user;
    if (requester) {
      if (requester.role === "User") {
        const creatorId = String(complaint.createdBy?._id || complaint.createdBy);
        if (creatorId !== String(requester.id)) {
          return res.status(403).json({ message: "Access denied: You can only view your own complaints" });
        }
      } else if (requester.role !== "SuperAdmin") {
        const isCreator = String(complaint.createdBy?._id || complaint.createdBy) === String(requester.id);
        const isAssignee = complaint.assignedTo && String(complaint.assignedTo?._id || complaint.assignedTo) === String(requester.id);
        const isSameDept = requester.department && complaint.assignedTo?.department && String(complaint.assignedTo.department?._id || complaint.assignedTo.department) === String(requester.department);
        if (!isCreator && !isAssignee && !isSameDept) {
          return res.status(403).json({ message: "Access denied: Unauthorized to view this complaint" });
        }
      }
    }

    res.json(complaint);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch complaint", error: error.message });
  }
};
