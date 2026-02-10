import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

type NavState = "Home" | "Statistics" | "Settings";

export default function NavBar({
  navState,
  setNavState,
}: {
  navState: NavState;
  setNavState: React.Dispatch<React.SetStateAction<NavState>>;
}) {

  return (
    <View>
      <TouchableOpacity onPress={() => setNavState("Statistics")}>
        <Text>Statistics</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setNavState("Home")}>
        <Text>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setNavState("Settings")}>
        <Text>Settings</Text>
      </TouchableOpacity>

    </View>
  );
}