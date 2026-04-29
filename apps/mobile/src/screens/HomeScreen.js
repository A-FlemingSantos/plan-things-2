import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { CheckCircle2, CircleDot, TimerReset } from 'lucide-react-native'
import ScreenHeader from '../components/ScreenHeader'
import TaskRow from '../components/TaskRow'
import { plans, tasks } from '../data/demoData'
import { theme } from '../theme/tokens'

export default function HomeScreen({ session }) {
  const todayTasks = tasks.filter((task) => task.due === 'Hoje')
  const activeTasks = tasks.filter((task) => task.status !== 'Concluído')

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        eyebrow={session.workspace.name}
        title={`Olá, ${session.user.fullName.split(' ')[0]}`}
        meta={`${activeTasks.length} ativas`}
      />

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <TimerReset size={18} color={theme.colors.blue} strokeWidth={1.8} />
          <Text style={styles.summaryValue}>{todayTasks.length}</Text>
          <Text style={styles.summaryLabel}>Hoje</Text>
        </View>
        <View style={styles.summaryItem}>
          <CircleDot size={18} color={theme.colors.purple} strokeWidth={1.8} />
          <Text style={styles.summaryValue}>2</Text>
          <Text style={styles.summaryLabel}>Em foco</Text>
        </View>
        <View style={styles.summaryItem}>
          <CheckCircle2 size={18} color={theme.colors.green} strokeWidth={1.8} />
          <Text style={styles.summaryValue}>1</Text>
          <Text style={styles.summaryLabel}>Feita</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tarefas pontuais</Text>
          <Text style={styles.sectionMeta}>compacto</Text>
        </View>
        {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Planos recentes</Text>
        <View style={styles.planList}>
          {plans.map((plan) => (
            <View key={plan.id} style={styles.planRow}>
              <View style={[styles.planDot, { backgroundColor: plan.color }]} />
              <Text style={styles.planName} numberOfLines={1}>{plan.name}</Text>
              <Text style={styles.planCount}>{plan.tasks}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  content: {
    paddingHorizontal: theme.spacing.screenX,
    paddingBottom: 28,
  },
  summary: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.section,
  },
  summaryItem: {
    flex: 1,
    minHeight: 96,
    justifyContent: 'center',
    gap: 5,
    padding: 13,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
  },
  summaryValue: {
    color: theme.colors.text1,
    fontSize: 24,
    fontWeight: '500',
  },
  summaryLabel: {
    color: theme.colors.text3,
    fontSize: 12,
  },
  section: {
    marginTop: 6,
    marginBottom: theme.spacing.section,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    color: theme.colors.text1,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionMeta: {
    color: theme.colors.text3,
    fontSize: 12,
  },
  planList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border1,
  },
  planRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
  },
  planDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  planName: {
    flex: 1,
    color: theme.colors.text2,
    fontSize: 13,
  },
  planCount: {
    color: theme.colors.text3,
    fontSize: 12,
  },
})
