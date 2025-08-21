import Image from "next/image";

import styles from "@/styles/home.module.css";

export default function Header() {
  return (
    <header>
      <div className={styles.logo}>
        <Image
          src="/images/Logo.png"
          priority={true}
          width={260}
          height={100}
          alt="Logo"
        />
      </div>
    </header>
  );
}
