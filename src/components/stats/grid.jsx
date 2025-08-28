import styles from "@/styles/stats.module.css";
import HoursSlept from "./gridComponents/hoursSlept";
import Averages from "./gridComponents/averages";
import SessionDetails from "./gridComponents/sessionDetails";

export default function Grid() {
  return (
    <div className={styles.grid}>
      <div className={`${styles.hoursSlept} glassCard`}>
        <HoursSlept />
      </div>
      <div className={`${styles.averages} glassCard`}>
        <Averages />
      </div>
      <div className={`${styles.sessionDetails} glassCard`}>
        <SessionDetails />
      </div>
      <div className={`${styles.sleepSessions} glassCard`}></div>
    </div>
  );
}
