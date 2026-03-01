import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, ScrollView } from "react-native";
import { observer } from "mobx-react-lite";
import { transactionStore } from "../stores/TransactionStore";
import { categoryStore } from "../stores/CategoryStore";

export const TransactionListScreen = observer(() => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    transactionStore.fetchTransactions();
    categoryStore.fetchCategories();
  }, []);

  const filteredTransactions = filter === 'all'
    ? transactionStore.transactions
    : transactionStore.transactions.filter(t => t.type === filter);

  const filteredCategories = categoryStore.categories.filter(c => c.type === type);

  const resetForm = () => {
    setEditingTransaction(null);
    setTitle('');
    setAmount('');
    setType('expense');
    setCategoryId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (transaction: any) => {
    setEditingTransaction(transaction);
    setTitle(transaction.title);
    setAmount(String(transaction.amount));
    setType(transaction.type);
    setCategoryId(transaction.category?.id || null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !amount) {
      Alert.alert('Erro', 'Título e valor são obrigatórios');
      return;
    }
    
    const data = {
      title: title.trim(),
      amount: parseFloat(amount),
      type,
      categoryId: categoryId || undefined,
    };

    if (editingTransaction) {
      await transactionStore.updateTransaction(editingTransaction.id, data);
    } else {
      await transactionStore.createTransaction(data);
    }
    
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (id: string, txTitle: string) => {
    Alert.alert(
      'Excluir Transação',
      `Deseja excluir "${txTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => transactionStore.deleteTransaction(id) },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todas' : f === 'income' ? 'Receitas' : 'Despesas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {transactionStore.loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.transactionCard}
              onPress={() => openEditModal(item)}
              onLongPress={() => handleDelete(item.id, item.title)}
            >
              <View style={[styles.typeIndicator, { backgroundColor: item.type === 'income' ? '#22c55e' : '#ef4444' }]} />
              <View style={styles.transactionContent}>
                <Text style={styles.transactionTitle}>{item.title}</Text>
                <Text style={styles.transactionCategory}>{item.category?.name || 'Sem categoria'}</Text>
                <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={[styles.transactionAmount, { color: item.type === 'income' ? '#22c55e' : '#ef4444' }]}>
                {item.type === 'income' ? '+' : '-'} R$ {Number(item.amount).toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Botão Adicionar */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal Criar/Editar */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Título"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Valor"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]}
                onPress={() => { setType('income'); setCategoryId(null); }}
              >
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Receita</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]}
                onPress={() => { setType('expense'); setCategoryId(null); }}
              >
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Despesa</Text>
              </TouchableOpacity>
            </View>

            {/* Seletor de Categoria */}
            <Text style={styles.sectionLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <TouchableOpacity
                style={[styles.categoryChip, !categoryId && styles.categoryChipActive]}
                onPress={() => setCategoryId(null)}
              >
                <Text style={[styles.categoryChipText, !categoryId && styles.categoryChipTextActive]}>Nenhuma</Text>
              </TouchableOpacity>
              {filteredCategories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipActive, { borderColor: cat.color || '#ccc' }]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <View style={[styles.categoryDot, { backgroundColor: cat.color || '#ccc' }]} />
                  <Text style={[styles.categoryChipText, categoryId === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filterRow: { flexDirection: 'row', padding: 10, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e5e5e5', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#3b82f6' },
  filterText: { color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 16 },
  transactionCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 10, marginVertical: 5, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: 'center' },
  typeIndicator: { width: 4, height: '100%' },
  transactionContent: { flex: 1, padding: 12 },
  transactionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  transactionCategory: { fontSize: 12, color: '#888', marginTop: 2 },
  transactionDate: { fontSize: 11, color: '#aaa', marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', paddingRight: 15 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#e5e5e5', alignItems: 'center' },
  typeBtnIncome: { backgroundColor: '#22c55e' },
  typeBtnExpense: { backgroundColor: '#ef4444' },
  typeBtnText: { color: '#666', fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  categoryScroll: { marginBottom: 20 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8, borderWidth: 2, borderColor: '#e5e7eb' },
  categoryChipActive: { backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
  categoryChipText: { fontSize: 14, color: '#666' },
  categoryChipTextActive: { color: '#1d4ed8', fontWeight: '600' },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#e5e5e5', alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3b82f6', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});