import { Link, Outlet } from "react-router-dom";
import Styles from '../App.css'

export default function Layout() {
    return (
        <div>
            <nav>
                <ul>
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li>
                    <Link to="/about">About</Link>
                </li>
                </ul>
        </nav>
        <Outlet />
    </div>
    )
}