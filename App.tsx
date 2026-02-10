import React, {useState} from "react";
import HomeScreen from "./src/screens/HomeScreen";
import NavBar from "./src/components/NavBar";
import { View } from "react-native";
import SettingsScreen from "./src/screens/SettingsScreen";
import StatsScreen from "./src/screens/StatsScreen";

export default function App() {
  const [navState, setNavState] = useState<"Home" | "Statistics" | "Settings">('Home'); 
  
  const page = {
    "Home": <HomeScreen/>,
    "Statistics": <StatsScreen/>,
    "Settings": <SettingsScreen/>
  }

  return (
    <>
      {page[navState]}
      <NavBar navState={navState} setNavState={setNavState}/>
    </>
  );
}
