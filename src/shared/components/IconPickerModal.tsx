import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, shape, spacing, typography } from '@theme/tokens';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type IconPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (iconName: IconName) => void;
  selectedIcon?: IconName;
};

type IconEntry = {
  name: IconName;
  keywords: string[];
};

const CURATED_ICONS: IconEntry[] = [
  // Education & School
  { name: 'school', keywords: ['school', 'education', 'class'] },
  { name: 'school-outline', keywords: ['school', 'education', 'class'] },
  { name: 'book-open-variant', keywords: ['book', 'read', 'study'] },
  { name: 'book-open-page-variant-outline', keywords: ['book', 'read', 'study'] },
  { name: 'bookshelf', keywords: ['books', 'library', 'study'] },
  { name: 'notebook-outline', keywords: ['notebook', 'notes', 'write'] },
  { name: 'clipboard-text-outline', keywords: ['clipboard', 'list', 'notes'] },
  { name: 'pencil-outline', keywords: ['pencil', 'edit', 'write'] },
  { name: 'lead-pencil', keywords: ['pencil', 'write', 'draw'] },
  { name: 'account-school-outline', keywords: ['graduation', 'degree', 'academic'] },
  { name: 'certificate-outline', keywords: ['certificate', 'award', 'diploma'] },
  { name: 'book-outline', keywords: ['book', 'read', 'textbook'] },
  { name: 'book-education-outline', keywords: ['book', 'education', 'learn'] },
  { name: 'human-male-board', keywords: ['teacher', 'board', 'lecture', 'presentation'] },
  { name: 'calculator-variant-outline', keywords: ['calculator', 'math', 'numbers'] },
  { name: 'flask-outline', keywords: ['flask', 'science', 'chemistry', 'lab'] },
  { name: 'atom', keywords: ['atom', 'science', 'physics'] },
  { name: 'microscope', keywords: ['microscope', 'science', 'biology', 'lab'] },
  { name: 'laptop', keywords: ['laptop', 'computer', 'technology'] },
  { name: 'desktop-classic', keywords: ['computer', 'desktop', 'technology'] },
  { name: 'translate', keywords: ['translate', 'language', 'foreign'] },

  // Sports & Fitness
  { name: 'soccer', keywords: ['soccer', 'football', 'sport', 'ball'] },
  { name: 'basketball', keywords: ['basketball', 'sport', 'ball'] },
  { name: 'tennis', keywords: ['tennis', 'sport', 'racket'] },
  { name: 'volleyball', keywords: ['volleyball', 'sport', 'ball'] },
  { name: 'baseball', keywords: ['baseball', 'sport', 'ball'] },
  { name: 'football', keywords: ['football', 'american', 'sport'] },
  { name: 'trophy-outline', keywords: ['trophy', 'winner', 'award', 'competition'] },
  { name: 'medal-outline', keywords: ['medal', 'award', 'winner'] },
  { name: 'run', keywords: ['run', 'athletics', 'track'] },
  { name: 'swim', keywords: ['swim', 'pool', 'water'] },
  { name: 'bike', keywords: ['bike', 'cycling', 'bicycle'] },
  { name: 'dumbbell', keywords: ['gym', 'fitness', 'weight', 'exercise'] },
  { name: 'karate', keywords: ['karate', 'martial', 'arts', 'combat'] },
  { name: 'fencing', keywords: ['fencing', 'sword', 'sport'] },
  { name: 'yoga', keywords: ['yoga', 'meditation', 'stretch'] },
  { name: 'boxing-glove', keywords: ['boxing', 'fight', 'sport'] },
  { name: 'table-tennis', keywords: ['ping', 'pong', 'table', 'tennis'] },
  { name: 'hockey-sticks', keywords: ['hockey', 'sport', 'stick'] },
  { name: 'golf', keywords: ['golf', 'sport', 'club'] },
  { name: 'rowing', keywords: ['rowing', 'boat', 'water'] },
  { name: 'weight-lifter', keywords: ['weightlifting', 'gym', 'strength'] },
  { name: 'whistle-outline', keywords: ['whistle', 'coach', 'referee'] },
  { name: 'badminton', keywords: ['badminton', 'shuttlecock', 'sport'] },
  { name: 'cricket', keywords: ['cricket', 'bat', 'sport'] },
  { name: 'rugby', keywords: ['rugby', 'sport', 'ball'] },
  { name: 'sail-boat', keywords: ['sailing', 'boat', 'water', 'sport'] },
  { name: 'ski', keywords: ['ski', 'snow', 'winter', 'sport'] },
  { name: 'snowboard', keywords: ['snowboard', 'snow', 'winter', 'sport'] },
  { name: 'skateboarding', keywords: ['skateboard', 'skate', 'sport'] },
  { name: 'handball', keywords: ['handball', 'sport', 'ball'] },
  { name: 'scoreboard-outline', keywords: ['scoreboard', 'score', 'game', 'match'] },
  { name: 'podium-gold', keywords: ['podium', 'winner', 'first', 'place'] },
  { name: 'shoe-sneaker', keywords: ['sneaker', 'shoe', 'running', 'sport'] },
  { name: 'racing-helmet', keywords: ['helmet', 'racing', 'motorsport'] },

  // People
  { name: 'account-outline', keywords: ['person', 'user', 'profile'] },
  { name: 'account-group-outline', keywords: ['group', 'team', 'people'] },
  { name: 'account-plus-outline', keywords: ['add', 'person', 'new'] },
  { name: 'account-edit-outline', keywords: ['edit', 'person', 'update'] },
  { name: 'account-supervisor-outline', keywords: ['supervisor', 'coach', 'teacher'] },
  { name: 'human-greeting-variant', keywords: ['hello', 'wave', 'greeting'] },
  { name: 'account-child-outline', keywords: ['child', 'kid', 'youth', 'junior'] },
  { name: 'account-heart-outline', keywords: ['person', 'heart', 'care'] },
  { name: 'human-male-female-child', keywords: ['family', 'parent', 'child'] },
  { name: 'account-tie-outline', keywords: ['professional', 'business', 'formal'] },
  { name: 'face-man-outline', keywords: ['face', 'man', 'avatar'] },
  { name: 'face-woman-outline', keywords: ['face', 'woman', 'avatar'] },

  // Places & Location
  { name: 'map-marker-outline', keywords: ['location', 'place', 'pin'] },
  { name: 'office-building-outline', keywords: ['building', 'office', 'venue'] },
  { name: 'home-outline', keywords: ['home', 'house', 'base'] },
  { name: 'stadium-variant', keywords: ['stadium', 'arena', 'field'] },
  { name: 'hospital-building', keywords: ['hospital', 'medical', 'health'] },
  { name: 'city-variant-outline', keywords: ['city', 'urban', 'buildings'] },
  { name: 'domain', keywords: ['building', 'domain', 'venue'] },
  { name: 'warehouse', keywords: ['warehouse', 'storage', 'facility'] },
  { name: 'tent', keywords: ['tent', 'outdoor', 'camp'] },
  { name: 'beach', keywords: ['beach', 'sand', 'ocean', 'outdoor'] },
  { name: 'pool', keywords: ['pool', 'swimming', 'water'] },
  { name: 'map-outline', keywords: ['map', 'directions', 'navigate'] },

  // Schedule & Time
  { name: 'calendar-month', keywords: ['calendar', 'month', 'date'] },
  { name: 'calendar-month-outline', keywords: ['calendar', 'month', 'date'] },
  { name: 'clock-outline', keywords: ['clock', 'time', 'schedule'] },
  { name: 'alarm', keywords: ['alarm', 'reminder', 'alert'] },
  { name: 'timer-outline', keywords: ['timer', 'countdown', 'stopwatch'] },
  { name: 'calendar-check-outline', keywords: ['calendar', 'check', 'confirmed', 'event'] },
  { name: 'calendar-star', keywords: ['calendar', 'star', 'event', 'special'] },
  { name: 'clock-fast', keywords: ['clock', 'fast', 'quick', 'time'] },
  { name: 'calendar-clock', keywords: ['calendar', 'clock', 'schedule', 'reminder'] },
  { name: 'update', keywords: ['update', 'refresh', 'sync', 'time'] },

  // Communication
  { name: 'email-outline', keywords: ['email', 'mail', 'message'] },
  { name: 'phone-outline', keywords: ['phone', 'call', 'contact'] },
  { name: 'message-text-outline', keywords: ['message', 'chat', 'text'] },
  { name: 'bell-outline', keywords: ['notification', 'bell', 'alert'] },
  { name: 'bullhorn-outline', keywords: ['announcement', 'bullhorn', 'megaphone'] },
  { name: 'chat-outline', keywords: ['chat', 'conversation', 'talk'] },
  { name: 'forum-outline', keywords: ['forum', 'discussion', 'community'] },
  { name: 'send-outline', keywords: ['send', 'submit', 'share'] },
  { name: 'share-variant-outline', keywords: ['share', 'social', 'link'] },

  // Actions & Status
  { name: 'check-circle-outline', keywords: ['check', 'done', 'complete', 'success'] },
  { name: 'star-outline', keywords: ['star', 'favorite', 'rating'] },
  { name: 'heart-outline', keywords: ['heart', 'love', 'favorite'] },
  { name: 'flag-outline', keywords: ['flag', 'mark', 'important'] },
  { name: 'lightning-bolt-outline', keywords: ['lightning', 'fast', 'energy'] },
  { name: 'target', keywords: ['target', 'goal', 'aim'] },
  { name: 'chart-line', keywords: ['chart', 'graph', 'progress', 'analytics'] },
  { name: 'fire', keywords: ['fire', 'hot', 'streak'] },
  { name: 'thumb-up-outline', keywords: ['thumbs', 'up', 'like', 'good'] },
  { name: 'thumb-down-outline', keywords: ['thumbs', 'down', 'dislike', 'bad'] },
  { name: 'chart-bar', keywords: ['chart', 'bar', 'stats', 'data'] },
  { name: 'chart-pie', keywords: ['chart', 'pie', 'analytics', 'data'] },
  { name: 'trending-up', keywords: ['trending', 'up', 'growth', 'increase'] },
  { name: 'eye-outline', keywords: ['eye', 'view', 'visible', 'watch'] },
  { name: 'bookmark-outline', keywords: ['bookmark', 'save', 'later'] },
  { name: 'pin-outline', keywords: ['pin', 'attach', 'mark'] },

  // Music & Arts
  { name: 'music-note', keywords: ['music', 'note', 'song'] },
  { name: 'palette-outline', keywords: ['palette', 'art', 'color', 'paint'] },
  { name: 'drama-masks', keywords: ['drama', 'theater', 'acting'] },
  { name: 'camera-outline', keywords: ['camera', 'photo', 'picture'] },
  { name: 'music-note-outline', keywords: ['music', 'note', 'melody'] },
  { name: 'piano', keywords: ['piano', 'keyboard', 'music', 'instrument'] },
  { name: 'guitar-acoustic', keywords: ['guitar', 'acoustic', 'music', 'instrument'] },
  { name: 'violin', keywords: ['violin', 'string', 'music', 'instrument'] },
  { name: 'microphone-variant', keywords: ['microphone', 'sing', 'vocal', 'voice'] },
  { name: 'brush', keywords: ['brush', 'paint', 'art', 'draw'] },
  { name: 'spray', keywords: ['spray', 'graffiti', 'art'] },
  { name: 'movie-outline', keywords: ['movie', 'film', 'video', 'cinema'] },
  { name: 'image-outline', keywords: ['image', 'photo', 'picture', 'gallery'] },
  { name: 'headphones', keywords: ['headphones', 'audio', 'music', 'listen'] },

  // Nature & Weather
  { name: 'weather-sunny', keywords: ['sun', 'sunny', 'outdoor'] },
  { name: 'tree-outline', keywords: ['tree', 'nature', 'park'] },
  { name: 'leaf', keywords: ['leaf', 'nature', 'eco'] },
  { name: 'water-outline', keywords: ['water', 'pool', 'aqua'] },
  { name: 'flower-outline', keywords: ['flower', 'garden', 'nature'] },
  { name: 'pine-tree', keywords: ['pine', 'tree', 'forest', 'nature'] },
  { name: 'image-filter-hdr', keywords: ['mountain', 'hiking', 'outdoor', 'nature'] },
  { name: 'earth', keywords: ['earth', 'globe', 'world', 'planet'] },
  { name: 'snowflake', keywords: ['snowflake', 'snow', 'winter', 'cold'] },
  { name: 'white-balance-sunny', keywords: ['sun', 'bright', 'outdoor'] },
  { name: 'paw', keywords: ['paw', 'animal', 'pet'] },
  { name: 'fish', keywords: ['fish', 'aquatic', 'fishing'] },

  // Objects & Tools
  { name: 'shield-check-outline', keywords: ['shield', 'security', 'safety'] },
  { name: 'rocket-launch-outline', keywords: ['rocket', 'launch', 'start'] },
  { name: 'puzzle-outline', keywords: ['puzzle', 'game', 'strategy'] },
  { name: 'cog-outline', keywords: ['settings', 'gear', 'config'] },
  { name: 'tools', keywords: ['tools', 'wrench', 'fix'] },
  { name: 'compass-outline', keywords: ['compass', 'navigate', 'direction'] },
  { name: 'key-outline', keywords: ['key', 'lock', 'access', 'security'] },
  { name: 'lock-outline', keywords: ['lock', 'secure', 'private'] },
  { name: 'lightbulb-outline', keywords: ['lightbulb', 'idea', 'creative', 'innovation'] },
  { name: 'crown-outline', keywords: ['crown', 'king', 'queen', 'royal', 'premium'] },
  { name: 'dice-multiple-outline', keywords: ['dice', 'game', 'random', 'play'] },
  { name: 'controller-classic-outline', keywords: ['controller', 'game', 'play', 'gaming'] },
  { name: 'cube-outline', keywords: ['cube', 'box', '3d', 'shape'] },
  { name: 'glasses', keywords: ['glasses', 'vision', 'read'] },
  { name: 'binoculars', keywords: ['binoculars', 'search', 'explore', 'discover'] },
  { name: 'paperclip', keywords: ['paperclip', 'attach', 'document'] },
  { name: 'coffee-outline', keywords: ['coffee', 'cafe', 'drink', 'break'] },
  { name: 'food-apple-outline', keywords: ['apple', 'food', 'health', 'fruit'] },

  // Health & Wellness
  { name: 'heart-pulse', keywords: ['heart', 'pulse', 'health', 'cardio'] },
  { name: 'medical-bag', keywords: ['medical', 'health', 'first', 'aid'] },
  { name: 'stethoscope', keywords: ['stethoscope', 'doctor', 'medical'] },
  { name: 'pill', keywords: ['pill', 'medicine', 'health'] },
  { name: 'meditation', keywords: ['meditation', 'mindfulness', 'zen', 'calm'] },
  { name: 'hand-heart-outline', keywords: ['care', 'help', 'volunteer', 'charity'] },
];

