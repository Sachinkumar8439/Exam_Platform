import './App.css'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Layout from './pages/dashboard/components/Layout';
import { AppStateProvider } from "./contexts/AppStateContext";
import { useAppState } from './hooks/useAppState';
import TestAttempt from './pages/dashboard/pages/TestAttempt';


function App() {
  const {user } = useAppState()
  
  return (
    <BrowserRouter>
      <ToastContainer/>
      <Routes>
        <Route path="/" element={!user ? <Login />: <Navigate to={"/u"}/>} />
        <Route path="/signup" element={!user ? <Signup />: <Navigate to={"/u"}/>} />
        <Route path="/t/attempt/:testId" element={user ? <TestAttempt />: <Navigate to={"/"}/>} />
        <Route path="/u/*" element={user ? <Layout /> : <Navigate to={"/"}/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;