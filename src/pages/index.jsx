import { useState } from "react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP);

import HomePage from "@/components/home";
import SettingsPage from "@/components/settings";
import StatsPage from "@/components/stats";
import NavBar from "@/components/navbar";

import styles from "@/styles/home.module.css";

export default function Home() {
  const [navMode, setNavMode] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pages = {
    0: <StatsPage />,
    1: <HomePage />,
    2: <SettingsPage />,
  };

  useGSAP(
    () => {
      gsap.to(`.${styles.page}`, {
        x: navMode > currentPage ? -15 : navMode < currentPage ? 15 : 0,
        opacity: navMode != currentPage ? 0 : 1,
        ease: ".5, .05, .53, 1.3",
        duration: 0.25,

        onComplete: () => {
          setCurrentPage(navMode); // the only non animation line

          gsap.fromTo(
            `.${styles.page}`,
            {
              x: navMode > currentPage ? 15 : navMode < currentPage ? -15 : 0,
              opacity: navMode != currentPage ? 0 : 1,
              duration: 0,
            },
            {
              x: 0,
              opacity: 1,
              ease: ".5, .05, .53, 1.3",
              duration: 0.25,
            }
          );
        },
      });
    },
    { dependencies: [navMode] }
  );

  return (
    <>
      <div className={styles.page}>{pages[currentPage]}</div>
      <NavBar navMode={navMode} setNavMode={setNavMode} />
    </>
  );
}
