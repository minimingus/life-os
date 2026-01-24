import Bills from './pages/Bills';
import Family from './pages/Family';
import FamilyCalendar from './pages/FamilyCalendar';
import FamilyRoutine from './pages/FamilyRoutine';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import Projects from './pages/Projects';
import Repairs from './pages/Repairs';
import SchoolSchedule from './pages/SchoolSchedule';
import Shopping from './pages/Shopping';
import Tasks from './pages/Tasks';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Bills": Bills,
    "Family": Family,
    "FamilyCalendar": FamilyCalendar,
    "FamilyRoutine": FamilyRoutine,
    "Home": Home,
    "Inventory": Inventory,
    "Projects": Projects,
    "Repairs": Repairs,
    "SchoolSchedule": SchoolSchedule,
    "Shopping": Shopping,
    "Tasks": Tasks,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};