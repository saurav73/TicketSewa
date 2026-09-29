import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import MyTickets from './pages/MyTickets';
import Organizer from './pages/Organizer';

function Nav() {
  const { user, logout, isOrganizer } = useAuth();
  const nav = useNavigate();
  return (
    <header className="nav">
      <Link to="/" className="brand">Ticket<span>Sewa</span></Link>
      <nav>
        {isOrganizer && <Link to="/organizer">Organizer</Link>}
        {user ? (<>
          <Link to="/tickets">My Tickets</Link>
          <span className="user">{user.name}</span>
          <button className="btn ghost" onClick={() => { logout(); nav('/'); }}>Logout</button>
        </>) : (<>
          <Link to="/login">Login</Link>
          <Link to="/register" className="btn">Sign up</Link>
        </>)}
      </nav>
    </header>
  );
}

function Shell() {
  const loc = useLocation();
  const isHome = loc.pathname === '/';
  return (
    <>
      <Nav />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout/:orderId" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
          <Route path="/tickets" element={<MyTickets />} />
          <Route path="/organizer" element={<Organizer />} />
        </Routes>
      </main>
      {!isHome && <footer className="footer">TicketSewa — event ticketing for Nepal · eSewa payments · QR check-in</footer>}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
