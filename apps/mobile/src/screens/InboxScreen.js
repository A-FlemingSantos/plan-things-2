import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Lock, Send } from 'lucide-react-native'
import ScreenHeader from '../components/ScreenHeader'
import { inboxItems } from '../data/demoData'
import { theme } from '../theme/tokens'

export default function InboxScreen() {
  const [message, setMessage] = useState('Resumo rápido para o time...')

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="Comunicação" title="Inbox" meta={`${inboxItems.length} envios`} />

      <View style={styles.composer}>
        <Text style={styles.composerLabel}>Mensagem rápida</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          style={styles.input}
          multiline
          placeholder="Escreva um resumo curto..."
          placeholderTextColor={theme.colors.text3}
        />
        <Pressable style={styles.sendButton}>
          <Send size={15} color={theme.colors.white} strokeWidth={1.8} />
          <Text style={styles.sendButtonText}>Preparar envio</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Histórico</Text>
        <View style={styles.privateNote}>
          <Lock size={12} color={theme.colors.text3} strokeWidth={1.8} />
          <Text style={styles.privateText}>demo</Text>
        </View>
      </View>

      <View style={styles.list}>
        {inboxItems.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.itemTime}>{item.time}</Text>
            </View>
            <Text style={styles.itemRecipients} numberOfLines={1}>{item.recipients}</Text>
            <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
            <Text style={styles.itemSender}>Enviado por {item.sentBy}</Text>
          </View>
        ))}
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
  composer: {
    gap: 10,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    marginBottom: theme.spacing.section,
  },
  composerLabel: {
    color: theme.colors.text3,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    minHeight: 78,
    color: theme.colors.text1,
    fontSize: 14,
    lineHeight: 19,
    textAlignVertical: 'top',
  },
  sendButton: {
    height: 38,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: theme.colors.text1,
  },
  sendButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    color: theme.colors.text1,
    fontSize: 16,
    fontWeight: '600',
  },
  privateNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  privateText: {
    color: theme.colors.text3,
    fontSize: 12,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border1,
  },
  item: {
    gap: 5,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemTitle: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  itemTime: {
    color: theme.colors.text3,
    fontSize: 11,
  },
  itemRecipients: {
    color: theme.colors.text2,
    fontSize: 12,
  },
  itemMessage: {
    color: theme.colors.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  itemSender: {
    color: theme.colors.text3,
    fontSize: 11,
  },
})
