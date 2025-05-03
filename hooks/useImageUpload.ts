import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

interface FileInfo {
  publicUrl: string;
  path: string;
}

/**
 * Hook för att hantera uppladdning av bilder till Supabase Storage
 * 
 * @param bucketName - Namnet på bucket i Supabase Storage
 * @returns {object} - Funktioner och tillstånd för bilduppladdning
 */
const useImageUpload = (bucketName: string) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const uploadMutation = useMutation({
    mutationFn: async ({ uri, filePath }: { uri: string; filePath: string }) => {
      setUploading(true);
      setUploadProgress(0);
      
      try {
        if (Platform.OS === 'web') {
          // Webb-implementation
          const response = await fetch(uri);
          const blob = await response.blob();
          
          // Ladda upp till Supabase
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
              upsert: true,
            });
          
          if (error) {
            throw error;
          }
          
          // Hämta publik URL
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);
          
          return { publicUrl, path: data.path };
        } else {
          // Native implementation för iOS & Android
          const fileInfo = await FileSystem.getInfoAsync(uri);
          
          if (!fileInfo.exists) {
            throw new Error('Filen existerar inte');
          }
          
          // Hämta token för authentisering
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Ingen autentiserad session');
          }
          
          // Skapa form data för uppladdning
          const formData = new FormData();
          formData.append('file', {
            uri,
            type: 'image/jpeg',
            name: filePath.split('/').pop(),
          } as any);
          
          // Manuell fetch med progress-spårning
          const xhr = new XMLHttpRequest();
          
          // Skapa ett promise för att hantera asynkron uppladdning
          const uploadPromise = new Promise<FileInfo>((resolve, reject) => {
            xhr.open('POST', `${supabase.storageUrl}/object/${bucketName}/${filePath}`);
            
            // Sätt headers för autentisering och innehållstyp
            xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
            xhr.setRequestHeader('x-upsert', 'true');
            
            // Lyssna på progress-uppdateringar
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const progress = event.loaded / event.total;
                setUploadProgress(progress);
              }
            };
            
            // Hantera svar
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                // Hämta publik URL för den uppladdade filen
                const { data: { publicUrl } } = supabase.storage
                  .from(bucketName)
                  .getPublicUrl(filePath);
                
                resolve({ publicUrl, path: filePath });
              } else {
                reject(new Error(`Uppladdningsfel: ${xhr.status}`));
              }
            };
            
            // Hantera nätverksfel
            xhr.onerror = () => {
              reject(new Error('Nätverksfel vid uppladdning'));
            };
            
            // Skicka formulärdata
            xhr.send(formData);
          });
          
          return await uploadPromise;
        }
      } catch (error: any) {
        console.error('Image upload error:', error);
        Toast.show({
          type: 'error',
          text1: 'Uppladdningsfel',
          text2: error.message || 'Ett fel inträffade vid uppladdning av bilden',
          position: 'bottom',
        });
        throw error;
      } finally {
        setUploading(false);
      }
    }
  });
  
  const uploadImage = useCallback(
    async (uri: string, fileName: string): Promise<FileInfo | null> => {
      try {
        // Generera unik filsökväg med datum för att undvika cache-problem
        const timestamp = new Date().getTime();
        const fileExt = uri.split('.').pop();
        const filePath = `${fileName}_${timestamp}.${fileExt || 'jpg'}`;
        
        return await uploadMutation.mutateAsync({ uri, filePath });
      } catch (error) {
        console.error('Upload error:', error);
        return null;
      }
    },
    [uploadMutation, bucketName]
  );
  
  return {
    uploadImage,
    uploading,
    uploadProgress,
    uploadError: uploadMutation.error,
  };
};

export default useImageUpload; 