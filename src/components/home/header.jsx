import Image from "next/image";

import styles from "@/styles/home.module.css";

export default function Header() {
  return (
    <header id={styles.homeHeader}>
      <div className={styles.logo}>
        <Image src="/images/Logo.png" width={260} height={100} alt="Logo" />
      </div>
    </header>
  );
}
