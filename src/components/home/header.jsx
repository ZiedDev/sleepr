import styles from "@/styles/home.module.css";

export default function Header() {
  return (
    <header id={styles.homeHeader}>
      <div className={styles.logo}>Sleepr</div>
    </header>
  );
}
