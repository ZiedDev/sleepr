import { DateTime } from "luxon";
import styles from "@/styles/home.module.css";
import { useState } from "react";
import { useGSAP } from "@gsap/react";

export default function Clock() {
  const [time, setTime] = useState(DateTime.now().toFormat("h:mm a"));

  useGSAP(() => {
    setInterval(() => {
      setTime(DateTime.now().toFormat("h:mm a"));
    }, 1000);
  });

  return (
    <div className={`${styles.clockContainer} glassCard`}>
      <div className={styles.text}>
        <p>{time}</p>
      </div>
    </div>
  );
}
