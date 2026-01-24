import Bills from './pages/Bills';
import Family from './pages/Family';
import FamilyCalendar from './pages/FamilyCalendar';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import Projects from './pages/Projects';
import Repairs from './pages/Repairs';
import Shopping from './pages/Shopping';
import FamilyRoutine from './pages/FamilyRoutine';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Bills": Bills,
    "Family": Family,
    "FamilyCalendar": FamilyCalendar,
    "Home": Home,
    "Inventory": Inventory,
    "Projects": Projects,
    "Repairs": Repairs,
    "Shopping": Shopping,
    "FamilyRoutine": FamilyRoutine,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};