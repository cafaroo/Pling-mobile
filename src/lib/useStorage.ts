import { useState } from 'react';
import { supabase } from './supabase';
import { Result, ok, err } from '@types/shared';
import { decode } from 'base64-arraybuffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStorage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Laddar upp en fil till Supabase Storage
   * @param uri Lokal URI för filen som ska laddas upp
   * @param path Sökväg i bucket där filen ska lagras
   * @returns Result med URL till den uppladdade filen eller ett felmeddelande
   */
  const uploadFile = async (uri: string, path: string): Promise<Result<string, string>> => {
    try {
      setIsLoading(true);
      setError(null);

      // Hämta filen som blob från URI
      const response = await fetch(uri);
      const blob = await response.blob();

      // För att få ett namn om inget ges
      const fileName = path.split('/').pop() || `file_${new Date().getTime()}`;
      const fullPath = path.includes(fileName) ? path : `${path}/${fileName}`;

      // Ladda upp till Supabase Storage
      const { data, error: uploadError } = await supabase
        .storage
        .from('team-files')  // Använd rätt bucket-namn för er app
        .upload(fullPath, blob, {
          upsert: true,
          contentType: blob.type
        });

      if (uploadError) {
        setError(uploadError.message);
        return Result.fail(`Uppladdningsfel: ${uploadError.message}`);
      }

      // Hämta publik URL för filen
      const { data: urlData } = supabase
        .storage
        .from('team-files')
        .getPublicUrl(data?.path || fullPath);

      return Result.ok(urlData.publicUrl);
    } catch (err: any) {
      const errorMessage = err.message || 'Ett oväntat fel inträffade vid filuppladdning';
      setError(errorMessage);
      return Result.fail(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Tar bort en fil från Supabase Storage
   * @param path Sökväg till filen som ska tas bort
   * @returns Result med boolean för om borttagningen lyckades
   */
  const deleteFile = async (path: string): Promise<Result<boolean, string>> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .storage
        .from('team-files')
        .remove([path]);

      if (deleteError) {
        setError(deleteError.message);
        return Result.fail(`Borttagningsfel: ${deleteError.message}`);
      }

      return Result.ok(true);
    } catch (err: any) {
      const errorMessage = err.message || 'Ett oväntat fel inträffade vid filborttagning';
      setError(errorMessage);
      return Result.fail(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadFile,
    deleteFile,
    isLoading,
    error
  };
}; 