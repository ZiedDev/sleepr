import styles from "@/styles/navbar.module.css";
import {
  PhHouse as HouseIcon,
  PhGearFine as GearIcon,
  PhChartBar as ChartIcon,
} from "./icones";

export default function NavBar() {
  return (
    <nav>
      <button>
        <ChartIcon />
        <p>Statistics</p>
      </button>
      <button>
        <HouseIcon />
        <p>Home</p>
      </button>
      <button>
        <GearIcon />
        <p>Settings</p>
      </button>
    </nav>
  );
}
