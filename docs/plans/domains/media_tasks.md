# Media Förbättringsplan

## Översikt

Detta dokument beskriver strukturen och implementationen av media-domänen i Pling-applikationen. Denna domän hanterar all mediahantering, inklusive bildhantering, dokumenthantering, filuppladdning samt lagring och caching med Supabase Storage integration.

## Innehållsförteckning

1. [Nulägesanalys](#nulägesanalys)
2. [Domänstruktur](#domänstruktur)
3. [Datamodell](#datamodell)
4. [Integrationer](#integrationer)
5. [Implementation](#implementation)
6. [Testning](#testning)
7. [Tidplan](#tidplan)

## Domänstruktur

### Mappstruktur

```
/components
  /media
    MediaUploader.tsx        # Generisk filuppladdare
    ImageUploader.tsx        # Bildspecifik uppladdare
    DocumentUploader.tsx     # Dokumentspecifik uppladdare
    MediaGallery.tsx         # Mediabibliotek
    MediaViewer.tsx          # Visning av media
    MediaManager.tsx         # Hantering av media
    
/hooks
  /media
    useMediaUpload.ts        # Hook för uppladdning
    useMediaDownload.ts      # Hook för nedladdning
    useMediaStorage.ts       # Hook för lagring
    useImageProcessing.ts    # Hook för bildbehandling
    useMediaCache.ts         # Hook för caching
    
/services
  /media
    mediaService.ts          # Huvudservice för media
    storageService.ts        # Supabase Storage integration
    imageService.ts          # Bildbehandling
    documentService.ts       # Dokumenthantering
    cacheService.ts          # Cachninghantering
    
/types
  media.ts                  # Mediatyper
  storage.ts               # Lagringstyper
  upload.ts               # Uppladdningstyper
  processing.ts           # Bearbetningstyper
  
/utils
  /media
    formatters.ts          # Formatteringsfunktioner
    validators.ts         # Valideringsfunktioner
    processors.ts         # Bearbetningsfunktioner
    optimizers.ts         # Optimeringsfunktioner
```

## Datamodell

### Huvudmodeller

```typescript
export interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  created_at: string;
  updated_at: string;
  
  // Metadata
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    pages?: number;
    author?: string;
    [key: string]: any;
  };
  
  // Lagringsinformation
  storage: {
    bucket: string;
    path: string;
    version: string;
    checksum: string;
  };
  
  // Bearbetningsinformation
  processing: {
    status: ProcessingStatus;
    versions: MediaVersion[];
    optimized: boolean;
    error?: string;
  };
  
  // Åtkomst och delning
  access: {
    visibility: Visibility;
    permissions: Permission[];
    shared_with: string[];
    expires_at?: string;
  };
}

export interface MediaVersion {
  id: string;
  media_id: string;
  type: VersionType;
  url: string;
  size: number;
  
  // Versionspecifik metadata
  metadata: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  };
  
  // Bearbetningsinformation
  processing: {
    parameters: ProcessingParameters;
    created_at: string;
    status: ProcessingStatus;
  };
}

export interface MediaBucket {
  id: string;
  name: string;
  type: BucketType;
  
  // Konfiguration
  config: {
    max_file_size: number;
    allowed_types: string[];
    versioning: boolean;
    caching: CacheConfig;
  };
  
  // Åtkomstkontroll
  access: {
    public: boolean;
    allowed_roles: string[];
    cors_origins: string[];
  };
  
  // Statistik
  stats: {
    total_size: number;
    file_count: number;
    last_modified: string;
  };
}

export interface UploadConfig {
  bucket: string;
  path: string;
  type: MediaType;
  
  // Uppladdningsinställningar
  settings: {
    max_size: number;
    allowed_types: string[];
    auto_process: boolean;
    create_versions: boolean;
  };
  
  // Bearbetningsinställningar
  processing: {
    image?: ImageProcessingConfig;
    document?: DocumentProcessingConfig;
    video?: VideoProcessingConfig;
  };
  
  // Metadata
  metadata: {
    auto_extract: boolean;
    custom_fields: Record<string, any>;
  };
}
```

## Integrationer

### 1. Supabase Storage Integration

```typescript
export class SupabaseStorageService {
  async uploadFile(
    file: File,
    config: UploadConfig
  ): Promise<MediaItem> {
    // Hantera filuppladdning till Supabase Storage
  }
  
  async downloadFile(
    mediaId: string,
    options?: DownloadOptions
  ): Promise<Blob> {
    // Hämta fil från Supabase Storage
  }
  
  async generateSignedUrl(
    mediaId: string,
    options: SignedUrlOptions
  ): Promise<string> {
    // Generera signerad URL
  }
}
```

### 2. Bildbehandling

```typescript
export class ImageProcessingService {
  async processImage(
    image: File | Blob,
    config: ImageProcessingConfig
  ): Promise<ProcessedImage> {
    // Bearbeta bild
  }
  
  async generateThumbnail(
    mediaId: string,
    options: ThumbnailOptions
  ): Promise<MediaVersion> {
    // Generera miniatyrbild
  }
  
  async optimizeImage(
    mediaId: string,
    options: OptimizationOptions
  ): Promise<MediaVersion> {
    // Optimera bild
  }
}
```

### 3. Dokumenthantering

```typescript
export class DocumentService {
  async processDocument(
    document: File,
    config: DocumentProcessingConfig
  ): Promise<ProcessedDocument> {
    // Bearbeta dokument
  }
  
  async generatePreview(
    mediaId: string,
    options: PreviewOptions
  ): Promise<MediaVersion> {
    // Generera förhandsgranskning
  }
  
  async extractText(
    mediaId: string
  ): Promise<ExtractedText> {
    // Extrahera text från dokument
  }
}
```

## Implementation

### Fas 1: Grundläggande infrastruktur

1. **Databasschema**
```sql
-- Media items
CREATE TABLE media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  storage JSONB NOT NULL,
  processing JSONB NOT NULL,
  access JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media versions
CREATE TABLE media_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID REFERENCES media_items(id),
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  processing JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media buckets
CREATE TABLE media_buckets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL,
  access JSONB NOT NULL,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. **Grundläggande services**

```typescript
export class MediaService {
  async uploadMedia(
    file: File,
    config: UploadConfig
  ): Promise<MediaItem> {
    // Hantera mediauppladdning
  }
  
  async processMedia(
    mediaId: string,
    options: ProcessingOptions
  ): Promise<MediaItem> {
    // Bearbeta media
  }
  
  async getMediaInfo(
    mediaId: string
  ): Promise<MediaItem> {
    // Hämta mediainformation
  }
}
```

### Fas 2: UI-komponenter

1. **MediaUploader**
   - Drag-and-drop
   - Förhandsgranskning
   - Progressindikator

2. **MediaGallery**
   - Grid/listvy
   - Filtrering
   - Sortering

3. **MediaViewer**
   - Bildvisning
   - Dokumentförhandsgranskning
   - Delningsfunktioner

### Fas 3: Avancerade funktioner

1. **Bildbehandling**
   - Automatisk storleksändring
   - Optimering
   - Formatkonvertering

2. **Dokumenthantering**
   - PDF-förhandsgranskning
   - Textextrahering
   - Versionshantering

3. **Caching**
   - Lokal cache
   - CDN-integration
   - Cache-invalidering

## Testning

### Enhetstester
- Uppladdningsfunktioner
- Bearbetningslogik
- Valideringar

### Integrationstester
- Supabase Storage
- Bildbehandling
- Dokumenthantering

### Prestandatester
- Uppladdningshastighet
- Bearbetningstid
- Cache-effektivitet

## Tidplan

### Vecka 1: Grundstruktur
- Dag 1-2: Databasschema
- Dag 3-4: Grundläggande services
- Dag 5: Supabase integration

### Vecka 2: UI och uppladdning
- Dag 1-2: Uppladdningskomponenter
- Dag 3-4: Galleri och visning
- Dag 5: Förhandsgranskning

### Vecka 3: Bearbetning
- Dag 1-2: Bildbehandling
- Dag 3-4: Dokumenthantering
- Dag 5: Optimering

### Vecka 4: Testning och optimering
- Dag 1-2: Enhetstester
- Dag 3: Integrationstester
- Dag 4-5: Prestandaoptimering

## Implementationsstatus

### Implementerade komponenter
- ⏳ Databasstruktur
- ⏳ Grundläggande services
- ⏳ Supabase integration

### Pågående arbete
- 📝 UI-komponenter
- 📝 Bildbehandling
- 📝 Dokumenthantering

### Kommande arbete
- 📝 Avancerad bearbetning
- 📝 Caching-system
- 📝 Prestandaoptimering

## Nästa steg

1. Implementera databasstruktur
2. Skapa grundläggande services
3. Utveckla UI-komponenter
4. Implementera bearbetning
5. Testa och optimera 