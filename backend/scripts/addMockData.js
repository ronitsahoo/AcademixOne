import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Attendance from '../models/Attendance.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academixone';

async function addMockData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Assignment.deleteMany({});
    await Attendance.deleteMany({});

    // Create teacher
    const hashedPassword = await bcrypt.hash('password123', 10);
    const teacher = await User.create({
      email: 'teacher@example.com',
      password: hashedPassword,
      role: 'teacher',
      profile: {
        firstName: 'John',
        lastName: 'Smith',
        phoneNumber: '+1234567890',
        dateOfBirth: new Date('1985-05-15'),
        address: '123 Teacher St, Education City'
      },
      isActive: true
    });

    // Create students
    const students = [];
    for (let i = 1; i <= 5; i++) {
      const student = await User.create({
        email: `student${i}@example.com`,
        password: hashedPassword,
        role: 'student',
        profile: {
          firstName: `Student${i}`,
          lastName: 'Doe',
          phoneNumber: `+123456789${i}`,
          dateOfBirth: new Date(`200${i}-0${i}-1${i}`),
          address: `${i}23 Student St, Learning City`
        },
        isActive: true
      });
      students.push(student);
    }

    // Create course
    const course = await Course.create({
      name: 'Introduction to Computer Science',
      code: 'CS101',
      description: 'A comprehensive introduction to computer science fundamentals',
      department: 'Computer Science',
      semester: 'Fall 2024',
      credits: 3,
      instructor: teacher._id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-05-15'),
      enrolledStudents: students.map(s => s._id),
      maxStudents: 30,
      modules: [
        {
          title: 'Programming Basics',
          description: 'Introduction to programming concepts',
          status: 'completed',
          order: 1,
          content: [
            {
              type: 'video',
              title: 'Variables and Data Types',
              url: 'https://example.com/video1',
              duration: 45,
              isCompleted: true
            }
          ]
        },
        {
          title: 'Data Structures',
          description: 'Arrays, Lists, and basic data structures',
          status: 'in_progress',
          order: 2,
          content: [
            {
              type: 'reading',
              title: 'Array Operations',
              url: 'https://example.com/reading1',
              duration: 30,
              isCompleted: false
            }
          ]
        },
        {
          title: 'Algorithms',
          description: 'Basic algorithms and problem solving',
          status: 'not_started',
          order: 3,
          content: []
        }
      ],
      announcements: [
        {
          title: 'Welcome to CS101',
          content: 'Welcome to Introduction to Computer Science! Please check the syllabus and prepare for our first class.',
          date: new Date(),
          priority: 'high',
          isActive: true
        },
        {
          title: 'Assignment 1 Released',
          content: 'The first assignment has been released. Please check the assignments section.',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          priority: 'medium',
          isActive: true
        }
      ],
      resources: [
        {
          title: 'Course Textbook',
          type: 'pdf',
          url: 'https://example.com/textbook.pdf',
          uploadedAt: new Date()
        },
        {
          title: 'Online Coding Platform',
          type: 'link',
          url: 'https://codingplatform.com',
          uploadedAt: new Date()
        }
      ]
    });

    // Create assignments
    const assignment1 = await Assignment.create({
      title: 'Hello World Program',
      description: 'Write your first program that prints "Hello, World!"',
      instructions: 'Create a simple program in any programming language that outputs "Hello, World!" to the console.',
      course: course._id,
      instructor: teacher._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      submissionType: 'both',
      allowLateSubmission: true,
      lateSubmissionPenalty: 10,
      submissions: []
    });

    const assignment2 = await Assignment.create({
      title: 'Basic Calculator',
      description: 'Create a simple calculator program',
      instructions: 'Build a calculator that can perform basic arithmetic operations (+, -, *, /).',
      course: course._id,
      instructor: teacher._id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxScore: 150,
      submissionType: 'file',
      allowLateSubmission: false,
      lateSubmissionPenalty: 0,
      submissions: []
    });

    // Create submissions for assignment1 using the embedded schema
    for (let i = 0; i < 3; i++) {
      const submission = {
        student: students[i]._id,
        submittedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        textSubmission: `print("Hello, World!") # Submission by ${students[i].profile.firstName}`,
        status: i === 0 ? 'graded' : 'submitted',
        isLate: false,
        grade: {
          maxScore: assignment1.maxScore,
          score: i === 0 ? 95 : undefined,
          feedback: i === 0 ? 'Excellent work! Clean and simple implementation.' : undefined,
          gradedBy: i === 0 ? teacher._id : undefined,
          gradedAt: i === 0 ? new Date() : undefined
        }
      };
      
      assignment1.submissions.push(submission);
    }
    
    await assignment1.save();

    // Create attendance records
    const attendanceDates = [];
    for (let i = 0; i < 10; i++) {
      attendanceDates.push(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    }

    for (let i = 0; i < attendanceDates.length; i++) {
      const date = attendanceDates[i];
      await Attendance.create({
        course: course._id,
        date: date,
        session: `Session ${i + 1}`,
        topic: `Lecture ${i + 1}: Programming Fundamentals`,
        instructor: teacher._id,
        records: students.map((student) => ({
          student: student._id,
          status: Math.random() > 0.2 ? 'present' : 'absent', // 80% attendance rate
          markedBy: teacher._id,
          markedAt: date
        }))
      });
    }

    console.log('Mock data added successfully!');
    console.log('Teacher login: teacher@example.com / password123');
    console.log('Student logins: student1@example.com to student5@example.com / password123');
    
  } catch (error) {
    console.error('Error adding mock data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addMockData();