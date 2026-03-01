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
  ScrollView,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { goalStore, Contribution } from '../stores/GoalStore';
import { Goal, CreateGoalDto } from '../services/api';

const COLORS = ['#4CAF50', '#2196F3', '#FF5722', '#9C27B0', '#FF9800', '#E91E63'];

export const GoalListScreen = observer(() => {
  const [modalVisible, setModalVisible] = useState(false);
  const [contributeModalVisible, setContributeModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionDescription, setContributionDescription] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    goalStore.fetchGoals();
  }, []);

  const filteredGoals = filter === 'all'
    ? goalStore.goals
    : goalStore.goals.filter(g => g.status === filter);

  const openCreateModal = () => {
    setSelectedGoal(null);
    setName('');
    setDescription('');
    setTargetAmount('');
    setDeadline('');
    setSelectedColor(COLORS[0]);
    setModalVisible(true);
  };

  const openEditModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setName(goal.name);
    setDescription(goal.description || '');
    setTargetAmount(String(goal.targetAmount));
    setDeadline(goal.deadline || '');
    setSelectedColor(goal.color || COLORS[0]);
    setModalVisible(true);
  };

  const openContributeModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setContributionAmount('');
    setContributionDescription('');
    setContributeModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !targetAmount) {
      Alert.alert('Error', 'Name and target amount are required');
      return;
    }

    const data: CreateGoalDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      targetAmount: parseFloat(targetAmount),
      deadline: deadline || undefined,
      color: selectedColor,
    };

    if (selectedGoal) {
      await goalStore.updateGoal(selectedGoal.id, data);
    } else {
      await goalStore.createGoal(data);
    }

    setModalVisible(false);
  };

  const handleContribute = async () => {
    if (!contributionAmount || !selectedGoal) return;

    const amount = parseFloat(contributionAmount);
    if (amount <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }

    await goalStore.addContribution(
      selectedGoal.id,
      amount,
      contributionDescription.trim() || undefined
    );
    setContributeModalVisible(false);
    Alert.alert(
      'Contribution Added',
      `R$ ${amount.toFixed(2)} was added to "${selectedGoal.name}" and recorded as an expense.`
    );
  };

  const openHistoryModal = async (goal: Goal) => {
    setSelectedGoal(goal);
    const data = await goalStore.getContributions(goal.id);
    setContributions(data);
    setHistoryModalVisible(true);
  };

  const handleRemoveContribution = (contribution: Contribution) => {
    if (!selectedGoal) return;
    
    Alert.alert(
      'Undo Contribution',
      `Remove "${contribution.title}" (R$ ${Number(contribution.amount).toFixed(2)})?\n\nThis will add the amount back to your balance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedGoal = await goalStore.removeContribution(selectedGoal.id, contribution.id);
            if (updatedGoal) {
              setContributions(contributions.filter(c => c.id !== contribution.id));
              Alert.alert('Removed', 'Contribution was removed and your balance was updated.');
            }
          },
        },
      ]
    );
  };

  const handleSyncGoal = async () => {
    if (!selectedGoal) return;
    
    const success = await goalStore.syncExistingAmount(selectedGoal.id);
    if (success) {
      const data = await goalStore.getContributions(selectedGoal.id);
      setContributions(data);
      Alert.alert(
        'Synced',
        'Existing amount was converted to a tracked contribution. Your balance has been updated.'
      );
    }
  };

  const handleDelete = (goal: Goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => goalStore.deleteGoal(goal.id),
        },
      ]
    );
  };

  const getProgress = (goal: Goal) => {
    const current = Number(goal.currentAmount);
    const target = Number(goal.targetAmount);
    return target > 0 ? Math.min(100, (current / target) * 100) : 0;
  };

  const formatCurrency = (value: number) => {
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const renderGoal = ({ item }: { item: Goal }) => {
    const progress = getProgress(item);
    const isCompleted = item.status === 'completed';

    return (
      <TouchableOpacity
        style={[styles.goalItem, isCompleted && styles.goalCompleted]}
        onPress={() => openEditModal(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.goalHeader}>
          <View style={[styles.goalColor, { backgroundColor: item.color || '#4CAF50' }]} />
          <Text style={styles.goalName}>{item.name}</Text>
          {isCompleted && <Text style={styles.completedBadge}>✓</Text>}
        </View>

        {item.description && (
          <Text style={styles.goalDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: isCompleted ? '#4CAF50' : item.color || '#2196F3',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        <View style={styles.goalFooter}>
          <Text style={styles.amountText}>
            {formatCurrency(item.currentAmount)} / {formatCurrency(item.targetAmount)}
          </Text>
          {item.deadline && (
            <Text style={styles.deadlineText}>
              📅 {new Date(item.deadline).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </View>

        <View style={styles.goalActions}>
          {item.status === 'active' && (
            <TouchableOpacity
              style={styles.contributeButton}
              onPress={() => openContributeModal(item)}
            >
              <Text style={styles.contributeText}>+ Contribute</Text>
            </TouchableOpacity>
          )}
          {Number(item.currentAmount) > 0 && (
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => openHistoryModal(item)}
            >
              <Text style={styles.historyText}>📜 History</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Overall Progress</Text>
        <Text style={styles.summaryValue}>{goalStore.totalProgress}%</Text>
        <Text style={styles.summarySubtitle}>
          {goalStore.activeGoals.length} active · {goalStore.completedGoals.length} completed
        </Text>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'active', 'completed'] as const).map((f) => (
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

      {goalStore.loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loading} />
      ) : (
        <FlatList
          data={filteredGoals}
          keyExtractor={(item) => item.id}
          renderItem={renderGoal}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No goals yet. Tap + to create one!</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedGoal ? 'Edit Goal' : 'New Goal'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Goal name"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            <TextInput
              style={styles.input}
              placeholder="Target amount"
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Deadline (YYYY-MM-DD)"
              value={deadline}
              onChangeText={setDeadline}
            />

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

      {/* Contribute Modal */}
      <Modal visible={contributeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Contribution</Text>
            {selectedGoal && (
              <Text style={styles.contributeInfo}>
                Current: {formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)}
              </Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="Amount to add"
              value={contributionAmount}
              onChangeText={setContributionAmount}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={contributionDescription}
              onChangeText={setContributionDescription}
            />

            <Text style={styles.contributeHint}>
              This will create an expense transaction
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setContributeModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleContribute}>
                <Text style={styles.saveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={historyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contribution History</Text>
            {selectedGoal && (
              <Text style={styles.contributeInfo}>
                {selectedGoal.name} - {formatCurrency(selectedGoal.currentAmount)}
              </Text>
            )}

            {contributions.length === 0 ? (
              <View style={styles.emptyHistoryContainer}>
                <Text style={styles.emptyHistory}>No contributions recorded yet.</Text>
                {selectedGoal && Number(selectedGoal.currentAmount) > 0 && (
                  <View style={styles.syncContainer}>
                    <Text style={styles.syncHint}>
                      You have {formatCurrency(selectedGoal.currentAmount)} not tracked.
                    </Text>
                    <TouchableOpacity
                      style={styles.syncButton}
                      onPress={handleSyncGoal}
                    >
                      <Text style={styles.syncText}>🔄 Sync existing amount</Text>
                    </TouchableOpacity>
                    <Text style={styles.syncWarning}>
                      This will create an expense transaction and affect your balance.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <ScrollView style={styles.contributionsList}>
                {contributions.map((c) => (
                  <View key={c.id} style={styles.contributionItem}>
                    <View style={styles.contributionInfo}>
                      <Text style={styles.contributionTitle}>{c.title}</Text>
                      <Text style={styles.contributionDate}>
                        {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <View style={styles.contributionRight}>
                      <Text style={styles.contributionAmount}>
                        {formatCurrency(c.amount)}
                      </Text>
                      <TouchableOpacity
                        style={styles.undoButton}
                        onPress={() => handleRemoveContribution(c)}
                      >
                        <Text style={styles.undoText}>Undo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.cancelButton, { marginTop: 16 }]}
              onPress={() => setHistoryModalVisible(false)}
            >
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  summaryCard: {
    backgroundColor: '#4CAF50',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryTitle: { color: '#fff', fontSize: 14, opacity: 0.9 },
  summaryValue: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  summarySubtitle: { color: '#fff', fontSize: 12, opacity: 0.8, marginTop: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
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
  listContent: { paddingBottom: 80 },
  goalItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 2,
  },
  goalCompleted: { opacity: 0.8 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  goalColor: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  goalName: { fontSize: 18, fontWeight: '600', flex: 1 },
  completedBadge: { color: '#4CAF50', fontSize: 18 },
  goalDescription: { color: '#666', marginBottom: 8 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '500', width: 45, textAlign: 'right' },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  amountText: { color: '#333', fontWeight: '500' },
  deadlineText: { color: '#666', fontSize: 12 },
  goalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  contributeButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  contributeText: { color: '#2196F3', fontWeight: '500' },
  historyButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  historyText: { color: '#FF9800', fontWeight: '500' },
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
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  contributeInfo: { color: '#666', marginBottom: 16 },
  contributeHint: { color: '#888', fontSize: 12, fontStyle: 'italic', marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: { height: 60, textAlignVertical: 'top' },
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
  emptyHistoryContainer: { alignItems: 'center', paddingVertical: 10 },
  emptyHistory: { textAlign: 'center', color: '#999', marginBottom: 10 },
  syncContainer: { alignItems: 'center', marginTop: 10, padding: 16, backgroundColor: '#fff8e1', borderRadius: 8 },
  syncHint: { color: '#f57c00', fontWeight: '500', marginBottom: 12, textAlign: 'center' },
  syncButton: { backgroundColor: '#ff9800', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  syncText: { color: '#fff', fontWeight: 'bold' },
  syncWarning: { color: '#999', fontSize: 11, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  contributionsList: { maxHeight: 300 },
  contributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contributionInfo: { flex: 1 },
  contributionTitle: { fontSize: 14, fontWeight: '500' },
  contributionDate: { fontSize: 12, color: '#999', marginTop: 2 },
  contributionRight: { alignItems: 'flex-end' },
  contributionAmount: { fontSize: 14, fontWeight: '600', color: '#333' },
  undoButton: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  undoText: { color: '#f44336', fontSize: 12, fontWeight: '500' },
});
