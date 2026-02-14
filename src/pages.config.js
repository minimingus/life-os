/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIReports from './pages/AIReports';
import AISettings from './pages/AISettings';
import Bills from './pages/Bills';
import Budget from './pages/Budget';
import Family from './pages/Family';
import FamilyCalendar from './pages/FamilyCalendar';
import FamilyRoutine from './pages/FamilyRoutine';
import Health from './pages/Health';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import NotificationSettings from './pages/NotificationSettings';
import Projects from './pages/Projects';
import Repairs from './pages/Repairs';
import SchoolSchedule from './pages/SchoolSchedule';
import Shopping from './pages/Shopping';
import Tasks from './pages/Tasks';
import app from './pages/_app';
import Education from './pages/Education';
import Search from './pages/Search';
import Analytics from './pages/Analytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIReports": AIReports,
    "AISettings": AISettings,
    "Bills": Bills,
    "Budget": Budget,
    "Family": Family,
    "FamilyCalendar": FamilyCalendar,
    "FamilyRoutine": FamilyRoutine,
    "Health": Health,
    "Home": Home,
    "Inventory": Inventory,
    "NotificationSettings": NotificationSettings,
    "Projects": Projects,
    "Repairs": Repairs,
    "SchoolSchedule": SchoolSchedule,
    "Shopping": Shopping,
    "Tasks": Tasks,
    "_app": app,
    "Education": Education,
    "Search": Search,
    "Analytics": Analytics,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};