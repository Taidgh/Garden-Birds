import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminPage from './components/AdminPage.jsx'
import AllSpeciesPage from './components/AllSpeciesPage.jsx'
import './index.css'

const path = window.location.pathname;
const isAdmin   = path.startsWith('/admin');
const isSpecies = path.startsWith('/species');

// Fetch siteTitle for pages that need it
let root;
if (isAdmin) {
  root = <AdminPage />;
} else if (isSpecies) {
  // Pass siteTitle via a simple wrapper that fetches it
  root = <SpeciesWrapper />;
} else {
  root = <App />;
}

function SpeciesWrapper() {
  const [siteTitle, setSiteTitle] = React.useState("Ruairí's Garden");
  React.useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.siteTitle) setSiteTitle(d.siteTitle);
    }).catch(() => {});
  }, []);
  return <AllSpeciesPage siteTitle={siteTitle} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{root}</React.StrictMode>
)
