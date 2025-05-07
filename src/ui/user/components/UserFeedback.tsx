import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, useTheme, Portal, Modal, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Typ av feedback
 */
export enum FeedbackType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Alternativ för användarfeedback
 */
export interface UserFeedbackOptions {
  /**
   * Typ av feedback (success, error, warning, info)
   */
  type: FeedbackType;
  
  /**
   * Meddelandets rubrik
   */
  title: string;
  
  /**
   * Detaljerat meddelande
   */
  message: string;
  
  /**
   * Tid att visa feedback (i ms), 0 betyder tills användaren stänger
   * Default: 3000ms för success, 0 för övriga
   */
  duration?: number;
  
  /**
   * Om det ska gå att stänga feedbacken
   * Default: true
   */
  dismissable?: boolean;
  
  /**
   * Funktion som anropas när användaren väljer att försöka igen (vid fel)
   */
  onRetry?: () => void;
  
  /**
   * Funktion som anropas när användaren stänger feedbacken
   */
  onDismiss?: () => void;
  
  /**
   * Om detaljerad information ska visas i en modal vid klick
   * Default: true för error, false för övriga
   */
  showDetails?: boolean;
  
  /**
   * Icon för feedbacken
   */
  icon?: string;
}

interface UserFeedbackProps extends UserFeedbackOptions {
  /**
   * Om feedbacken ska visas
   */
  visible: boolean;
}

/**
 * Komponent för att visa feedback till användaren
 */
