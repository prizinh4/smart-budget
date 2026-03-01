import React, { useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { observer } from "mobx-react-lite";
import { dashboardStore } from "../stores/DashboardStore";
import { authStore } from "../stores/AuthStore";

export const DashboardScreen = observer(({ navigation }: any) => {
  useEffect(() => {
    if (authStore.user?.id) {
      dashboardStore.fetchDashboard(authStore.user.id);
    }
  }, [authStore.user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      
      {dashboardStore.loading ? (
        <Text>Loading dashboard...</Text>
      ) : (
        <View style={styles.summary}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Receitas</Text>
            <Text style={[styles.cardValue, { color: '#22c55e' }]}>
              R$ {Number(dashboardStore.totalIncome).toFixed(2)}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Despesas</Text>
            <Text style={[styles.cardValue, { color: '#ef4444' }]}>
              R$ {Number(dashboardStore.totalExpenses).toFixed(2)}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Saldo</Text>
            <Text style={[styles.cardValue, { color: '#3b82f6' }]}>
              R$ {(Number(dashboardStore.totalIncome) - Number(dashboardStore.totalExpenses)).toFixed(2)}
            </Text>
          </View>
          
          {dashboardStore.categoriesRanking.length > 0 && (
            <View style={styles.rankingSection}>
              <Text style={styles.sectionTitle}>Top Categorias:</Text>
              {dashboardStore.categoriesRanking.map((cat, i) => (
                <Text key={i} style={styles.rankingItem}>
                  {cat.name || 'Sem categoria'}: R$ {Number(cat.total).toFixed(2)}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.buttons}>
        <Button
          title="Transações"
          onPress={() => navigation.navigate("Transactions")}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Categorias"
          onPress={() => navigation.navigate("Categories")}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Metas"
          onPress={() => navigation.navigate("Goals")}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Sair"
          color="#ef4444"
          onPress={() => {
            authStore.logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  summary: { marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardLabel: { fontSize: 14, color: '#666' },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  rankingSection: { marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  rankingItem: { fontSize: 14, color: '#333', marginLeft: 10 },
  buttons: { marginTop: 'auto' },
  buttonSpacer: { height: 10 },
});