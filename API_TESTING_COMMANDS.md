# API Testing Commands for Teacher Functionality

## Prerequisites
1. Start backend: `cd backend && npm run dev`
2. Backend should be running on `http://localhost:5000`
3. Mock data should be loaded: `cd backend && npm run seed`

## Authentication
First, get the authentication token by logging in as teacher:

### Login as Teacher
```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email": "teacher@example.com", "password": "password123"}'
$token = $loginResponse.token
```

## Course Management APIs

### 1. Get Course Details
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courses/COURSE_ID" -Method GET -Headers @{"Authorization" = "Bearer $token"}
```

### 2. Update Course (Add Announcement)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courses/COURSE_ID" -Method PUT -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body '{
  "announcements": [
    {
      "title": "New Announcement",
      "content": "This is a test announcement from API",
      "priority": "high",
      "isActive": true,
      "date": "2024-12-19T10:00:00.000Z"
    }
  ]
}'
```

## Student Management APIs

### 3. Enroll Student in Course
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courses/COURSE_ID/enroll-student" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body '{
  "studentEmail": "student6@example.com"
}'
```

### 4. Get Course Students
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courses/COURSE_ID/students" -Method GET -Headers @{"Authorization" = "Bearer $token"}
```

### 5. Remove Student from Course
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courses/COURSE_ID/remove-student" -Method DELETE -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body '{
  "studentId": "STUDENT_ID"
}'
```

## Assignment Management APIs

### 6. Create Assignment
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/assignments" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body '{
  "title": "Test Assignment",
  "description": "This is a test assignment created via API",
  "instructions": "Complete the following tasks...",
  "course": "COURSE_ID",
  "dueDate": "2024-12-25T23:59:59.000Z",
  "maxScore": 100,
  "submissionType": "text",
  "allowLateSubmission": true,
  "lateSubmissionPenalty": 10
}'
```

### 7. Get Assignment Submissions
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/assignments/ASSIGNMENT_ID/submissions" -Method GET -Headers @{"Authorization" = "Bearer $token"}
```

### 8. Grade Submission
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/assignments/submissions/SUBMISSION_ID/grade" -Method PUT -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body '{
  "grade": 85,
  "feedback": "Good work! Well structured solution."
}'
```

## Attendance Management APIs

### 9. Mark Attendance
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courses/COURSE_ID/attendance" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body '{
  "date": "2024-12-19",
  "session": "Morning Session",
  "topic": "Introduction to Programming",
  "attendanceData": [
    {
      "studentId": "STUDENT_ID_1",
      "status": "present",
      "notes": ""
    },
    {
      "studentId": "STUDENT_ID_2", 
      "status": "absent",
      "notes": "Sick leave"
    }
  ]
}'
```

### 10. Get Attendance Summary
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courses/COURSE_ID/attendance-summary" -Method GET -Headers @{"Authorization" = "Bearer $token"}
```

## Complete Test Script

Here's a complete PowerShell script to test all functionality:

```powershell
# Login and get token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email": "teacher@example.com", "password": "password123"}'
$token = $loginResponse.token
Write-Host "Logged in successfully. Token: $($token.Substring(0,20))..."

# Get courses to find course ID
$courses = Invoke-RestMethod -Uri "http://localhost:5000/api/courses" -Method GET -Headers @{"Authorization" = "Bearer $token"}
$courseId = $courses.courses[0]._id
Write-Host "Using Course ID: $courseId"

# Get course details
$course = Invoke-RestMethod -Uri "http://localhost:5000/api/courses/$courseId" -Method GET -Headers @{"Authorization" = "Bearer $token"}
Write-Host "Course Name: $($course.course.name)"

# Get students
$students = Invoke-RestMethod -Uri "http://localhost:5000/api/courses/$courseId/students" -Method GET -Headers @{"Authorization" = "Bearer $token"}
Write-Host "Number of students: $($students.students.Count)"

# Get assignments
$assignments = Invoke-RestMethod -Uri "http://localhost:5000/api/assignments/course/$courseId" -Method GET -Headers @{"Authorization" = "Bearer $token"}
Write-Host "Number of assignments: $($assignments.assignments.Count)"

# Get attendance summary
$attendance = Invoke-RestMethod -Uri "http://localhost:5000/api/courses/$courseId/attendance-summary" -Method GET -Headers @{"Authorization" = "Bearer $token"}
Write-Host "Attendance summary retrieved for $($attendance.summary.Count) students"

Write-Host "All API tests completed successfully!"
```

## Mock Data IDs (After running npm run seed)

To get the actual IDs for testing, run this command after seeding:

```powershell
# Get all courses and their IDs
$courses = Invoke-RestMethod -Uri "http://localhost:5000/api/courses" -Method GET -Headers @{"Authorization" = "Bearer $token"}
$courses.courses | ForEach-Object { Write-Host "Course: $($_.name) - ID: $($_._id)" }

# Get students for a course
$students = Invoke-RestMethod -Uri "http://localhost:5000/api/courses/COURSE_ID/students" -Method GET -Headers @{"Authorization" = "Bearer $token"}
$students.students | ForEach-Object { Write-Host "Student: $($_.profile.firstName) $($_.profile.lastName) - ID: $($_._id)" }
```

## Troubleshooting

1. **401 Unauthorized**: Make sure you're logged in and using the correct token
2. **404 Not Found**: Verify the course/student/assignment IDs are correct
3. **400 Bad Request**: Check the request body format and required fields
4. **500 Server Error**: Check backend logs for detailed error information

Replace `COURSE_ID`, `STUDENT_ID`, `ASSIGNMENT_ID`, and `SUBMISSION_ID` with actual IDs from your database.