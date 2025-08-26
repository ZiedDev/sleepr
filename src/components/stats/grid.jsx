import styles from "@/styles/stats.module.css";
import HoursSlept from "./gridComponents/hoursSlept";

export default function Grid() {
  return (
    <div className={styles.grid}>
      <div className={`${styles.hoursSlept} glassCard`}>
        <HoursSlept />
      </div>
      <div className={`${styles.averages} glassCard`}></div>
      <div className={`${styles.sessionDetails} glassCard`}></div>
      <div className={`${styles.sleepSessions} glassCard`}></div>
    </div>
  );
}
