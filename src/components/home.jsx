import Header from "@/components/home/header";
import Clock from "@/components/home/clock";
import SleepButton from "@/components/home/sleepButton";
import NavBar from "@/components/navbar";

export default function HomePage() {
  return (
    <div className="home">
      <Header />
      <Clock />
      <SleepButton />
      <NavBar />
    </div>
  );
}
