import HomePage from "@/components/home";
import NavBar from "@/components/navbar";

import styles from "@/styles/home.module.css";

export default function Home() {
  return (
    <>
      <div className={styles.page}>
        <HomePage />
      </div>
      <NavBar />
    </>
  );
}
