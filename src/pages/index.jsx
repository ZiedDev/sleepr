import { useState } from "react";

import HomePage from "@/components/home";
import SettingsPage from "@/components/settings";
import StatsPage from "@/components/stats";
import NavBar from "@/components/navbar";

import styles from "@/styles/home.module.css";

export default function Home() {
  const [navMode, setNavMode] = useState(1);
  const pages = {
    0: <StatsPage />,
    1: <HomePage />,
    2: <SettingsPage />,
  };

  return (
    <>
      <div className={styles.page}>{pages[navMode]}</div>
      <NavBar navMode={navMode} setNavMode={setNavMode} />
    </>
  );
}
