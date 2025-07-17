import { BlockTool, BlockToolConstructorOptions, BlockToolData } from '@editorjs/editorjs';

export interface DrawIOData extends BlockToolData {
  xml?: string;
  title?: string;
  url?: string;
}

export class DrawIOTool implements BlockTool {
  private data: DrawIOData;
  private wrapper: HTMLElement;
  private api: any;

  static get toolbox() {
    return {
      title: 'Draw.io',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
  }

  constructor({ data, api }: BlockToolConstructorOptions) {
    this.data = data as DrawIOData || {};
    this.api = api;
    this.wrapper = document.createElement('div');
  }

  render() {
    this.wrapper.classList.add('drawio-block');
    this.wrapper.style.minHeight = '400px';
    this.wrapper.style.border = '1px solid hsl(var(--border))';
    this.wrapper.style.borderRadius = '8px';
    this.wrapper.style.backgroundColor = 'hsl(var(--background))';

    if (!this.data.xml && !this.data.url) {
      this.renderPlaceholder();
    } else {
      this.renderDiagram();
    }

    return this.wrapper;
  }

  private renderPlaceholder() {
    this.wrapper.innerHTML = `
      <div class="flex items-center justify-center h-full text-muted-foreground p-8">
        <div class="text-center space-y-4">
          <p class="text-lg">Draw.io Diagram</p>
          <div class="space-y-2">
            <button class="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Create New Diagram
            </button>
            <button class="block w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
              Import XML
            </button>
          </div>
          <input type="file" accept=".xml,.drawio" class="hidden" />
        </div>
      </div>
    `;

    const createButton = this.wrapper.querySelector('button:first-of-type');
    const importButton = this.wrapper.querySelector('button:last-of-type');
    const fileInput = this.wrapper.querySelector('input[type="file"]') as HTMLInputElement;

    createButton?.addEventListener('click', () => this.openDrawIOEditor());
    importButton?.addEventListener('click', () => fileInput.click());
    
    fileInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.data.xml = event.target?.result as string;
          this.data.title = file.name.replace(/\.(xml|drawio)$/, '');
          this.renderDiagram();
        };
        reader.readAsText(file);
      }
    });
  }

  private renderDiagram() {
    const viewerUrl = this.data.xml 
      ? `https://viewer.diagrams.net/?lightbox=1&highlight=0000ff&edit=_blank&layers=1&nav=1&title=${encodeURIComponent(this.data.title || 'Diagram')}#R${encodeURIComponent(this.data.xml)}`
      : this.data.url;

    this.wrapper.innerHTML = `
      <div class="relative h-full">
        <div class="absolute top-2 right-2 z-10 space-x-2">
          <button class="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
            Edit
          </button>
          <button class="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
            View Full
          </button>
        </div>
        <iframe 
          src="${viewerUrl}"
          class="w-full h-full rounded border-0"
          frameborder="0"
          allowfullscreen>
        </iframe>
      </div>
    `;

    const editButton = this.wrapper.querySelector('button:first-of-type');
    const viewButton = this.wrapper.querySelector('button:last-of-type');

    editButton?.addEventListener('click', () => this.openDrawIOEditor());
    viewButton?.addEventListener('click', () => {
      if (viewerUrl) {
        window.open(viewerUrl, '_blank');
      }
    });
  }

  private openDrawIOEditor() {
    const editorUrl = this.data.xml
      ? `https://app.diagrams.net/?lightbox=1&edit=_blank&libs=0&clibs=U#R${encodeURIComponent(this.data.xml)}`
      : 'https://app.diagrams.net/?lightbox=1&edit=_blank&libs=0&clibs=U';

    // Open in new window and listen for postMessage
    const editorWindow = window.open(editorUrl, '_blank', 'width=1200,height=800');

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://app.diagrams.net') return;

      if (event.data.event === 'save') {
        this.data.xml = event.data.xml;
        this.data.title = event.data.title || 'Untitled Diagram';
        this.renderDiagram();
        editorWindow?.close();
        window.removeEventListener('message', handleMessage);
      } else if (event.data.event === 'exit') {
        editorWindow?.close();
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);

    // Close listener
    const checkClosed = setInterval(() => {
      if (editorWindow?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);
  }

  save() {
    return this.data;
  }

  static get isReadOnlySupported() {
    return true;
  }
}