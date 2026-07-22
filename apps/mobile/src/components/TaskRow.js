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
    gap: 13,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  status: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 999,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 5,
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
    letterSpacing: -0.2,
  },
  due: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  dueText: {
    color: theme.colors.text3,
    fontSize: 11.5,
  },
  meta: {
    color: theme.colors.text2,
    fontSize: 12.5,
  },
  note: {
    color: theme.colors.text3,
    fontSize: 12,
  },
})

let styles = createStyles(theme)
