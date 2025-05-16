import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  maxVisiblePages?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  maxVisiblePages = 5,
}) => {
  // Beräkna vilka sidnummer som ska visas
  const pageNumbers = useMemo(() => {
    // Om det finns färre eller lika många sidor som maxVisiblePages, visa alla
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Annars visar vi ett intervall runt nuvarande sida
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = start + maxVisiblePages - 1;
    
    // Justera om vi går utanför gränserna
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    // Skapa array med sidnummer
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxVisiblePages]);
  
  // Gå till föregående sida
  const handlePrevious = () => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  };
  
  // Gå till nästa sida
  const handleNext = () => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  };
  
  // Gå till första sidan
  const handleFirst = () => {
    if (currentPage !== 1 && !disabled) {
      onPageChange(1);
    }
  };
  
  // Gå till sista sidan
  const handleLast = () => {
    if (currentPage !== totalPages && !disabled) {
      onPageChange(totalPages);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Första sidan */}
      <TouchableOpacity 
        onPress={handleFirst}
        disabled={currentPage === 1 || disabled}
        style={[
          styles.pageButton, 
          (currentPage === 1 || disabled) && styles.disabledButton
        ]}
      >
        <MaterialIcons 
          name="first-page" 
          size={20} 
          color={(currentPage === 1 || disabled) ? "#ccc" : "#666"} 
        />
      </TouchableOpacity>
      
      {/* Föregående sida */}
      <TouchableOpacity 
        onPress={handlePrevious}
        disabled={currentPage === 1 || disabled}
        style={[
          styles.pageButton, 
          (currentPage === 1 || disabled) && styles.disabledButton
        ]}
      >
        <MaterialIcons 
          name="chevron-left" 
          size={20} 
          color={(currentPage === 1 || disabled) ? "#ccc" : "#666"} 
        />
      </TouchableOpacity>
      
      {/* Sidnummer */}
      {pageNumbers.map(number => (
        <TouchableOpacity 
          key={number}
          onPress={() => !disabled && onPageChange(number)}
          disabled={number === currentPage || disabled}
          style={[
            styles.pageButton, 
            number === currentPage && styles.currentPageButton,
            disabled && styles.disabledButton
          ]}
        >
          <Text 
            style={[
              styles.pageText, 
              number === currentPage && styles.currentPageText,
              disabled && styles.disabledText
            ]}
          >
            {number}
          </Text>
        </TouchableOpacity>
      ))}
      
      {/* Nästa sida */}
      <TouchableOpacity 
        onPress={handleNext}
        disabled={currentPage === totalPages || disabled}
        style={[
          styles.pageButton, 
          (currentPage === totalPages || disabled) && styles.disabledButton
        ]}
      >
        <MaterialIcons 
          name="chevron-right" 
          size={20} 
          color={(currentPage === totalPages || disabled) ? "#ccc" : "#666"}
        />
      </TouchableOpacity>
      
      {/* Sista sidan */}
      <TouchableOpacity 
        onPress={handleLast}
        disabled={currentPage === totalPages || disabled}
        style={[
          styles.pageButton, 
          (currentPage === totalPages || disabled) && styles.disabledButton
        ]}
      >
        <MaterialIcons 
          name="last-page" 
          size={20} 
          color={(currentPage === totalPages || disabled) ? "#ccc" : "#666"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currentPageButton: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#f9f9f9',
  },
  pageText: {
    fontSize: 14,
    color: '#333',
  },
  currentPageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#ccc',
  },
}); 