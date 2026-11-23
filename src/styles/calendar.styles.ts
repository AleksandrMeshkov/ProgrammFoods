import { StyleSheet } from 'react-native';

export const calendarStyles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: '#172033',
    fontSize: 24,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    color: '#4F7CFF',
    fontSize: 28,
    lineHeight: 30,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    color: '#7A8499',
    fontSize: 11,
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: '#8A94A6',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.82,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDF0F5',
    marginBottom: 4,
    paddingTop: 7,
    alignItems: 'center',
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    aspectRatio: 0.82,
  },
  todayCell: {
    borderColor: '#4F7CFF',
  },
  dayNumber: {
    color: '#172033',
    fontSize: 13,
    fontWeight: '700',
  },
  todayNumber: {
    color: '#4F7CFF',
  },
  mealMarks: {
    width: '72%',
    height: 18,
    flexDirection: 'row',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 'auto',
    marginBottom: 6,
  },
  mealMark: {
    flex: 1,
  },
  mealMarkEmpty: {
    backgroundColor: '#EDF0F5',
  },
  breakfast: {
    backgroundColor: '#FFB84D',
  },
  lunch: {
    backgroundColor: '#62B97A',
  },
  dinner: {
    backgroundColor: '#6C86F7',
  },
  dataPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginTop: 14,
    padding: 14,
  },
  dataTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '700',
  },
  rangeNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  rangeArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F3F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeArrowText: {
    color: '#4F7CFF',
    fontSize: 26,
    lineHeight: 28,
  },
  rangeLabel: {
    flex: 1,
    alignItems: 'center',
  },
  rangeLabelText: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  rangeLabelTextSmall: {
    color: '#8A94A6',
    fontSize: 11,
    marginTop: 2,
  },
  lengthRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  lengthButton: {
    flex: 1,
    height: 38,
    marginHorizontal: 3,
    borderRadius: 10,
    backgroundColor: '#F0F3F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthButtonActive: {
    backgroundColor: '#4F7CFF',
  },
  lengthButtonText: {
    color: '#7A8499',
    fontSize: 12,
    fontWeight: '700',
  },
  lengthButtonTextActive: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    height: 44,
    marginHorizontal: 3,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButton: {
    backgroundColor: '#EEF3FF',
  },
  exportButton: {
    backgroundColor: '#172033',
  },
  actionButtonText: {
    color: '#4F7CFF',
    fontSize: 13,
    fontWeight: '700',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23, 32, 51, 0.35)',
  },
  modalSheet: {
    height: '86%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalTitle: {
    color: '#172033',
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#8A94A6',
    fontSize: 12,
    marginTop: 3,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F3F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#5F6B7A',
    fontSize: 24,
    lineHeight: 26,
  },
  modalScroll: {
    flex: 1,
  },
  emptyDayText: {
    color: '#8A94A6',
    textAlign: 'center',
    marginTop: 30,
  },
  mealSection: {
    backgroundColor: '#F7F9FC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mealName: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '700',
  },
  mealCount: {
    color: '#8A94A6',
    fontSize: 12,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E9EDF3',
    paddingTop: 10,
    marginTop: 8,
  },
  entryImage: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  entryImagePlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryImagePlaceholderText: {
    color: '#4F7CFF',
    fontSize: 11,
    fontWeight: '800',
  },
  entryInfo: {
    flex: 1,
    marginHorizontal: 10,
  },
  entryName: {
    color: '#172033',
    fontSize: 13,
    fontWeight: '600',
  },
  entryAmount: {
    color: '#8A94A6',
    fontSize: 12,
    marginTop: 2,
  },
  entryCalories: {
    color: '#5F6B7A',
    fontSize: 12,
  },
});
