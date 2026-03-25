import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Story, Illustration } from '../services/api';

interface StorybookModeProps {
  story: Story;
}

const { width } = Dimensions.get('window');

export const StorybookMode: React.FC<StorybookModeProps> = ({ story }) => {
  const { colors: C } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const translation = story.translations?.[0];
  const illustrations = story.illustrations || [];

  if (!translation) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: C.bg }]}>
        <Text style={[styles.errorText, { color: C.textSub }]}>No translation available</Text>
      </View>
    );
  }

  // Split translated text into pages (sentences)
  const sentences = translation.translated_text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0)
    .map((s) => s.trim());

  const pages = sentences.map((sentence, index) => ({
    text: sentence,
    illustration: illustrations[index]?.image_url,
  }));

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (pages.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: C.bg }]}>
        <Text style={[styles.errorText, { color: C.textSub }]}>No content available</Text>
      </View>
    );
  }

  const currentPageData = pages[currentPage];

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          {currentPageData.illustration && (
            <Image
              source={{ uri: currentPageData.illustration }}
              style={[styles.illustration, { backgroundColor: C.surfaceAlt }]}
              resizeMode="cover"
            />
          )}
          <View style={[styles.textContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.pageText, { color: C.text }]}>{currentPageData.text}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.navigation, { backgroundColor: C.sidebar, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: C.orange }, currentPage === 0 && { backgroundColor: C.surfaceAlt }]}
          onPress={goToPreviousPage}
          disabled={currentPage === 0}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
        </TouchableOpacity>

        <Text style={[styles.pageIndicator, { color: C.textSub }]}>
          {currentPage + 1} / {pages.length}
        </Text>

        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: C.orange }, currentPage === pages.length - 1 && { backgroundColor: C.surfaceAlt }]}
          onPress={goToNextPage}
          disabled={currentPage === pages.length - 1}
        >
          <Text style={styles.navButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    flex: 1,
    padding: 20,
  },
  illustration: {
    width: width - 40,
    height: (width - 40) * 0.75,
    borderRadius: 12,
    marginBottom: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    minHeight: 200,
    borderWidth: 1,
  },
  pageText: {
    fontSize: 18,
    lineHeight: 30,
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pageIndicator: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 15,
  },
});
