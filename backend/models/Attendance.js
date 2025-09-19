import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent", "late", "excused"],
    required: true,
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },
});

const attendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    session: {
      type: String,
      required: [true, "Session is required"],
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
    },
    records: [attendanceRecordSchema],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor is required"],
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    presentCount: {
      type: Number,
      default: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    lateCount: {
      type: Number,
      default: 0,
    },
    excusedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one attendance record per course per date per session
attendanceSchema.index({ course: 1, date: 1, session: 1 }, { unique: true });
attendanceSchema.index({ instructor: 1, date: 1 });
attendanceSchema.index({ "records.student": 1 });

// Virtual for attendance percentage
attendanceSchema.virtual("attendancePercentage").get(function () {
  if (this.totalStudents === 0) return 0;
  return Math.round((this.presentCount / this.totalStudents) * 100);
});

// Pre-save middleware to calculate counts
attendanceSchema.pre("save", function (next) {
  this.totalStudents = this.records.length;
  this.presentCount = this.records.filter((r) => r.status === "present").length;
  this.absentCount = this.records.filter((r) => r.status === "absent").length;
  this.lateCount = this.records.filter((r) => r.status === "late").length;
  this.excusedCount = this.records.filter((r) => r.status === "excused").length;
  next();
});

// Method to mark attendance for a student
attendanceSchema.methods.markStudentAttendance = function (
  studentId,
  status,
  markedBy,
  notes = ""
) {
  const existingRecord = this.records.find(
    (r) => r.student.toString() === studentId.toString()
  );

  if (existingRecord) {
    existingRecord.status = status;
    existingRecord.markedAt = new Date();
    existingRecord.markedBy = markedBy;
    existingRecord.notes = notes;
  } else {
    this.records.push({
      student: studentId,
      status,
      markedBy,
      notes,
    });
  }

  return this.save();
};

// Method to bulk mark attendance
attendanceSchema.methods.bulkMarkAttendance = function (
  attendanceData,
  markedBy
) {
  attendanceData.forEach(({ studentId, status, notes }) => {
    const existingRecord = this.records.find(
      (r) => r.student.toString() === studentId.toString()
    );

    if (existingRecord) {
      existingRecord.status = status;
      existingRecord.markedAt = new Date();
      existingRecord.markedBy = markedBy;
      existingRecord.notes = notes || "";
    } else {
      this.records.push({
        student: studentId,
        status,
        markedBy,
        notes: notes || "",
      });
    }
  });

  return this.save();
};

// Method to get student attendance status
attendanceSchema.methods.getStudentStatus = function (studentId) {
  const record = this.records.find(
    (r) => r.student.toString() === studentId.toString()
  );
  return record ? record.status : null;
};

// Static method to get student attendance summary for a course
attendanceSchema.statics.getStudentAttendanceSummary = async function (
  studentId,
  courseId
) {
  const attendanceRecords = await this.find({
    course: courseId,
    "records.student": studentId,
  }).sort({ date: 1 });

  let totalClasses = 0;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  attendanceRecords.forEach((attendance) => {
    const studentRecord = attendance.records.find(
      (r) => r.student.toString() === studentId.toString()
    );

    if (studentRecord) {
      totalClasses++;
      switch (studentRecord.status) {
        case "present":
          presentCount++;
          break;
        case "absent":
          absentCount++;
          break;
        case "late":
          lateCount++;
          break;
        case "excused":
          excusedCount++;
          break;
      }
    }
  });

  const attendancePercentage =
    totalClasses > 0
      ? Math.round(((presentCount + lateCount) / totalClasses) * 100)
      : 0;

  return {
    totalClasses,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendancePercentage,
    records: attendanceRecords,
  };
};

// Static method to get course attendance overview
attendanceSchema.statics.getCourseAttendanceOverview = async function (
  courseId,
  startDate,
  endDate
) {
  const match = { course: courseId };

  if (startDate && endDate) {
    match.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const attendanceRecords = await this.find(match)
    .populate("course", "name code")
    .sort({ date: -1 });

  const summary = {
    totalSessions: attendanceRecords.length,
    averageAttendance: 0,
    totalStudents: 0,
    records: attendanceRecords,
  };

  if (attendanceRecords.length > 0) {
    const totalPercentage = attendanceRecords.reduce(
      (sum, record) => sum + record.attendancePercentage,
      0
    );
    summary.averageAttendance = Math.round(
      totalPercentage / attendanceRecords.length
    );
    summary.totalStudents = Math.max(
      ...attendanceRecords.map((r) => r.totalStudents)
    );
  }

  return summary;
};

export default mongoose.model("Attendance", attendanceSchema);
