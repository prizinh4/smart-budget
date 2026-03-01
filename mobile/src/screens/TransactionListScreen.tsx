import React, { useEffect } from "react";
import { View, Text, FlatList, Button } from "react-native";
import { observer } from "mobx-react-lite";
import { transactionStore } from "../stores/TransactionStore";

export const TransactionListScreen = observer(() => {
  useEffect(() => {
    transactionStore.fetchTransactions();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {transactionStore.loading ? (
        <Text>Loading transactions...</Text>
      ) : (
        <FlatList
          data={transactionStore.transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Text>
              {item.category}: {item.amount} ({item.type})
            </Text>
          )}
        />
      )}
    </View>
  );
});