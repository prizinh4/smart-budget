import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { categoryStore } from '../stores/CategoryStore';
import { Category, CreateCategoryDto } from '../services/api';

const COLORS = ['#4CAF50', '#2196F3', '#FF5722', '#9C27B0', '#FF9800', '#607D8B'];

export const CategoryListScreen = observer(() => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    categoryStore.fetchCategories();
  }, []);

  const filteredCategories = filter === 'all' 
    ? categoryStore.categories 
    : categoryStore.categories.filter(c => c.type === filter);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setType('expense');
    setSelectedColor(COLORS[0]);
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setType(category.type);
    setSelectedColor(category.color || COLORS[0]);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    const data: CreateCategoryDto = {
      name: name.trim(),
      type,
      color: selectedColor,
    };

    if (editingCategory) {
      await categoryStore.updateCategory(editingCategory.id, data);
    } else {
      await categoryStore.createCategory(data);
    }

    setModalVisible(false);
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => categoryStore.deleteCategory(category.id),
        },
      ]
    );
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryItem, { borderLeftColor: item.color || '#ccc' }]}
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={[styles.categoryType, { color: item.type === 'income' ? '#4CAF50' : '#f44336' }]}>
          {item.type.toUpperCase()}
        </Text>
      </View>
      <View style={[styles.colorDot, { backgroundColor: item.color || '#ccc' }]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {categoryStore.loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loading} />
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No categories yet. Tap + to add one.</Text>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Category name"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                onPress={() => setType('expense')}
              >
                <Text style={type === 'expense' ? styles.typeTextActive : styles.typeText}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.typeButtonActiveIncome]}
                onPress={() => setType('income')}
              >
                <Text style={type === 'income' ? styles.typeTextActive : styles.typeText}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.colorLabel}>Color:</Text>
            <View style={styles.colorRow}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
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
  filterRow: { flexDirection: 'row', padding: 16, gap: 8 },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  filterButtonActive: { backgroundColor: '#4CAF50' },
  filterText: { color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  loading: { marginTop: 50 },
  categoryItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: '500' },
  categoryType: { fontSize: 12, marginTop: 4 },
  colorDot: { width: 20, height: 20, borderRadius: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 30 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: '#f44336' },
  typeButtonActiveIncome: { backgroundColor: '#4CAF50' },
  typeText: { color: '#666' },
  typeTextActive: { color: '#fff', fontWeight: 'bold' },
  colorLabel: { marginBottom: 8, color: '#666' },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorOption: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: '#000' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelText: { color: '#666' },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: 'bold' },
});
