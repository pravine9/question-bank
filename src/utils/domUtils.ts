export const domUtils = {
  /**
   * Update element content and display style
   */
  updateElement: (selector: string, content: string, display: string = 'block'): void => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.innerHTML = content;
      element.style.display = display;
    }
  },

  /**
   * Create a button element with common properties
   */
  createButton: (text: string, className: string, dataset: Record<string, string> = {}): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    Object.entries(dataset).forEach(([key, value]) => {
      button.dataset[key] = value;
    });
    return button;
  },

  /**
   * Create an input element with common properties
   */
  createInput: (type: string, className: string, placeholder: string): HTMLInputElement => {
    const input = document.createElement('input');
    input.type = type;
    input.className = className;
    input.placeholder = placeholder;
    return input;
  },

  /**
   * Create a textarea element with common properties
   */
  createTextarea: (className: string, placeholder: string, rows: number = 4): HTMLTextAreaElement => {
    const textarea = document.createElement('textarea');
    textarea.className = className;
    textarea.placeholder = placeholder;
    textarea.rows = rows;
    return textarea;
  },

  /**
   * Clear element content
   */
  clearElement: (selector: string): void => {
    const element = document.querySelector(selector);
    if (element) {
      element.innerHTML = '';
    }
  },

  /**
   * Hide element
   */
  hideElement: (selector: string): void => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.style.display = 'none';
    }
  }
};

