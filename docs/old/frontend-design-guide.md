# Pling Frontend Design Guide

## Overview

This design guide establishes the visual language, component patterns, and interaction principles for the Pling application. Following these guidelines ensures a consistent, high-quality user experience across all platforms while maintaining the brand identity.

## Brand Identity

### Colors

#### Primary Palette
- **Background Dark**: `#0F0E2A` - Primary app background
- **Background Main**: `#1E1B4B` - Secondary background
- **Background Light**: `#312E81` - Tertiary background
- **Primary Dark**: `#4C1D95` - Dark purple
- **Primary Main**: `#5B21B6` - Main purple
- **Primary Light**: `#7C3AED` - Light purple

#### Accent Colors
- **Yellow**: `#FACC15` - Primary accent, used for CTAs and highlights
- **Pink**: `#EC4899` - Secondary accent, used for special elements

#### Functional Colors
- **Success**: `#10B981` - Positive actions and confirmations
- **Error**: `#EF4444` - Errors and destructive actions

#### Neutral Palette
- **100**: `#F3F4F6` - Lightest gray
- **200**: `#E5E7EB`
- **300**: `#D1D5DB`
- **400**: `#9CA3AF`
- **500**: `#6B7280`
- **600**: `#4B5563`
- **700**: `#374151`
- **800**: `#1F2937`
- **900**: `#111827` - Darkest gray

#### Text Colors
- **Main**: `#FFFFFF` - Primary text on dark backgrounds
- **Light**: `rgba(255, 255, 255, 0.7)` - Secondary text on dark backgrounds
- **Dark**: `#1F2937` - Text on light backgrounds

### Typography

#### Font Families
- **Primary**: `Inter` - Used for all UI text
  - Regular (400): Primary body text
  - Medium (500): Secondary headings, emphasized text
  - Bold (700): Primary headings, buttons, important elements

#### Font Sizes
- **Headings**:
  - H1: 28px (Mobile) / 32px (Tablet+)
  - H2: 24px (Mobile) / 28px (Tablet+)
  - H3: 20px (Mobile) / 24px (Tablet+)
  - H4: 18px (Mobile) / 20px (Tablet+)
  - H5: 16px (Mobile) / 18px (Tablet+)
  - H6: 14px (Mobile) / 16px (Tablet+)

- **Body**:
  - Large: 18px
  - Regular: 16px
  - Small: 14px
  - XSmall: 12px

#### Line Heights
- Headings: 1.2
- Body text: 1.5
- Buttons and compact UI: 1.25

### Iconography

- **Library**: Lucide React Native
- **Default Size**: 24px
- **Default Color**: Inherits from text color
- **Default Stroke Width**: 2px

## Layout & Spacing

### Grid System

- **Base Unit**: 4px
- **Spacing Scale**:
  - 2: 8px (2 × 4px)
  - 3: 12px (3 × 4px)
  - 4: 16px (4 × 4px)
  - 5: 20px (5 × 4px)
  - 6: 24px (6 × 4px)
  - 8: 32px (8 × 4px)
  - 10: 40px (10 × 4px)
  - 12: 48px (12 × 4px)
  - 16: 64px (16 × 4px)
  - 20: 80px (20 × 4px)
  - 24: 96px (24 × 4px)

### Container Widths

- **Mobile**: Full width with 20px padding
- **Tablet**: 768px max-width
- **Desktop**: 1024px max-width

### Screen Padding

- **Mobile**: 20px horizontal, 16px vertical
- **Tablet+**: 24px horizontal, 20px vertical

## Components

### Buttons

#### Variants

1. **Primary**
   - Background: `#5B21B6` (Primary Main)
   - Text: `#FFFFFF` (Text Main)
   - Hover: `#4C1D95` (Primary Dark)
   - Active: `#4C1D95` (Primary Dark)
   - Disabled: `#6B7280` (Neutral 500) with 50% opacity

2. **Secondary**
   - Background: `#FACC15` (Accent Yellow)
   - Text: `#0F0E2A` (Background Dark)
   - Hover: Darken by 10%
   - Active: Darken by 15%
   - Disabled: `#6B7280` (Neutral 500) with 50% opacity

3. **Outline**
   - Border: `#5B21B6` (Primary Main)
   - Text: `#5B21B6` (Primary Main)
   - Background: Transparent
   - Hover: `rgba(91, 33, 182, 0.1)` (Primary Main with 10% opacity)
   - Active: `rgba(91, 33, 182, 0.2)` (Primary Main with 20% opacity)
   - Disabled: `#6B7280` (Neutral 500) with 50% opacity

#### Sizes

