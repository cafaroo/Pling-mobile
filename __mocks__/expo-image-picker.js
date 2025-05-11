// Mock för expo-image-picker
// Löser problemet med ImagePicker.launchImageLibraryAsync mockningar

// MediaTypeOptions simulering
const MediaTypeOptions = {
  All: 'All',
  Videos: 'Videos',
  Images: 'Images',
};

// ImagePickerResult typ
// {
//   canceled: boolean,
//   assets: Array<{
//     uri: string,
//     width: number,
//     height: number,
//     type?: string,
//     fileName?: string,
//     fileSize?: number,
//     exif?: Record<string, any>,
//   }>
// }

// UIImagePickerControllerQualityType simulering
const UIImagePickerControllerQualityType = {
  High: 0,
  Medium: 1,
  Low: 2,
  Original: 3,
};

// Presentationstyper
const PresentationStyle = {
  FullScreen: 'fullScreen',
  PageSheet: 'pageSheet',
  FormSheet: 'formSheet',
  OverFullScreen: 'overFullScreen',
};

// Behörighetsstatuskonstanter
const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
  LIMITED: 'limited',
};

// Huvudmock för launchImageLibraryAsync med standardsvar
const launchImageLibraryAsync = jest.fn().mockImplementation(async (options = {}) => {
  // Simulera olika resultat baserat på alternativ
  if (options._mockResult === 'cancel') {
    return { canceled: true, assets: null };
  } 
  
  if (options._mockResult === 'error') {
    throw new Error('ImagePicker simulerad error');
  }

  // Standardresultat - en lyckad bildväljaroperation
  return {
    canceled: false,
    assets: [
      {
        uri: 'file:///mock/path/to/image.jpg',
        width: 1200,
        height: 800,
        type: 'image',
        fileName: 'image.jpg',
        fileSize: 1024 * 1024, // 1MB
        exif: {
          orientation: 1,
          '{Exif}': {
            DateTimeOriginal: '2023-01-01T12:00:00Z',
          }
        }
      }
    ]
  };
});

// Mock för launchCameraAsync
const launchCameraAsync = jest.fn().mockImplementation(async (options = {}) => {
  // Standardresultat för kameramock
  return {
    canceled: false,
    assets: [
      {
        uri: 'file:///mock/path/to/camera_image.jpg',
        width: 1920,
        height: 1080,
        type: 'image',
        fileName: 'camera_image.jpg',
        fileSize: 2 * 1024 * 1024, // 2MB
      }
    ]
  };
});

// Behörighetsfunktioner
const requestCameraPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  expires: 'never',
  canAskAgain: true,
});

const requestMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  expires: 'never',
  canAskAgain: true,
});

const getCameraPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  expires: 'never',
  canAskAgain: true,
});

const getMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  expires: 'never',
  canAskAgain: true,
});

module.exports = {
  MediaTypeOptions,
  UIImagePickerControllerQualityType,
  PresentationStyle,
  PermissionStatus,
  launchImageLibraryAsync,
  launchCameraAsync,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
  getCameraPermissionsAsync,
  getMediaLibraryPermissionsAsync,
  
  // För att förenkla mocktestning, exponera dessa hjälpare
  __resetMocks: () => {
    launchImageLibraryAsync.mockClear();
    launchCameraAsync.mockClear();
    requestCameraPermissionsAsync.mockClear();
    requestMediaLibraryPermissionsAsync.mockClear();
    getCameraPermissionsAsync.mockClear();
    getMediaLibraryPermissionsAsync.mockClear();
  },
  
  // Hjälpare för att ändra mockimplementationerna i specifika test
  __setMockResult: (type, result) => {
    if (type === 'launchImageLibrary') {
      launchImageLibraryAsync.mockImplementationOnce(async () => result);
    } else if (type === 'launchCamera') {
      launchCameraAsync.mockImplementationOnce(async () => result);
    }
  }
}; 
// Löser problemet med ImagePicker.launchImageLibraryAsync mockningar

// MediaTypeOptions simulering
const MediaTypeOptions = {
  All: 'All',
  Videos: 'Videos',
  Images: 'Images',
};

// ImagePickerResult typ
// {
//   canceled: boolean,
//   assets: Array<{
//     uri: string,
//     width: number,
//     height: number,
//     type?: string,
//     fileName?: string,
//     fileSize?: number,
//     exif?: Record<string, any>,
//   }>
// }

// UIImagePickerControllerQualityType simulering
const UIImagePickerControllerQualityType = {
  High: 0,
  Medium: 1,
  Low: 2,
  Original: 3,
};

// Presentationstyper
const PresentationStyle = {
  FullScreen: 'fullScreen',
  PageSheet: 'pageSheet',
  FormSheet: 'formSheet',
  OverFullScreen: 'overFullScreen',
};

// Behörighetsstatuskonstanter
const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
  LIMITED: 'limited',
};

// Huvudmock för launchImageLibraryAsync med standardsvar
const launchImageLibraryAsync = jest.fn().mockImplementation(async (options = {}) => {
  // Simulera olika resultat baserat på alternativ
  if (options._mockResult === 'cancel') {
    return { canceled: true, assets: null };
  } 
  
  if (options._mockResult === 'error') {
    throw new Error('ImagePicker simulerad error');
  }

  // Standardresultat - en lyckad bildväljaroperation
  return {
    canceled: false,
    assets: [
      {
        uri: 'file:///mock/path/to/image.jpg',
        width: 1200,
        height: 800,
        type: 'image',
        fileName: 'image.jpg',
        fileSize: 1024 * 1024, // 1MB
        exif: {
          orientation: 1,
          '{Exif}': {
            DateTimeOriginal: '2023-01-01T12:00:00Z',
          }
        }
      }
    ]
  };
});

// Mock för launchCameraAsync
const launchCameraAsync = jest.fn().mockImplementation(async (options = {}) => {
  // Standardresultat för kameramock
  return {
    canceled: false,
    assets: [
      {
        uri: 'file:///mock/path/to/camera_image.jpg',
        width: 1920,
        height: 1080,
        type: 'image',
        fileName: 'camera_image.jpg',
        fileSize: 2 * 1024 * 1024, // 2MB
      }
    ]
  };
});

// Behörighetsfunktioner
const requestCameraPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  expires: 'never',
  canAskAgain: true,
});

const requestMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  expires: 'never',
  canAskAgain: true,
});

const getCameraPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  expires: 'never',
  canAskAgain: true,
});

const getMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  expires: 'never',
  canAskAgain: true,
});

module.exports = {
  MediaTypeOptions,
  UIImagePickerControllerQualityType,
  PresentationStyle,
  PermissionStatus,
  launchImageLibraryAsync,
  launchCameraAsync,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
  getCameraPermissionsAsync,
  getMediaLibraryPermissionsAsync,
  
  // För att förenkla mocktestning, exponera dessa hjälpare
  __resetMocks: () => {
    launchImageLibraryAsync.mockClear();
    launchCameraAsync.mockClear();
    requestCameraPermissionsAsync.mockClear();
    requestMediaLibraryPermissionsAsync.mockClear();
    getCameraPermissionsAsync.mockClear();
    getMediaLibraryPermissionsAsync.mockClear();
  },
  
  // Hjälpare för att ändra mockimplementationerna i specifika test
  __setMockResult: (type, result) => {
    if (type === 'launchImageLibrary') {
      launchImageLibraryAsync.mockImplementationOnce(async () => result);
    } else if (type === 'launchCamera') {
      launchCameraAsync.mockImplementationOnce(async () => result);
    }
  }
}; 