import styles from "@/styles/stats.module.css";

export default function SessionDetails() {
  return (
    <div className={styles.sessionDetailsContent}>
      <p>
        You Slept <span className={styles.duration}>3h 7m</span> from 6:00 AM to
        9:07 AM
      </p>
      <div className={styles.sessionBar}>
        <div className={styles.alternateTime}></div>
        <div className={styles.duration}></div>
      </div>
    </div>
  );
}
