import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function CourseCard({ course, userRole, onJoin, onEdit }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/course/${course._id}`); // Use ID for backend consistency
  };

  const handleJoinClick = (e) => {
    e.stopPropagation();
    if (onJoin) onJoin(course);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {userRole === 'student' ? 
          `Instructor: ${course.instructor?.profile?.fullName || course.instructor?.profile?.firstName || course.instructor?.email || 'TBD'}` : 
          `${course.enrolledCount || 0} students enrolled`}
      </p>
      
      {course.progress !== undefined && (
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="text-gray-900 dark:text-white font-medium">{course.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
        <span>📅 {course.semester}</span>
        <span>🏫 {course.department}</span>
        {course.credits && <span>📚 {course.credits} Credits</span>}
      </div>

      {onJoin ? (
        <button
          onClick={handleJoinClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Join Course
        </button>
      ) : (
        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
          Click to {userRole === 'student' ? 'view course details' : 'manage course'} →
        </div>
      )}
    </div>
  );
}

CourseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    semester: PropTypes.string,
    department: PropTypes.string,
    credits: PropTypes.number,
    progress: PropTypes.number,
    enrolledCount: PropTypes.number,
    instructor: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        profile: PropTypes.shape({
          fullName: PropTypes.string,
          firstName: PropTypes.string,
          email: PropTypes.string,
        }),
      }),
    ]),
  }).isRequired,
  userRole: PropTypes.oneOf(['student', 'teacher', 'admin']).isRequired,
  onJoin: PropTypes.func,
  onEdit: PropTypes.func,
};

export default CourseCard;