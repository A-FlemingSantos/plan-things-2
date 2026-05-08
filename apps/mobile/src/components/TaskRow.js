import { StyleSheet, Text, View } from 'react-native'
import { Clock3 } from 'lucide-react-native'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

export default function TaskRow({ task }) {
  styles = useThemedStyles(createStyles)
  return (
    <View style={styles.row}>
      <View style={[styles.status, { backgroundColor: task.accent }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
          {task.due ? (
            <View style={styles.due}>
              <Clock3 size={12} color={theme.colors.text3} strokeWidth={1.8} />
              <Text style={styles.dueText}>{task.due}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>{task.plan}</Text>
        <Text style={styles.note} numberOfLines={1}>{task.status} · {task.meta}</Text>
      </View>
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
  },
  status: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 999,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  due: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  dueText: {
    color: theme.colors.text3,
    fontSize: 11,
  },
  meta: {
    color: theme.colors.text2,
    fontSize: 12,
  },
  note: {
    color: theme.colors.text3,
    fontSize: 12,
  },
})

let styles = createStyles(theme)
