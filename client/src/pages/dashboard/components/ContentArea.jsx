import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
// import Profile from '../Profile';
// import YourTests from '../YourTests';
// import YourAttempts from '../YourAttempts';
// import RoomPlay from '../RoomPlay';
// import Settings from '../Settings';
// import Leaderboard from '../Leaderboard';
import YourTests from '../pages/YourTests';
import TestCreate from '../pages/TestCreate';
import TestReport from '../pages/TestReport';
import MyAttempts from '../pages/MyAttempts';
import QuizRoom from '../pages/QuizRoom';

const ContentArea = () => {
  return (
    <div className="content-area">
      <Routes>
        <Route path="" element={<Dashboard />} />
        {/* <Route path="/profile" element={<Profile />} /> */}
        <Route path="/tests" element={<YourTests />} />
        <Route path="/tests/report/:testId" element={<TestReport />} />
        <Route path="/test-create" element={<TestCreate />} />
        <Route path="/attempts" element={<MyAttempts />} />
        <Route path="/room" element={<QuizRoom/>} />
        
      </Routes>
    </div>
  );
};

export default ContentArea;