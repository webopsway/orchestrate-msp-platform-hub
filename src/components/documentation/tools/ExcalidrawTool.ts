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
    this.data = (data as ExcalidrawData) || { elements: [], appState: { viewBackgroundColor: '#ffffff' } };
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
    this.wrapper.style.position = 'relative';

    // Create placeholder or show existing content
    if (!this.data.elements || this.data.elements.length === 0) {
      this.wrapper.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
          <div class="text-6xl">🎨</div>
          <div class="text-center">
            <p class="text-lg font-medium mb-2">Diagramme Excalidraw</p>
            <p class="text-sm mb-4">Créez des diagrammes et dessins interactifs</p>
            <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Créer un diagramme
            </button>
          </div>
        </div>
      `;
      
      const button = this.wrapper.querySelector('button');
      button?.addEventListener('click', () => this.openExcalidrawEditor());
    } else {
      this.renderExcalidrawPreview();
    }

    return this.wrapper;
  }

  private renderExcalidrawPreview() {
    this.wrapper.innerHTML = `
      <div class="relative h-full">
        <div class="absolute top-2 right-2 z-10 space-x-2">
          <button class="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors">
            Modifier
          </button>
        </div>
        <div class="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
          <div class="text-4xl">📊</div>
          <div class="text-center">
            <p class="font-medium">Diagramme Excalidraw</p>
            <p class="text-sm">${this.data.elements?.length || 0} éléments</p>
          </div>
        </div>
      </div>
    `;

    const editButton = this.wrapper.querySelector('button');
    editButton?.addEventListener('click', () => this.openExcalidrawEditor());
  }

  private openExcalidrawEditor() {
    // Create fullscreen modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const editorContainer = document.createElement('div');
    editorContainer.style.cssText = `
      width: 95vw;
      height: 95vh;
      background-color: white;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    `;

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50px;
      background: hsl(var(--background));
      border-bottom: 1px solid hsl(var(--border));
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 1000;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Éditeur Excalidraw';
    title.style.cssText = 'margin: 0; font-size: 16px; font-weight: 600;';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px;';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Sauvegarder';
    saveButton.style.cssText = `
      padding: 6px 12px;
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fermer';
    closeButton.style.cssText = `
      padding: 6px 12px;
      background: hsl(var(--secondary));
      color: hsl(var(--secondary-foreground));
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(closeButton);
    toolbar.appendChild(title);
    toolbar.appendChild(buttonContainer);

    // Excalidraw container
    const excalidrawContainer = document.createElement('div');
    excalidrawContainer.style.cssText = `
      position: absolute;
      top: 50px;
      left: 0;
      right: 0;
      bottom: 0;
    `;

    editorContainer.appendChild(toolbar);
    editorContainer.appendChild(excalidrawContainer);
    modal.appendChild(editorContainer);
    document.body.appendChild(modal);

    // Load Excalidraw
    import('@excalidraw/excalidraw').then(({ Excalidraw }) => {
      import('react').then(React => {
        import('react-dom/client').then(ReactDOM => {
          const root = ReactDOM.createRoot(excalidrawContainer);
          
          let currentElements = this.data.elements || [];
          let currentAppState = this.data.appState || { viewBackgroundColor: '#ffffff' };
          let currentFiles = this.data.files || {};
          
          const ExcalidrawApp = React.createElement(Excalidraw, {
            initialData: {
              elements: currentElements,
              appState: currentAppState,
              files: currentFiles
            },
            onChange: (elements: any[], appState: any, files: any) => {
              currentElements = elements;
              currentAppState = appState;
              currentFiles = files;
            }
          });

          root.render(ExcalidrawApp);

          const handleSave = () => {
            this.data = {
              elements: currentElements,
              appState: currentAppState,
              files: currentFiles
            };
            this.renderExcalidrawPreview();
            cleanup();
          };

          const cleanup = () => {
            try {
              root.unmount();
            } catch (e) {
              console.warn('Error unmounting Excalidraw:', e);
            }
            document.body.removeChild(modal);
          };

          saveButton.addEventListener('click', handleSave);
          closeButton.addEventListener('click', cleanup);
          
          // Close on backdrop click
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              cleanup();
            }
          });
        });
      });
    }).catch(error => {
      console.error('Failed to load Excalidraw:', error);
      document.body.removeChild(modal);
    });
  }

  save() {
    return this.data;
  }

  static get isReadOnlySupported() {
    return true;
  }
}