export const UserFeedback: React.FC<UserFeedbackProps> = ({
  visible,
  type = FeedbackType.INFO,
  title,
  message,
  duration,
  dismissable = true,
  onRetry,
  onDismiss,
  showDetails = type === FeedbackType.ERROR,
  icon
}) => {
  const theme = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isVisible, setIsVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  
  // Beräkna standardvärden baserat på typ
  const defaultDuration = type === FeedbackType.SUCCESS ? 3000 : 0;
  const actualDuration = duration !== undefined ? duration : defaultDuration;
  
  // Timer för att automatiskt dölja feedback
  let hideTimer: NodeJS.Timeout | null = null;
  
  // Visa/dölj feedback med animation
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
      
      // Sätt timer för att dölja om en duration är specificerad
      if (actualDuration > 0) {
        hideTimer = setTimeout(() => {
          hideFeedback();
        }, actualDuration);
      }
    } else {
      hideFeedback();
    }
    
    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [visible]);
  
  // Dölj feedback med animation
  const hideFeedback = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setIsVisible(false);
      if (onDismiss) {
        onDismiss();
      }
    });
  };
  
  // Hantera klick på återförsöksknappen
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    hideFeedback();
  };
  
  // Hantera klick på stängknappen
  const handleClose = () => {
    hideFeedback();
  };
  
  // Hantera klick för att visa detaljer
  const handleShowDetails = () => {
    if (showDetails) {
      setDetailsVisible(true);
    }
  };
  
  // Välj färg baserat på typ
  const getBackgroundColor = () => {
    switch (type) {
      case FeedbackType.SUCCESS:
        return theme.colors.primary;
      case FeedbackType.ERROR:
        return theme.colors.error;
      case FeedbackType.WARNING:
        return '#FF9800';
      case FeedbackType.INFO:
      default:
        return theme.colors.secondary;
    }
  };
  
  // Välj ikon baserat på typ om ingen specifik ikon anges
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case FeedbackType.SUCCESS:
        return 'check-circle';
      case FeedbackType.ERROR:
        return 'alert-circle';
      case FeedbackType.WARNING:
        return 'alert';
      case FeedbackType.INFO:
      default:
        return 'information';
    }
  };
  
  // Visa inget om inte synlig
  if (!isVisible) return null;
  
  return (
    <>
      <Animated.View 
        style={[
          styles.container, 
          { opacity: fadeAnim, backgroundColor: getBackgroundColor() }
        ]}
      >
        <Surface style={styles.surface}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={getIcon()} 
              size={24} 
              color="#FFF" 
            />
          </View>
          
          <TouchableOpacity 
            style={styles.content}
            onPress={handleShowDetails}
            disabled={!showDetails}
          >
            <Text variant="titleMedium" style={styles.title}>{title}</Text>
            <Text style={styles.message} numberOfLines={2}>{message}</Text>
          </TouchableOpacity>
          
          <View style={styles.actions}>
            {onRetry && type === FeedbackType.ERROR && (
              <IconButton
                icon="refresh"
                iconColor="#FFF"
                size={20}
                onPress={handleRetry}
              />
            )}
            
            {dismissable && (
              <IconButton
                icon="close"
                iconColor="#FFF"
                size={20}
                onPress={handleClose}
              />
            )}
          </View>
        </Surface>
      </Animated.View>
      
      {/* Modal för detaljerad information */}
      <Portal>
        <Modal
          visible={detailsVisible}
          onDismiss={() => setDetailsVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={[styles.modalHeader, { backgroundColor: getBackgroundColor() }]}>
            <MaterialCommunityIcons 
              name={getIcon()} 
              size={24} 
              color="#FFF" 
            />
            <Text variant="titleMedium" style={styles.modalTitle}>{title}</Text>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalMessage}>{message}</Text>
          </View>
          
          <View style={styles.modalActions}>
            {onRetry && type === FeedbackType.ERROR && (
              <Button 
                mode="contained" 
                onPress={() => {
                  setDetailsVisible(false);
                  handleRetry();
                }}
                style={[styles.modalButton, { backgroundColor: getBackgroundColor() }]}
              >
                Försök igen
              </Button>
            )}
            
            <Button 
              mode="outlined" 
              onPress={() => setDetailsVisible(false)}
              style={styles.modalButton}
            >
              Stäng
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

/**
 * Hook för att visa feedback till användaren
 */
export const useFeedback = () => {
  const [feedbackProps, setFeedbackProps] = useState<UserFeedbackProps>({
    visible: false,
    type: FeedbackType.INFO,
    title: '',
    message: ''
  });
  
  // Visa framgångsmeddelande
  const showSuccess = (title: string, message: string, options?: Partial<UserFeedbackOptions>) => {
    setFeedbackProps({
      visible: true,
      type: FeedbackType.SUCCESS,
      title,
      message,
      ...options
    });
  };
  
  // Visa felmeddelande
  const showError = (title: string, message: string, options?: Partial<UserFeedbackOptions>) => {
    setFeedbackProps({
      visible: true,
      type: FeedbackType.ERROR,
      title,
      message,
      ...options
    });
  };
  
  // Visa varningsmeddelande
  const showWarning = (title: string, message: string, options?: Partial<UserFeedbackOptions>) => {
    setFeedbackProps({
      visible: true,
      type: FeedbackType.WARNING,
      title,
      message,
      ...options
    });
  };
  
  // Visa infomeddelande
  const showInfo = (title: string, message: string, options?: Partial<UserFeedbackOptions>) => {
    setFeedbackProps({
      visible: true,
      type: FeedbackType.INFO,
      title,
      message,
      ...options
    });
  };
  
  // Dölj feedback
  const hideFeedback = () => {
    setFeedbackProps(prev => ({
      ...prev,
      visible: false
    }));
  };
  
  return {
    FeedbackComponent: () => <UserFeedback {...feedbackProps} />,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideFeedback
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent'
  },
  iconContainer: {
    padding: 16
  },
  content: {
    flex: 1,
    padding: 16
  },
  title: {
    color: '#FFF',
    marginBottom: 4
  },
  message: {
    color: '#FFF',
    opacity: 0.9
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 8,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },
  modalTitle: {
    color: '#FFF',
    marginLeft: 16
  },
  modalContent: {
    padding: 16
  },
  modalMessage: {
    lineHeight: 22
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  modalButton: {
    marginLeft: 8
  }
}); 