1. **Small**
   - Height: 32px
   - Padding: 8px 16px
   - Font: Inter-Bold, 14px
   - Border Radius: 8px
   - Icon Size: 16px

2. **Medium**
   - Height: 40px
   - Padding: 12px 24px
   - Font: Inter-Bold, 16px
   - Border Radius: 12px
   - Icon Size: 20px

3. **Large**
   - Height: 48px
   - Padding: 16px 32px
   - Font: Inter-Bold, 18px
   - Border Radius: 12px
   - Icon Size: 24px

#### States

- **Default**: As defined in variants
- **Hover**: Slightly darker background
- **Active/Pressed**: Darker background, slight scale transform
- **Loading**: Show spinner, disable interactions
- **Disabled**: Reduced opacity, no hover effects

### Cards

#### Variants

1. **Standard**
   - Background: `rgba(0, 0, 0, 0.2)` (Semi-transparent black)
   - Border Radius: 12px
   - Padding: 16px
   - Shadow: None

2. **Interactive**
   - Same as Standard, but with hover and active states
   - Hover: Slight brightness increase
   - Active: Slight scale transform

3. **Highlighted**
   - Background: `rgba(250, 204, 21, 0.1)` (Accent Yellow with 10% opacity)
   - Border Radius: 12px
   - Padding: 16px
   - Shadow: None

#### Usage Guidelines

- Use cards to group related content
- Maintain consistent spacing within cards (16px or 20px)
- Limit card content to related information
- Use interactive cards for clickable content
- Highlighted cards should be used sparingly for important information

### Form Elements

#### Text Inputs

- Height: 48px
- Border: 1px solid `#374151` (Neutral 700)
- Border Radius: 8px
- Background: `rgba(0, 0, 0, 0.2)` (Semi-transparent black)
- Text Color: `#FFFFFF` (Text Main)
- Placeholder Color: `#9CA3AF` (Neutral 400)
- Padding: 16px horizontal
- Font: Inter-Regular, 16px

#### States

- **Default**: As defined above
- **Focus**: Border color changes to `#7C3AED` (Primary Light)
- **Error**: Border color changes to `#EF4444` (Error)
- **Disabled**: Reduced opacity, no focus effects

#### Select/Dropdown

- Same styling as text inputs
- Dropdown menu background: `#1E1B4B` (Background Main)
- Selected item background: `#312E81` (Background Light)

#### Checkboxes & Radio Buttons

- Size: 20px × 20px
- Border: 1px solid `#374151` (Neutral 700)
- Border Radius: 4px (Checkbox), 10px (Radio)
- Selected Color: `#FACC15` (Accent Yellow)
- Check/Dot Color: `#0F0E2A` (Background Dark)

### Navigation

#### Tab Bar

- Background: Blurred dark background
- Active Tab: Text color `#FACC15` (Accent Yellow)
- Inactive Tab: Text color `#D1D5DB` (Neutral 300)
- Indicator: None or subtle underline in accent color
- Height: 60px
- Icon Size: 24px
- Label: Below icon, 12px, Inter-Medium

#### Headers

- Background: Transparent or subtle gradient
- Title: 24px, Inter-Bold, centered or left-aligned
- Back Button: 40px circular button with border
- Action Buttons: 40px circular buttons with border
- Height: 56px (Mobile) / 64px (Tablet+)

### Lists

#### Standard List

- Item Height: Variable based on content
- Item Padding: 16px
- Divider: 1px solid `rgba(255, 255, 255, 0.1)`
- Background: Transparent or `rgba(0, 0, 0, 0.2)`

#### Interactive List

- Same as Standard List
- Hover: Background changes to `rgba(255, 255, 255, 0.05)`
- Active: Background changes to `rgba(255, 255, 255, 0.1)`

### Progress Indicators

#### Progress Bar

- Height: 8px
- Background: `rgba(255, 255, 255, 0.1)`
- Fill: Gradient from `#FACC15` to `#EC4899` (Yellow to Pink)
- Border Radius: 4px

#### Spinner

- Color: `#FACC15` (Accent Yellow)
- Size: 24px (Small), 32px (Medium), 48px (Large)

### Badges

- Background: Varies by type (Success, Error, etc.)
- Text Color: Usually dark on light backgrounds, light on dark backgrounds
- Border Radius: 12px (pill shape)
- Padding: 4px 12px
- Font: Inter-Bold, 12px

## Patterns

### Loading States

- Use skeleton loaders for content
- Use spinners for actions
- Maintain layout during loading to prevent jumps
- Provide feedback for long operations

### Empty States

