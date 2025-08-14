import styles from "@/styles/navbar.module.css";

import {
  PhHouseBold as HouseIcon,
  PhGearFineBold as GearIcon,
  PhChartBarBold as ChartIcon,
} from "./icones";

export default function NavBar({ navMode, setNavMode }) {
  const navContents = [
    { label: "Statistics", icon: ChartIcon },
    { label: "Home", icon: HouseIcon },
    { label: "Settings", icon: GearIcon },
  ];

  return (
    <nav
      className={`${styles.nav} glassCard`}
      style={{ "--item-num": navContents.length, "--item-selected": navMode }}
    >
      {navContents.map((item, index) => (
        <button
          className={navMode == index ? styles.active : ""}
          key={index}
          onClick={() => setNavMode(index)}
        >
          <item.icon />
          <p>{item.label}</p>
        </button>
      ))}
      <div className={styles.selector}></div>
    </nav>
  );
}
