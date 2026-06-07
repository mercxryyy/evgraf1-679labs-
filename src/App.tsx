import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Layers, LayoutGrid, Edit } from "lucide-react";
import Gallery from "./screens/Gallery";
import Editor from "./screens/Editor";

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="flex gap-6 p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-1 rounded transition ${
              isActive ? "bg-blue-600" : "hover:bg-slate-800"
            }`
          }
          end
        >
          <LayoutGrid size={18} /> Gallery
        </NavLink>
        <NavLink
          to="/editor/new"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-1 rounded transition ${
              isActive ? "bg-blue-600" : "hover:bg-slate-800"
            }`
          }
        >
          <Edit size={18} /> Create
        </NavLink>
        <div className="ml-auto flex items-center gap-1 text-slate-400">
          <Layers size={16} />
          <span className="text-sm">VectorEngine</span>
        </div>
      </nav>
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Gallery />} />
              <Route path="/editor/:id" element={<Editor />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;