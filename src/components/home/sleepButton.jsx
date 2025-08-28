import styles from "@/styles/home.module.css";
import { useContext } from "react";
import { SleepContext } from "@/pages/index";

export default function SleepButton() {
  const { sleepState, setSleepState } = useContext(SleepContext);

  return (
    <button
      className={`${styles.sleepButton} glassCard`}
      onClick={() => setSleepState(!sleepState)}
    >
      <p>{sleepState ? "Wake" : "Sleep"}</p>
    </button>
  );
}
