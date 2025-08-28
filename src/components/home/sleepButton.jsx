import styles from "@/styles/home.module.css";
import { useContext } from "react";
import { SleepContext } from "@/pages/index";
import { logic } from "@/DBLogic/script";

export default function SleepButton() {
  const { sleepState, setSleepState } = useContext(SleepContext);

  return (
    <button
      className={`${styles.sleepButton} glassCard`}
      onClick={async () => {
        setSleepState(!sleepState);

        if (sleepState) {
          await logic.sleepSession.stop();
        } else {
          await logic.sleepSession.start();
        }
      }}
    >
      <p>{sleepState ? "Wake" : "Sleep"}</p>
    </button>
  );
}
