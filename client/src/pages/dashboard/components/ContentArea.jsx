import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
// import Profile from '../Profile';
// import YourTests from '../YourTests';
// import YourAttempts from '../YourAttempts';
// import RoomPlay from '../RoomPlay';
// import Settings from '../Settings';
// import Leaderboard from '../Leaderboard';
import '../styles/content.css';
import YourTests from '../pages/YourTests';
import TestCreate from '../pages/TestCreate';

const ContentArea = () => {
  return (
    <div className="content-area">
      <Routes>
        <Route path="" element={<Dashboard />} />
        {/* <Route path="/profile" element={<Profile />} /> */}
        <Route path="/tests" element={<YourTests />} />
        <Route path="/test-create" element={<TestCreate />} />
        {/* <Route path="/attempts" element={<YourAttempts />} /> */}
        {/* <Route path="/room" element={<RoomPlay />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/settings" element={<Settings />} /> */}
      </Routes>
    </div>
  );
};

export default ContentArea;