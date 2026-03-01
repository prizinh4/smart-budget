import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { observer } from "mobx-react-lite";
import { dashboardStore } from "../stores/DashboardStore";
import { authStore } from "../stores/AuthStore";

const { width } = Dimensions.get('window');

export const DashboardScreen = observer(({ navigation }: any) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = useCallback(() => {
    if (authStore.user?.id) {
      dashboardStore.fetchDashboard(authStore.user.id);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const balance = Number(dashboardStore.totalIncome) - Number(dashboardStore.totalExpenses);
  const balanceColor = balance >= 0 ? '#22c55e' : '#ef4444';

  const handleLogout = () => {
    authStore.logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (dashboardStore.loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {authStore.user?.name || 'Usuário'}!</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo do Mês</Text>
        <Text style={[styles.balanceValue, { color: balanceColor }]}>
          R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
        <View style={styles.balanceDetails}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemIcon}>↑</Text>
            <View>
              <Text style={styles.balanceItemLabel}>Receitas</Text>
              <Text style={[styles.balanceItemValue, { color: '#22c55e' }]}>
                R$ {Number(dashboardStore.totalIncome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemIcon}>↓</Text>
            <View>
              <Text style={styles.balanceItemLabel}>Despesas</Text>
              <Text style={[styles.balanceItemValue, { color: '#ef4444' }]}>
                R$ {Number(dashboardStore.totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Acesso Rápido</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#3b82f6' }]}
          onPress={() => navigation.navigate("Transactions")}
        >
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionText}>Transações</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#8b5cf6' }]}
          onPress={() => navigation.navigate("Categories")}
        >
          <Text style={styles.actionIcon}>📂</Text>
          <Text style={styles.actionText}>Categorias</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#f59e0b' }]}
          onPress={() => navigation.navigate("Goals")}
        >
          <Text style={styles.actionIcon}>🎯</Text>
          <Text style={styles.actionText}>Metas</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Ranking */}
      {dashboardStore.categoriesRanking.length > 0 && (
        <View style={styles.rankingCard}>
          <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
          {dashboardStore.categoriesRanking.map((cat, i) => {
            const total = Number(cat.total);
            const maxTotal = Number(dashboardStore.categoriesRanking[0]?.total) || 1;
            const percentage = (total / maxTotal) * 100;
            const barColor = cat.color || '#3b82f6';
            
            return (
              <View key={i} style={styles.rankingItem}>
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingIcon}>{cat.icon || '📦'}</Text>
                  <Text style={styles.rankingName}>{cat.name || 'Sem categoria'}</Text>
                  <Text style={styles.rankingValue}>
                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.rankingBarBg}>
                  <View style={[styles.rankingBar, { width: `${percentage}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Empty State */}
      {dashboardStore.categoriesRanking.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Nenhuma transação este mês</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("Transactions")}
          >
            <Text style={styles.emptyButtonText}>Adicionar transação</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  date: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceItemIcon: {
    fontSize: 20,
    color: '#fff',
  },
  balanceItemLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  rankingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rankingItem: {
    marginBottom: 16,
  },
  rankingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankingIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  rankingName: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  rankingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  rankingBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  rankingBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});