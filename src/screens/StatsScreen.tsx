import React, { useCallback, useState } from 'react';
import { Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import SafeBlurView from '../components/SafeBlurView';
import useLocation from '../hooks/useLocation';

export default function StatsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await useLocation.getState().refresh();
    // const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    // await sleep(1000);
    setRefreshing(false);
  }, []);
  return (
    <SafeBlurView style={styles.container} intensity={20}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF" // iOS
            colors={["#007AFF"]} // Android
          />
        }
      >


        <Text style={styles.title}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Laboriosam animi fuga, fugit sequi dignissimos dolor commodi cupiditate cumque nihil maxime pariatur at quasi iusto blanditiis amet mollitia accusamus alias suscipit tenetur unde consequuntur itaque quaerat repellat vitae! Repudiandae, quaerat sit. Eaque repudiandae amet porro eligendi beatae vel enim eum fugiat tempora quia magnam consequatur nam dolorem facilis sapiente inventore deleniti necessitatibus error, vitae nostrum? Alias, dolorum.Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor labore itaque inventore excepturi ut voluptatum delectus nulla beatae sequi consequuntur error doloremque modi repudiandae ducimus dolore nam quas autem eius harum omnis, ullam corrupti molestiae quae incidunt? Eaque libero distinctio consequatur delectus quibusdam adipisci expedita nihil officiis quia qui, quidem id veritatis! Eaque minima recusandae adipisci velit iste explicabo nisi consequuntur amet odio nemo ratione asperiores id dolor, a porro quisquam ullam vero aliquam. Voluptatibus vel doloribus quam esse explicabo fugit architecto veritatis recusandae, ipsa delectus consequuntur dicta quas optio molestias quibusdam, similique sed accusamus! Ab iusto optio exercitationem officiis perspiciatis porro recusandae velit. Hic aliquid, perspiciatis suscipit saepe dicta repudiandae quaerat similique totam pariatur, fugiat illo dolor! Dolorum, magni nam quaerat tempore temporibus vel praesentium, veritatis, quasi harum dicta dolore cupiditate eveniet? Molestiae optio, consectetur iusto quo ipsum aspernatur illo? Sequi, amet. Provident numquam corporis consequatur, quibusdam consectetur tempora deserunt autem, sit minima, atque fuga dolor. Maiores ipsam esse dolor eius dolores quis. Consequuntur repudiandae soluta incidunt deleniti ex pariatur. Pariatur veniam distinctio maxime illo, amet ad tempore iusto mollitia autem nostrum inventore eius, aut, odio est laudantium assumenda? Quasi mollitia doloribus ea, magni dicta similique atque placeat minus?
        </Text>
      </ScrollView>
    </SafeBlurView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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