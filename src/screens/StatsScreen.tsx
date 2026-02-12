import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function StatsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Statistics</Text>
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>Stat {i}</Text>
            <Text style={styles.cardValue}>--</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.title, {color:"#fd8787"}]}>Lorem ipsum dolor sit amet consectetur adipisicing elit. Laboriosam animi fuga, fugit sequi dignissimos dolor commodi cupiditate cumque nihil maxime pariatur at quasi iusto blanditiis amet mollitia accusamus alias suscipit tenetur unde consequuntur itaque quaerat repellat vitae! Repudiandae, quaerat sit. Eaque repudiandae amet porro eligendi beatae vel enim eum fugiat tempora quia magnam consequatur nam dolorem facilis sapiente inventore deleniti necessitatibus error, vitae nostrum? Alias, dolorum. </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#0f0f0f', flex: 1 },
  title: { fontSize: 28, color: 'white', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { 
    width: '48%', 
    backgroundColor: '#1a1a1a', 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  cardTitle: { color: '#888', fontSize: 12 },
  cardValue: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 5 }
});