- Include an icon or illustration
- Provide a clear, friendly message
- Include an action when appropriate
- Maintain consistent padding and alignment

### Error States

- Use inline errors for form validation
- Use error cards for system errors
- Include clear error messages
- Provide recovery actions when possible

### Success States

- Use toast notifications for transient success messages
- Use inline confirmations for form submissions
- Include clear success messages
- Animate success indicators subtly

## Animations & Transitions

### Principles

- Use animations purposefully, not decoratively
- Keep animations short (150-300ms)
- Use easing functions for natural movement
- Ensure animations don't block user interaction

### Standard Transitions

- **Page Transitions**: Slide or fade, 300ms
- **Modal Transitions**: Slide up, 250ms
- **List Item Transitions**: Fade, 150ms
- **Button State Changes**: 150ms

### Micro-interactions

- Button press: Scale down slightly (0.98)
- Success indicators: Subtle bounce or pulse
- Error indicators: Subtle shake
- Focus states: Smooth border color change

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Adaptation Strategies

- Use flex layouts for flexible content
- Adjust font sizes and spacing at breakpoints
- Reflow multi-column layouts to single column on mobile
- Consider touch targets on mobile (min 44px)

## Accessibility

### Color Contrast

- Text on backgrounds must maintain 4.5:1 contrast ratio
- Interactive elements must maintain 3:1 contrast ratio
- Use the contrast checker tool for verification

### Touch Targets

- Minimum size: 44px × 44px
- Provide adequate spacing between interactive elements (min 8px)

### Screen Reader Support

- Use semantic HTML elements
- Provide alternative text for images
- Use proper ARIA roles and attributes
- Test with screen readers

## Dark Mode

The app uses a dark theme by default, but these guidelines ensure proper implementation:

