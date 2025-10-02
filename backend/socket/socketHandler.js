import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Message from "../models/Message.js";

// Socket authentication middleware
export const authenticateSocket = async (socket, next) => {
  try {
    console.log("🔐 Authenticating socket connection...");
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log("❌ No token provided");
      return next(new Error("Authentication error: No token provided"));
    }

    console.log("🔍 Token preview:", token.substring(0, 50) + "...");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded successfully, payload:", decoded);
    
    // The auth middleware uses 'id' field, not 'userId'
    const userId = decoded.id || decoded.userId;
    console.log("🔍 Using userId:", userId);

    const user = await User.findById(userId);

    if (!user) {
      console.log("❌ User not found for token, userId:", userId);
      console.log("💡 This usually means the token is old or the user was deleted");
      return next(new Error("Authentication error: User not found - please login again"));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.userEmail = user.email;
    socket.userProfile = user.profile;

    console.log(
      `✅ Socket authenticated for user: ${user.email} (${user.role})`
    );
    next();
  } catch (error) {
    console.log("❌ Socket authentication error:", error.message);
    if (error.name === 'TokenExpiredError') {
      return next(new Error("Authentication error: Token expired - please login again"));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new Error("Authentication error: Invalid token - please login again"));
    }
    next(new Error("Authentication error: " + error.message));
  }
};

// Socket event handlers
export const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userEmail} (${socket.userRole})`);

    // Join course room
    socket.on("join-course", async (courseId) => {
      try {
        console.log(
          `📚 User ${socket.userEmail} attempting to join course ${courseId}`
        );

        const course = await Course.findById(courseId);
        if (!course) {
          console.log(`❌ Course ${courseId} not found`);
          socket.emit("error", { message: "Course not found" });
          return;
        }

        // Check if user has access to this course
        const isInstructor = course.instructor.toString() === socket.userId;
        const isEnrolled = course.isStudentEnrolled(socket.userId);
        const isAdmin = socket.userRole === "admin";

        console.log(
          `🔍 Access check - Instructor: ${isInstructor}, Enrolled: ${isEnrolled}, Admin: ${isAdmin}`
        );

        if (!isInstructor && !isEnrolled && !isAdmin) {
          console.log(
            `❌ Access denied for user ${socket.userEmail} to course ${courseId}`
          );
          socket.emit("error", { message: "Access denied to this course" });
          return;
        }

        socket.join(`course-${courseId}`);
        socket.currentCourse = courseId;

        console.log(`📨 Loading recent messages for course ${courseId}`);

        // Send recent messages
        const recentMessages = await Message.find({ course: courseId })
          .populate("sender", "profile.firstName profile.lastName email role")
          .sort({ createdAt: -1 })
          .limit(50);

        console.log(`📨 Found ${recentMessages.length} recent messages`);
        socket.emit("recent-messages", recentMessages.reverse());

        // Notify others that user joined
        socket.to(`course-${courseId}`).emit("user-joined", {
          userId: socket.userId,
          userEmail: socket.userEmail,
          userRole: socket.userRole,
          userName:
            `${socket.userProfile?.firstName || ""} ${
              socket.userProfile?.lastName || ""
            }`.trim() || socket.userEmail,
        });

        console.log(`User ${socket.userEmail} joined course ${courseId}`);
      } catch (error) {
        console.error("Error joining course:", error);
        socket.emit("error", { message: "Failed to join course" });
      }
    });

    // Leave course room
    socket.on("leave-course", (courseId) => {
      socket.leave(`course-${courseId}`);
      socket.to(`course-${courseId}`).emit("user-left", {
        userId: socket.userId,
        userEmail: socket.userEmail,
        userRole: socket.userRole,
      });
      socket.currentCourse = null;
      console.log(`User ${socket.userEmail} left course ${courseId}`);
    });

    // Handle new message
    socket.on("send-message", async (data) => {
      try {
        const { courseId, content, type = "text" } = data;

        if (!courseId || !content) {
          socket.emit("error", {
            message: "Course ID and content are required",
          });
          return;
        }

        // Verify user has access to course
        const course = await Course.findById(courseId);
        if (!course) {
          socket.emit("error", { message: "Course not found" });
          return;
        }

        const isInstructor = course.instructor.toString() === socket.userId;
        const isEnrolled = course.isStudentEnrolled(socket.userId);
        const isAdmin = socket.userRole === "admin";

        if (!isInstructor && !isEnrolled && !isAdmin) {
          socket.emit("error", { message: "Access denied to this course" });
          return;
        }

        // Create message
        const message = new Message({
          course: courseId,
          sender: socket.userId,
          content: content.trim(),
          type,
          timestamp: new Date(),
        });

        await message.save();

        // Populate sender info
        await message.populate(
          "sender",
          "profile.firstName profile.lastName email role"
        );

        // Broadcast message to all users in the course
        io.to(`course-${courseId}`).emit("new-message", {
          _id: message._id,
          course: message.course,
          sender: {
            _id: message.sender._id,
            email: message.sender.email,
            role: message.sender.role,
            profile: message.sender.profile,
          },
          content: message.content,
          type: message.type,
          timestamp: message.timestamp,
          createdAt: message.createdAt,
        });

        console.log(
          `Message sent in course ${courseId} by ${socket.userEmail}`
        );
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing-start", (courseId) => {
      socket.to(`course-${courseId}`).emit("user-typing", {
        userId: socket.userId,
        userEmail: socket.userEmail,
        userName:
          `${socket.userProfile?.firstName || ""} ${
            socket.userProfile?.lastName || ""
          }`.trim() || socket.userEmail,
      });
    });

    socket.on("typing-stop", (courseId) => {
      socket.to(`course-${courseId}`).emit("user-stopped-typing", {
        userId: socket.userId,
      });
    });

    // Handle message reactions
    socket.on("react-to-message", async (data) => {
      try {
        const { messageId, reaction } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Check if user has access to the course
        const course = await Course.findById(message.course);
        const isInstructor = course.instructor.toString() === socket.userId;
        const isEnrolled = course.isStudentEnrolled(socket.userId);
        const isAdmin = socket.userRole === "admin";

        if (!isInstructor && !isEnrolled && !isAdmin) {
          socket.emit("error", { message: "Access denied" });
          return;
        }

        // Add or update reaction
        const existingReaction = message.reactions.find(
          (r) => r.user.toString() === socket.userId
        );

        if (existingReaction) {
          if (existingReaction.type === reaction) {
            // Remove reaction if same type
            message.reactions = message.reactions.filter(
              (r) => r.user.toString() !== socket.userId
            );
          } else {
            // Update reaction type
            existingReaction.type = reaction;
          }
        } else {
          // Add new reaction
          message.reactions.push({
            user: socket.userId,
            type: reaction,
          });
        }

        await message.save();

        // Broadcast reaction update
        io.to(`course-${message.course}`).emit("message-reaction-updated", {
          messageId: message._id,
          reactions: message.reactions,
        });
      } catch (error) {
        console.error("Error handling reaction:", error);
        socket.emit("error", { message: "Failed to react to message" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      if (socket.currentCourse) {
        socket.to(`course-${socket.currentCourse}`).emit("user-left", {
          userId: socket.userId,
          userEmail: socket.userEmail,
          userRole: socket.userRole,
        });
      }
      console.log(`User disconnected: ${socket.userEmail}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
};

export default { authenticateSocket, handleSocketConnection };
