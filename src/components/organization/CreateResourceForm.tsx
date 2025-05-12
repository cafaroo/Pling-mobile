import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Switch
} from 'react-native';
import { useOrganization } from './OrganizationProvider';
import { ResourceType, ResourceTypeLabels } from '@/domain/organization/value-objects/ResourceType';
import { Picker } from '@react-native-picker/picker';

interface CreateResourceFormProps {
  organizationId: string;
  initialType?: ResourceType;
  onSuccess?: (resourceId: string) => void;
  onCancel?: () => void;
}

export const CreateResourceForm: React.FC<CreateResourceFormProps> = ({
  organizationId,
  initialType,
  onSuccess,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ResourceType>(initialType || ResourceType.DOCUMENT);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [metadataKey, setMetadataKey] = useState('');
  const [metadataValue, setMetadataValue] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createResource } = useOrganization();

  const handleAddMetadata = () => {
    if (!metadataKey.trim()) return;
    
    setMetadata(prev => ({
      ...prev,
      [metadataKey.trim()]: metadataValue
    }));
    
    setMetadataKey('');
    setMetadataValue('');
  };

  const handleRemoveMetadata = (key: string) => {
    setMetadata(prev => {
      const newMetadata = { ...prev };
      delete newMetadata[key];
      return newMetadata;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Resursnamn kan inte vara tomt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Lägg till publiceringsstatus i metadata
      const finalMetadata = {
        ...metadata,
        isPublic
      };

      const result = await createResource({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        organizationId,
        metadata: finalMetadata
      });

      if (result.success && result.resourceId) {
        if (onSuccess) {
          onSuccess(result.resourceId);
        }
      } else {
        setError(result.error || 'Kunde inte skapa resursen');
      }
    } catch (err) {
      console.error('Fel vid skapande av resurs:', err);
      setError('Ett oväntat fel inträffade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Skapa ny {ResourceTypeLabels[type].toLowerCase()}</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Resurstyp</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={type}
            onValueChange={(value) => setType(value as ResourceType)}
            style={styles.picker}
          >
            {Object.entries(ResourceTypeLabels).map(([key, label]) => (
              <Picker.Item key={key} label={label} value={key} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Namn <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ange resursnamn"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Beskrivning</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Beskriv resursen (valfritt)"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Publik resurs</Text>
        <View style={styles.switchContainer}>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isPublic ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.switchLabel}>
            {isPublic ? 'Ja' : 'Nej'}
          </Text>
        </View>
        <Text style={styles.helpText}>
          Publika resurser kan ses av alla medlemmar i organisationen
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Metadata</Text>
        
        <View style={styles.metadataInputContainer}>
          <TextInput
            style={[styles.input, styles.metadataInput]}
            value={metadataKey}
            onChangeText={setMetadataKey}
            placeholder="Nyckel"
          />
          <TextInput
            style={[styles.input, styles.metadataInput]}
            value={metadataValue}
            onChangeText={setMetadataValue}
            placeholder="Värde"
          />
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddMetadata}
            disabled={!metadataKey.trim()}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {Object.keys(metadata).length > 0 && (
          <View style={styles.metadataList}>
            {Object.entries(metadata).map(([key, value]) => (
              <View key={key} style={styles.metadataItem}>
                <View style={styles.metadataContent}>
                  <Text style={styles.metadataKey}>{key}:</Text>
                  <Text style={styles.metadataValue}>{String(value)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveMetadata(key)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {onCancel && (
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Avbryt</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (!name.trim() || loading) && styles.disabledButton
          ]} 
          onPress={handleSubmit}
          disabled={!name.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Skapa resurs</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#111827',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  picker: {
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  metadataInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metadataInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#10B981',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  metadataList: {
    marginTop: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  metadataContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataKey: {
    fontWeight: '600',
    marginRight: 8,
    color: '#4B5563',
  },
  metadataValue: {
    color: '#4B5563',
    flex: 1,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
}); 