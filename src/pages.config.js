import Home from './pages/Home';
import Shopping from './pages/Shopping';
import Inventory from './pages/Inventory';
import Repairs from './pages/Repairs';
import Projects from './pages/Projects';
import Bills from './pages/Bills';
import Family from './pages/Family';
import FamilyCalendar from './pages/FamilyCalendar';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Shopping": Shopping,
    "Inventory": Inventory,
    "Repairs": Repairs,
    "Projects": Projects,
    "Bills": Bills,
    "Family": Family,
    "FamilyCalendar": FamilyCalendar,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};