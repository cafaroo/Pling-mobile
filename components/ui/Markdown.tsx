import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import MarkdownDisplay from 'react-native-markdown-display';
import { useTheme } from '@/hooks/useTheme';

interface MarkdownProps {
  children: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    body: {
      color: theme.colors.foreground,
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: theme.colors.foreground,
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    heading2: {
      color: theme.colors.foreground,
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    heading3: {
      color: theme.colors.foreground,
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    link: {
      color: theme.colors.primary,
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      paddingLeft: theme.spacing.md,
      marginLeft: 0,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    code_inline: {
      fontFamily: 'monospace',
      backgroundColor: theme.colors.foreground + '10',
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    code_block: {
      fontFamily: 'monospace',
      backgroundColor: theme.colors.foreground + '10',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginVertical: theme.spacing.sm,
    },
    list_item: {
      marginVertical: theme.spacing.xs,
      flexDirection: 'row',
    },
    bullet_list: {
      marginVertical: theme.spacing.sm,
    },
    ordered_list: {
      marginVertical: theme.spacing.sm,
    },
  });

  return (
    <View>
      <MarkdownDisplay
        style={styles}
        onLinkPress={(url) => {
          Linking.openURL(url);
          return false;
        }}
      >
        {children}
      </MarkdownDisplay>
    </View>
  );
};

export type { MarkdownProps }; 