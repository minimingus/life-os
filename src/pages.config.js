import Home from './pages/Home';
import Shopping from './pages/Shopping';
import Inventory from './pages/Inventory';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Shopping": Shopping,
    "Inventory": Inventory,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};