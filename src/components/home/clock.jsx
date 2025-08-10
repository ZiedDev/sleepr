import styles from "@/styles/home.module.css";

export default function Clock() {
  return (
    <div className={styles.clockContainer}>
      <div className={styles.text}>10:54 PM</div>
    </div>
  );
}
