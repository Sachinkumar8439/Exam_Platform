const Chapter = require("../models/chapter");
const Subject = require("../models/subject");

/**
 * ➕ Create Chapter
 * POST /api/chapters
 */
exports.createChapter = async (req, res) => {
  try {
    const { name, subjectId } = req.body;

    if (!name || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Chapter name and subjectId are required"
      });
    }

    // check subject exists
    const subjectExists = await Subject.findById(subjectId);
    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    // prevent duplicate chapter under same subject
    const duplicate = await Chapter.findOne({
      name,
      subject: subjectId
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Chapter already exists for this subject"
      });
    }

    const chapter = await Chapter.create({
      name,
      subject: subjectId
    });

    res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      data: chapter
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * ➕➕ Bulk Create Chapters
 * POST /api/chapters/bulk
 */
exports.bulkCreateChapters = async (req, res) => {
  try {
    const { subjectId, chapters } = req.body;

    if (!subjectId || !Array.isArray(chapters) || chapters.length === 0) {
      return res.status(400).json({
        success: false,
        message: "subjectId and chapters array are required"
      });
    }

    // check subject exists
    const subjectExists = await Subject.findById(subjectId);
    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    const normalizedChapters = chapters
      .map(name => name?.trim())
      .filter(Boolean);

    // find existing chapters
    const existingChapters = await Chapter.find({
      subject: subjectId,
      name: { $in: normalizedChapters }
    });

    const existingNames = existingChapters.map(c => c.name);

    // filter new chapters only
    const chaptersToInsert = normalizedChapters
      .filter(name => !existingNames.includes(name))
      .map(name => ({
        name,
        subject: subjectId
      }));

    if (chaptersToInsert.length === 0) {
      return res.status(409).json({
        success: false,
        message: "All chapters already exist"
      });
    }

    const insertedChapters = await Chapter.insertMany(chaptersToInsert);

    res.status(201).json({
      success: true,
      message: "Chapters added successfully",
      addedCount: insertedChapters.length,
      skippedCount: existingNames.length,
      skippedChapters: existingNames,
      data: insertedChapters
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bulk insert failed",
      error: error.message
    });
  }
};

/**
 * 📥 Get All Chapters (filter by subject)
 * GET /api/chapters?subjectId=
 */
exports.getAllChapters = async (req, res) => {
  try {
    const { subjectId } = req.query;

    const filter = {};
    if (subjectId) filter.subject = subjectId;

    const chapters = await Chapter.find(filter)
      .populate({
        path: "subject",
        select: "name",
        populate: {
          path: "exam",
          select: "name"
        }
      });

    res.status(200).json({
      success: true,
      total: chapters.length,
      data: chapters
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * 📥 Get Single Chapter by ID
 * GET /api/chapters/:id
 */
exports.getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate({
        path: "subject",
        select: "name",
        populate: {
          path: "exam",
          select: "name"
        }
      });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found"
      });
    }

    res.status(200).json({
      success: true,
      data: chapter
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Invalid chapter ID",
      error: error.message
    });
  }
};

/**
 * ✏️ Update Chapter
 * PUT /api/chapters/:id
 */
exports.updateChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Chapter updated successfully",
      data: chapter
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message
    });
  }
};

/**
 * ❌ Delete Chapter
 * DELETE /api/chapters/:id
 */
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Chapter deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message
    });
  }
};
