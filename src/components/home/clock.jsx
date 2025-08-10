import styles from "@/styles/home.module.css";

export default function Clock() {
  return (
    <div className={`${styles.clockContainer} glassCard`}>
      <div className={styles.text}>
        <p>10:54 PM</p>
      </div>
    </div>
  );
}
