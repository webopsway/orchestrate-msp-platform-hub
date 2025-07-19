import { BlockTool, BlockToolConstructorOptions, BlockToolData } from '@editorjs/editorjs';

export interface ExcalidrawData extends BlockToolData {
  elements: any[];
  appState: any;
  files?: any;
}

export class ExcalidrawTool implements BlockTool {
  private data: ExcalidrawData;
  private wrapper: HTMLElement;
  private api: any;

  static get toolbox() {
    return {
      title: 'Excalidraw',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
    };
  }

  constructor({ data, api }: BlockToolConstructorOptions) {
    this.data = data as ExcalidrawData || { elements: [], appState: {} };
    this.api = api;
    this.wrapper = document.createElement('div');
  }

  render() {
    this.wrapper.classList.add('excalidraw-block');
    this.wrapper.style.minHeight = '400px';
    this.wrapper.style.border = '1px solid hsl(var(--border))';
    this.wrapper.style.borderRadius = '8px';
    this.wrapper.style.padding = '16px';
    this.wrapper.style.backgroundColor = 'hsl(var(--background))';

    // Create placeholder or load Excalidraw
    if (this.data.elements.length === 0) {
      this.wrapper.innerHTML = `
        <div class="flex items-center justify-center h-full text-muted-foreground">
          <div class="text-center">
            <p class="mb-2">Excalidraw Drawing</p>
            <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Open Editor
            </button>
          </div>
        </div>
      `;
      
      const button = this.wrapper.querySelector('button');
      button?.addEventListener('click', () => this.openExcalidrawEditor());
    } else {
      this.renderExcalidrawContent();
    }

    return this.wrapper;
  }

  private openExcalidrawEditor() {
    // Create modal with Excalidraw
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const editorContainer = document.createElement('div');
    editorContainer.style.width = '90%';
    editorContainer.style.height = '90%';
    editorContainer.style.backgroundColor = 'white';
    editorContainer.style.borderRadius = '8px';
    editorContainer.style.position = 'relative';

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.zIndex = '10000';
    closeButton.style.border = 'none';
    closeButton.style.background = 'hsl(var(--destructive))';
    closeButton.style.color = 'hsl(var(--destructive-foreground))';
    closeButton.style.borderRadius = '4px';
    closeButton.style.padding = '8px 12px';
    closeButton.style.cursor = 'pointer';

    const saveButton = document.createElement('button');
    saveButton.innerHTML = 'Save';
    saveButton.style.position = 'absolute';
    saveButton.style.top = '10px';
    saveButton.style.right = '60px';
    saveButton.style.zIndex = '10000';
    saveButton.style.border = 'none';
    saveButton.style.background = 'hsl(var(--primary))';
    saveButton.style.color = 'hsl(var(--primary-foreground))';
    saveButton.style.borderRadius = '4px';
    saveButton.style.padding = '8px 12px';
    saveButton.style.cursor = 'pointer';

    editorContainer.appendChild(closeButton);
    editorContainer.appendChild(saveButton);
    modal.appendChild(editorContainer);
    document.body.appendChild(modal);

    // Dynamic import of Excalidraw
    import('@excalidraw/excalidraw').then(({ Excalidraw }) => {
      const excalidrawContainer = document.createElement('div');
      excalidrawContainer.style.height = '100%';
      excalidrawContainer.style.width = '100%';
      editorContainer.appendChild(excalidrawContainer);

      // Mount Excalidraw (simplified version)
      const handleSave = () => {
        // In real implementation, get data from Excalidraw instance
        this.data.elements = []; // Get from Excalidraw
        this.data.appState = {}; // Get from Excalidraw
        this.renderExcalidrawContent();
        document.body.removeChild(modal);
      };

      closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
      });

      saveButton.addEventListener('click', handleSave);
    });
  }

  private renderExcalidrawContent() {
    this.wrapper.innerHTML = `
      <div class="relative">
        <div class="absolute top-2 right-2 z-10">
          <button class="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
            Edit
          </button>
        </div>
        <div class="bg-muted rounded p-4 text-center text-muted-foreground">
          <p>Excalidraw Drawing (${this.data.elements.length} elements)</p>
          <p class="text-xs mt-1">Click Edit to modify</p>
        </div>
      </div>
    `;

    const editButton = this.wrapper.querySelector('button');
    editButton?.addEventListener('click', () => this.openExcalidrawEditor());
  }

  save() {
    return this.data;
  }

  static get isReadOnlySupported() {
    return true;
  }
}