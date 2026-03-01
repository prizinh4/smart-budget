import React, { useEffect } from "react";
import { View, Text, Button, FlatList } from "react-native";
import { observer } from "mobx-react-lite";
import { dashboardStore } from "../stores/DashboardStore";
import { transactionStore } from "../stores/TransactionStore";
import { authStore } from "../stores/AuthStore";

export const DashboardScreen = observer(({ navigation }: any) => {
  useEffect(() => {
  if (authStore.user?.id) {
      dashboardStore.fetchDashboard(authStore.user.id);
    }
  }, [authStore.user]);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {dashboardStore.loading ? (
        <Text>Loading dashboard...</Text>
      ) : (
        <>
          <Text>Total Income: {dashboardStore.totalIncome}</Text>
          <Text>Total Expenses: {dashboardStore.totalExpenses}</Text>
          <Text>Top Categories:</Text>
          {dashboardStore.categoriesRanking.map((cat, i) => (
            <Text key={i}>
              {cat.name || 'Sem categoria'}: {cat.total}
            </Text>
          ))}
        </>
      )}

      <Button
        title="View Transactions"
        onPress={() => navigation.navigate("Transactions")}
      />
    </View>
  );
});