import { ValueObject } from '@/shared/core/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

export interface MessageAttachmentProps {
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export class MessageAttachment extends ValueObject<MessageAttachmentProps> {
  get type(): 'image' | 'file' | 'link' {
    return this.props.type;
  }

  get url(): string {
    return this.props.url;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get size(): number | undefined {
    return this.props.size;
  }

  get mimeType(): string | undefined {
    return this.props.mimeType;
  }

  private constructor(props: MessageAttachmentProps) {
    super(props);
  }

  public static create(props: MessageAttachmentProps): Result<MessageAttachment, string> {
    if (!props.url) {
      return Result.err('URL krävs för bilagor');
    }

    try {
      // Validera URL
      new URL(props.url);
    } catch (error) {
      return Result.err('Ogiltig URL');
    }

    if (props.type === 'image') {
      // Validera bildformat om mimeType anges
      if (props.mimeType && !props.mimeType.startsWith('image/')) {
        return Result.err('Ogiltig mimeType för bildtyp');
      }
    } else if (props.type === 'file') {
      // För filtyper behöver vi ett namn
      if (!props.name) {
        return Result.err('Namn krävs för filbilagor');
      }
    }

    return Result.ok(new MessageAttachment(props));
  }

  public isImage(): boolean {
    return this.props.type === 'image';
  }

  public isFile(): boolean {
    return this.props.type === 'file';
  }

  public isLink(): boolean {
    return this.props.type === 'link';
  }

  public getFileExtension(): string | null {
    if (!this.props.name) return null;
    
    const parts = this.props.name.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
    
    return null;
  }

  public getFormattedSize(): string {
    if (!this.props.size) return '';
    
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;
    
    if (this.props.size < kb) {
      return `${this.props.size} B`;
    } else if (this.props.size < mb) {
      return `${(this.props.size / kb).toFixed(1)} KB`;
    } else if (this.props.size < gb) {
      return `${(this.props.size / mb).toFixed(1)} MB`;
    } else {
      return `${(this.props.size / gb).toFixed(1)} GB`;
    }
  }
} 