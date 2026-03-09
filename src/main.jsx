import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CreateTrip from './create-trip/CreateTrip.jsx'
import ViewTrip from './create-trip/ViewTrip.jsx'
import Header from './components/ui/custom/Header'
import Home from './pages/Home.jsx'
import { Toaster } from 'sonner'
import "leaflet/dist/leaflet.css";
import Login from "./pages/Login.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Register from "./pages/Register.jsx";
import UserTrips from "./pages/UserTrips.jsx";
import Profile from "./pages/Profile.jsx";
import Packages from "./pages/Packages.jsx";
import Rentals from "./pages/Rentals.jsx";
import Hotels from "./pages/Hotels.jsx";
import Layout from "./Layout.jsx";
import DestinationDetails from "./pages/DestinationDetails.jsx";




const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Home /></Layout>
  },
  {
    path: "/login",
    element: <Layout><Login /></Layout>
  },
  {
    path: "/register",
    element: <Layout><Register /></Layout>
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute role="user">
        <Layout><App /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute role="admin">
        <Layout><AdminDashboard /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/create-trip",
    element: <Layout><CreateTrip /></Layout>
  },
  {
    path: "/trip/:id",
    element: <Layout><ViewTrip /></Layout>
  },
  {
    path: "/my-trips",
    element: (
      <ProtectedRoute role="user">
        <Layout><UserTrips /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute role="user">
        <Layout><Profile /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/packages",
    element: <Layout><Packages /></Layout>,
  },
  {
    path: "/rentals",
    element: <Layout><Rentals /></Layout>,
  },
  {
    path: "/hotels",
    element: <Layout><Hotels /></Layout>,
  },
  {
    path: "/destination/:id",
    element: <Layout><DestinationDetails /></Layout>,
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster />
    <RouterProvider router={router} />
  </StrictMode>,
)
