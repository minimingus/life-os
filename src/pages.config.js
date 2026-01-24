import Home from './pages/Home';
import Shopping from './pages/Shopping';
import Inventory from './pages/Inventory';
import Repairs from './pages/Repairs';
import Projects from './pages/Projects';
import Bills from './pages/Bills';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Shopping": Shopping,
    "Inventory": Inventory,
    "Repairs": Repairs,
    "Projects": Projects,
    "Bills": Bills,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};