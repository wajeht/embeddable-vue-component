import { createApp, defineCustomElement, h, getCurrentInstance } from 'vue';
import App from './App.vue';

const app = createApp(App);

const FeedbackWidget = defineCustomElement({
  render: () => h(App),
  styles: App.styles,
  props: {},
  setup() {
    const instance = getCurrentInstance();
    Object.assign(instance?.appContext, app._context);
    Object.assign(instance?.provides, app._context.provides);
  },
});

customElements.define('feedback-widget', FeedbackWidget);
