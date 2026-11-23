import { StyleSheet } from 'react-native';

export const profileStyles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  title: {
    color: '#172033',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },
  sectionTitle: {
    color: '#172033',
    fontSize: 17,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#EDF0F5',
  },
  metricValue: {
    color: '#172033',
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#8A94A6',
    fontSize: 12,
    marginTop: 4,
  },
  caloriesCard: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: '#EEF3FF',
    paddingVertical: 16,
    alignItems: 'center',
  },
  caloriesValue: {
    color: '#4F7CFF',
    fontSize: 28,
    fontWeight: '800',
  },
  caloriesLabel: {
    color: '#6F7B91',
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    height: 46,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#172033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  inputLabel: {
    color: '#5F6B7A',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 7,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E4E8EF',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#172033',
  },
  previewCard: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#EEF3FF',
    paddingVertical: 14,
    alignItems: 'center',
  },
  previewValue: {
    color: '#4F7CFF',
    fontSize: 24,
    fontWeight: '800',
  },
  previewLabel: {
    color: '#6F7B91',
    fontSize: 12,
  },
  saveButton: {
    height: 46,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#4F7CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    height: 44,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#7A8499',
    fontSize: 13,
    fontWeight: '600',
  },
});
