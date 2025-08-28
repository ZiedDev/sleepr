import styles from "@/styles/stats.module.css";

export default function HoursSlept() {
  let barContent = [
    { value: 5, title: "Sat" },
    { value: 3.5, title: "Sun" },
    { value: 8.2, title: "Mon" },
    { value: 6.5, title: "Tue" },
    { value: 7.2, title: "Wed" },
    { value: 0, title: "Thu" },
    { value: 0, title: "Fri" },
  ];

  // let barContent = [
  //   { value: 5, title: "J" },
  //   { value: 5.5, title: "F" },
  //   { value: 6.2, title: "M" },
  //   { value: 6.5, title: "A" },
  //   { value: 3, title: "M" },
  //   { value: 7.6, title: "J" },
  //   { value: 5.8, title: "J" },
  //   { value: 2.5, title: "A" },
  //   { value: 4, title: "S" },
  //   { value: 1.5, title: "O" },
  //   { value: 7, title: "N" },
  //   { value: 8.1, title: "D" },
  // ];

  let max = Math.max(...barContent.map((item) => item.value), 0);

  return (
    <div
      className={styles.hoursSleptContent}
      style={{ "--barCount": barContent.length }}
    >
      <div className={styles.title}>
        <h2>Hours Slept</h2>
        <p>2 - 8 Nov 2025</p>
      </div>
      <div className={styles.barChart}>
        {barContent.map((item, index) => (
          <div
            className={styles.barItem}
            style={{ height: `calc(${100 * (item.value / max)}%)` }}
            key={index}
          >
            <p>{item.value != 0 ? item.value : ""}</p>
          </div>
        ))}
      </div>
      <div className={styles.xAxis}>
        {barContent.map((item, index) => (
          <p className={styles.axisText} key={index}>
            {item.title}
          </p>
        ))}
      </div>
    </div>
  );
}
