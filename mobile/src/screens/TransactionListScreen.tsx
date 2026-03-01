import React, { useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { transactionStore } from '../stores/TransactionStore';

export const TransactionListScreen = observer(() => {
  useEffect(() => {
    transactionStore.fetchTransactions();
  }, []);

  if (transactionStore.loading) return <ActivityIndicator size="large" style={{ flex:1, justifyContent:'center' }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={transactionStore.transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.title} - {item.type} - ${item.amount}</Text>
            <Text>Category: {item.category?.name || 'None'}</Text>
          </View>
        )}
      />
      <View style={styles.buttons}>
        <Button title="Prev" onPress={() => transactionStore.prevPage()} disabled={transactionStore.page <= 1} />
        <Text style={styles.page}>{transactionStore.page}/{transactionStore.lastPage}</Text>
        <Button title="Next" onPress={() => transactionStore.nextPage()} disabled={transactionStore.page >= transactionStore.lastPage} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex:1, padding:20 },
  card: { padding:10, borderWidth:1, borderColor:'#ccc', borderRadius:5, marginBottom:10 },
  buttons: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:10 },
  page: { fontSize:16 }
});