- Use semantic color variables, not hard-coded values
- Ensure sufficient contrast in all states
- Test all components in dark mode
- Avoid pure black (#000000) - use `#0F0E2A` instead

## Implementation Examples

### Button Component

```tsx
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Video as LucideIcon } from 'lucide-react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  style?: object;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  iconPosition = 'right',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  
  // Determine button and text colors based on variant
  const getButtonStyle = () => {
    if (disabled) {
      return {
        backgroundColor: variant === 'outline' ? 'transparent' : colors.neutral[500],
        borderColor: variant === 'outline' ? colors.neutral[500] : 'transparent',
      };
    }
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary.main,
          borderColor: 'transparent',
        };
      case 'secondary':
        return {
          backgroundColor: colors.accent.yellow,
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary.main,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.neutral[400];
    }
    
    switch (variant) {
      case 'primary':
        return colors.text.main;
      case 'secondary':
        return colors.background.dark;
      case 'outline':
        return colors.primary.main;
    }
  };

  // Determine button size
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
        };
    }
  };

  // Determine icon size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
    }
  };

  // Determine text size
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        getButtonSize(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          size={getIconSize()}
        />
      ) : (
        <View style={styles.content}>
          {Icon && iconPosition === 'left' && (
            <Icon
              color={getTextColor()}
              size={getIconSize()}
              style={styles.iconLeft}
            />
          )}
          
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getTextSize() },
            ]}
          >
            {title}
          </Text>
          
          {Icon && iconPosition === 'right' && (
            <Icon
              color={getTextColor()}
              size={getIconSize()}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
```

### Card Component

```tsx
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
};

export default function Card({ children, style, onPress }: CardProps) {
  const { colors } = useTheme();
  
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.card,
          { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
          style
        ]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[
      styles.card,
      { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
});
```

## Page Templates

### List View Template

```tsx
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ListViewTemplate() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  
  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      <Header title="List View" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.yellow} />
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Loading data...
          </Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary.light }]}>
            <Icon size={48} color={colors.accent.yellow} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.main }]}>
            No Items Found
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.light }]}>
            There are no items to display. Add a new item to get started.
          </Text>
          <Button
            title="Add Item"
            icon={Plus}
            onPress={() => {}}
            variant="primary"
            size="large"
            style={styles.createButton}
          />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={[styles.title, { color: colors.text.main }]}>
                {item.title}
              </Text>
              <Text style={[styles.description, { color: colors.text.light }]}>
                {item.description}
              </Text>
            </Card>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  createButton: {
    minWidth: 200,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
});
```

### Detail View Template

```tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function DetailViewTemplate() {
  const { colors } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);
  
  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      <Header 
        title="Detail View" 
        onBackPress={() => router.back()}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.yellow} />
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Loading details...
          </Text>
        </View>
      ) : !data ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Could not load the requested item
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            size="medium"
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Card style={styles.headerCard}>
            <Text style={[styles.title, { color: colors.text.main }]}>
              {data.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.light }]}>
              {data.subtitle}
            </Text>
          </Card>
          
          <Card style={styles.detailsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Details
            </Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text.light }]}>
                Created
              </Text>
              <Text style={[styles.detailValue, { color: colors.text.main }]}>
                {data.createdAt}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text.light }]}>
                Status
              </Text>
              <Text style={[styles.detailValue, { color: colors.text.main }]}>
                {data.status}
              </Text>
            </View>
          </Card>
          
          <View style={styles.actions}>
            <Button
              title="Edit"
              onPress={() => {}}
              variant="outline"
              size="medium"
              style={styles.actionButton}
            />
            <Button
              title="Delete"
              onPress={() => {}}
              variant="outline"
              size="medium"
              style={[styles.actionButton, { borderColor: colors.error }]}
            />
          </View>
        </ScrollView>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerCard: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  detailValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
```

### Form Template

```tsx
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function FormTemplate() {
  const { colors } = useTheme();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
  });
  const [errors, setErrors] = useState({
    title: '',
    description: '',
  });
  
  const handleSubmit = () => {
    // Validate form
    const newErrors = {
      title: !form.title ? 'Title is required' : '',
      description: !form.description ? 'Description is required' : '',
    };
    
    setErrors(newErrors);
    
    // Check if there are any errors
    if (Object.values(newErrors).some(error => error)) {
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      router.back();
    }, 1000);
  };
  
  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      <Header 
        title="Create Item" 
        onBackPress={() => router.back()}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.main }]}>
              Title
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: errors.title ? colors.error : colors.neutral[500],
                  color: colors.text.main,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }
              ]}
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
              placeholder="Enter title"
              placeholderTextColor={colors.neutral[400]}
            />
            {errors.title ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.title}
              </Text>
            ) : null}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.main }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { 
                  borderColor: errors.description ? colors.error : colors.neutral[500],
                  color: colors.text.main,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }
              ]}
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              placeholder="Enter description"
              placeholderTextColor={colors.neutral[400]}
              multiline
              numberOfLines={4}
            />
            {errors.description ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.description}
              </Text>
            ) : null}
          </View>
          
          <Button
            title="Submit"
            onPress={handleSubmit}
            variant="primary"
            size="large"
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </Card>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  formCard: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 12,
  },
});
```

## Best Practices

### Performance Optimization

1. **Minimize Rerenders**
   - Use `React.memo` for pure components
   - Use `useCallback` for event handlers
   - Use `useMemo` for expensive calculations

2. **Image Optimization**
   - Use appropriate image sizes
   - Implement lazy loading for images
   - Use image caching

3. **List Optimization**
   - Use `FlatList` instead of `ScrollView` for long lists
   - Implement pagination for large data sets
   - Use `getItemLayout` for fixed-size items
   - Implement proper `keyExtractor`

### Code Organization

1. **Component Structure**
   - Keep components focused on a single responsibility
   - Extract reusable logic into custom hooks
   - Group related components in directories

2. **State Management**
   - Use local state for UI-specific state
   - Use context for shared state
   - Consider Redux for complex global state

3. **File Naming**
   - Use PascalCase for component files
   - Use camelCase for utility files
   - Use kebab-case for asset files

### Accessibility

1. **Semantic Markup**
   - Use appropriate components for their semantic meaning
   - Provide accessible labels for interactive elements
   - Ensure proper heading hierarchy

2. **Keyboard Navigation**
   - Ensure all interactive elements are focusable
   - Implement logical tab order
   - Provide keyboard shortcuts for common actions

3. **Screen Reader Support**
   - Test with screen readers
   - Provide alternative text for images
   - Use accessibilityLabel and accessibilityHint

## Design System Evolution

### Adding New Components

1. Document the component's purpose and usage
2. Define variants, states, and props
3. Implement the component following the design guidelines
4. Add examples to the documentation
5. Test the component across platforms

### Updating Existing Components

1. Document the changes and rationale
2. Update the component implementation
3. Update examples in the documentation
4. Test the updated component across platforms
5. Communicate changes to the team

### Deprecating Components

1. Mark the component as deprecated in the documentation
2. Provide migration guidance
3. Maintain the deprecated component for a transition period
4. Remove the component after the transition period

## Conclusion

This design guide serves as the foundation for creating a consistent, high-quality user experience in the Pling application. By following these guidelines, we ensure that all parts of the application maintain a cohesive visual language and interaction model, while allowing for evolution and improvement over time.

The design system is a living document that should evolve with the application. Regular reviews and updates will ensure it remains relevant and effective.