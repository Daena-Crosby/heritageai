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
import { Story, Illustration } from '../services/api';

interface StorybookModeProps {
  story: Story;
}

const { width } = Dimensions.get('window');

export const StorybookMode: React.FC<StorybookModeProps> = ({ story }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const translation = story.translations?.[0];
  const illustrations = story.illustrations || [];

  if (!translation) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No translation available</Text>
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
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No content available</Text>
      </View>
    );
  }

  const currentPageData = pages[currentPage];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          {currentPageData.illustration && (
            <Image
              source={{ uri: currentPageData.illustration }}
              style={styles.illustration}
              resizeMode="cover"
            />
          )}
          <View style={styles.textContainer}>
            <Text style={styles.pageText}>{currentPageData.text}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
          onPress={goToPreviousPage}
          disabled={currentPage === 0}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          {currentPage + 1} / {pages.length}
        </Text>

        <TouchableOpacity
          style={[
            styles.navButton,
            currentPage === pages.length - 1 && styles.navButtonDisabled,
          ]}
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
    backgroundColor: '#FFF8E7',
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
    backgroundColor: '#F0F0F0',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    minHeight: 200,
  },
  pageText: {
    fontSize: 20,
    lineHeight: 32,
    color: '#333',
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#8B4513',
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#CCC',
  },
  navButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pageIndicator: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
});
