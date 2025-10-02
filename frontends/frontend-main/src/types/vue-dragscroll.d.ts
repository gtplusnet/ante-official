declare module 'vue-dragscroll' {
  import { DirectiveBinding, VNode } from 'vue';
  
  export interface DragScrollOptions {
    active?: boolean;
    x?: boolean;
    y?: boolean;
  }

  export const dragscroll: {
    mounted(el: HTMLElement, binding: DirectiveBinding, vnode: VNode): void;
    updated(el: HTMLElement, binding: DirectiveBinding, vnode: VNode): void;
    unmounted(el: HTMLElement, binding: DirectiveBinding, vnode: VNode): void;
  };
}