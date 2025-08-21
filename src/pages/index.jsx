import { useState } from "react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP);

import HomePage from "@/components/home";
import SettingsPage from "@/components/settings";
import StatsPage from "@/components/stats";
import NavBar from "@/components/navbar";

export default function Home() {
  // will remove this var later
  const defaultPage = 0;

  const [navMode, setNavMode] = useState(defaultPage);
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const pages = {
    0: <StatsPage />,
    1: <HomePage />,
    2: <SettingsPage />,
  };

  useGSAP(
    () => {
      gsap.to(`.page`, {
        x: navMode > currentPage ? -15 : navMode < currentPage ? 15 : 0,
        opacity: navMode != currentPage ? 0 : 1,
        ease: ".5, .05, .53, 1.3",
        duration: 0.25,

        onComplete: () => {
          setCurrentPage(navMode); // the only non animation line

          gsap.fromTo(
            `.page`,
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
      <div className="page">{pages[currentPage]}</div>
      <NavBar navMode={navMode} setNavMode={setNavMode} />
    </>
  );
}
