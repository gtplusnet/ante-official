export interface TemplateData {
  approver: {
    name: string;
    email: string;
  };
  company: {
    name: string;
    logo?: string;
  };
  approval: {
    title: string;
    description: string;
    details: Record<string, any>;
    actions: ActionButton[];
  };
  baseUrl: string;
  token: string;
}

export interface ActionButton {
  action: string;
  label: string;
  url: string;
  style: string;
  type: 'primary' | 'secondary' | 'danger';
}

export interface TemplateConfig {
  name: string;
  subject: string;
  path: string;
  description?: string;
}

export interface RenderContext {
  templateName: string;
  data: TemplateData;
  compileOptions?: any;
}
