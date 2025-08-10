import styles from "@/styles/home.module.css";

export default function SleepButton() {
  return (
    <button className={`${styles.sleepButton} glassCard`}>
      <p>Sleep</p>
    </button>
  );
}
