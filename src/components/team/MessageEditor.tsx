import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, Keyboard } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

interface MessageEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function MessageEditor({
  initialContent,
  onSave,
  onCancel
}: MessageEditorProps) {
  const [content, setContent] = useState(initialContent);
  const inputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    // Fokusera på textinput när komponenten renderas
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    
    // Lyssna på tangentbordshändelser
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        // Detta är en indikation på att användaren tryckte utanför editorn
        if (content !== initialContent) {
          // Spara ändringarna bara om innehållet faktiskt har ändrats
          onSave(content);
        } else {
          // Annars avbryt
          onCancel();
        }
      }
    );
    
    return () => {
      keyboardDidHideListener.remove();
    };
  }, [content, initialContent, onCancel, onSave]);
  
  const handleSavePress = () => {
    if (content.trim().length === 0) {
      // Visa en felmeddelande eller återställ till ursprungligt innehåll
      setContent(initialContent);
      onCancel();
      return;
    }
    
    onSave(content);
  };
  
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleSmall" style={styles.title}>
          Redigera meddelande
        </Text>
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={4000}
          autoFocus
        />
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="text" 
            onPress={onCancel}
            style={styles.button}
          >
            Avbryt
          </Button>
          
          <Button 
            mode="contained" 
            onPress={handleSavePress}
            style={styles.button}
            disabled={!content.trim() || content === initialContent}
          >
            Spara
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    borderRadius: 12
  },
  title: {
    marginBottom: 8
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12
  },
  button: {
    marginLeft: 8
  }
}); 