const COLUMN_COUNT = 5;

export const IconPickerModal = ({ visible, onClose, onSelect, selectedIcon }: IconPickerModalProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return CURATED_ICONS;
    const query = search.trim().toLowerCase();
    return CURATED_ICONS.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query) ||
        entry.keywords.some((kw) => kw.includes(query)),
    );
  }, [search]);

  const handleSelect = useCallback(
    (iconName: IconName) => {
      onSelect(iconName);
      onClose();
      setSearch('');
    },
    [onSelect, onClose],
  );

  const handleClose = useCallback(() => {
    onClose();
    setSearch('');
  }, [onClose]);

  const renderItem = useCallback(
    ({ item }: { item: IconEntry }) => {
      const isActive = item.name === selectedIcon;
      return (
        <Pressable
          style={[styles.iconCell, isActive && styles.iconCellActive]}
          onPress={() => handleSelect(item.name)}
          accessibilityRole="button"
          accessibilityLabel={item.name.replace(/-/g, ' ')}>
          <MaterialCommunityIcons
            name={item.name}
            size={28}
            color={isActive ? palette.primary : palette.onSurface}
          />
        </Pressable>
      );
    },
    [selectedIcon, handleSelect],
  );

  const keyExtractor = useCallback((item: IconEntry) => item.name, []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('classes.choose_icon')}</Text>
          <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={24} color={palette.onSurface} />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={palette.onSurfaceMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('classes.search_icons')}
            placeholderTextColor={palette.onSurfaceMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={palette.onSurfaceMuted} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={filteredIcons}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('classes.no_icons_match')}</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.outlineVariant,
    backgroundColor: palette.surface,
  },
  headerTitle: {
    ...typography.titleLarge,
    color: palette.onSurface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: shape.small,
    borderWidth: 1,
    borderColor: palette.surfaceDim,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 48,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: palette.onSurface,
    paddingVertical: 0,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  iconCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shape.small,
    margin: spacing.xs,
  },
  iconCellActive: {
    backgroundColor: palette.primaryContainer,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: palette.onSurfaceMuted,
  },
});
