import styles from "@/styles/home.module.css";

import {
  PhHouseBold as HouseIcon,
  PhGearFineBold as GearIcon,
  PhChartBarBold as ChartIcon,
} from "./icones";

export default function NavBar() {
  return (
    <nav className={`${styles.nav} glassCard`}>
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
